"""Real PostgreSQL four-act API acceptance and frozen-contract verification."""

import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from pathlib import Path
from types import SimpleNamespace

import pytest
import yaml
from httpx import ASGITransport, AsyncClient
from jsonschema import Draft202012Validator
from psycopg import sql
from pydantic import ValidationError
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from veriq_cedar.cedar.accounts.auth import CustomerIdentity
from veriq_cedar.cedar.accounts.seed import mint_session, seed, seed_customer
from veriq_cedar.cedar.adapters.synthetic import SyntheticEvents
from veriq_cedar.cedar.complaints.delivery import ComplaintDelivery
from veriq_cedar.cedar.complaints.models import ComplaintOutbox
from veriq_cedar.cedar.complaints.service import ComplaintInput, Complaints
from veriq_cedar.cedar.simulator.network import SyntheticNetwork
from veriq_cedar.cedar.transfers.contracts import TransferInput
from veriq_cedar.cedar.transfers.dispatcher import Dispatcher
from veriq_cedar.cedar.transfers.service import Banking
from veriq_cedar.composition.g2 import components, mint_staff
from veriq_cedar.integration.cases import CaseEvent
from veriq_cedar.main import create_app
from veriq_cedar.platform.database.session import DatabaseDomain, DatabaseRegistry
from veriq_cedar.platform.logging import configure_logging
from veriq_cedar.veriq.investigations.cases import CaseReceiver
from veriq_cedar.veriq.knowledge.models import Entity, Relationship, Source
from veriq_cedar.veriq.knowledge.service import MAX_BYTES, Knowledge
from veriq_cedar.veriq.operations.service import EventProcessor
from veriq_cedar.veriq.persistence.operational import Job
from veriq_cedar.veriq.persistence.pitch import CaseInvestigation, CaseReceipt

pytestmark = pytest.mark.postgres
ROOT = Path(__file__).resolve().parents[3]
CONTRACT = yaml.safe_load((ROOT / "contracts/openapi.yaml").read_text())


class Context(SimpleNamespace):
    def __repr__(self):
        return "<pitch fixture; tokens hidden>"


@pytest.fixture
def pitch(runtime_settings, migrated):
    with Session(migrated) as session, session.begin():
        seed(session)
        seed_customer(session, "CED-CUST-002", "CED-ACC-002", "Other fictional customer")
        customer, _ = mint_session(session, "CED-CUST-001")
        other, _ = mint_session(session, "CED-CUST-002")
        staff = mint_staff(session)
        foreign = mint_staff(session, "OTHER")
    registry = DatabaseRegistry(runtime_settings)
    c = registry.sessions[DatabaseDomain.CEDAR]
    v = registry.sessions[DatabaseDomain.VERIQ]
    try:
        yield Context(
            settings=runtime_settings,
            admin=migrated,
            registry=registry,
            c=c,
            v=v,
            customer=customer,
            other=other,
            staff=staff,
            foreign=foreign,
            bank=Banking(c),
            ada=CustomerIdentity("CED", "CED-CUST-001"),
            dispatcher=Dispatcher(
                c, SyntheticNetwork(registry.sessions[DatabaseDomain.SIMULATOR], "CED")
            ),
        )
    finally:
        registry.dispose()


def contract(response, path, method="get"):
    assert response.status_code in (200, 201, 202), response.text
    schema = CONTRACT["paths"][path][method]["responses"][str(response.status_code)]["content"][
        "application/json"
    ]["schema"]
    Draft202012Validator({**schema, "components": CONTRACT["components"]}).validate(response.json())
    return response.json()


def telemetry(p):
    source = SyntheticEvents.from_fixture(ROOT / "contracts/demo.json", datetime.now(UTC))
    processor = EventProcessor(p.v, source.principal)
    for event in source.read_events():
        processor.accept(event)


def request(bank="ELM"):
    return TransferInput(
        beneficiary_bank_id=bank,
        beneficiary_account_id="ELM-ACC-009" if bank == "ELM" else "BIR-ACC-001",
        amount_kobo=5_000_000,
    )


def transfer(p, bank="ELM"):
    identifier = p.bank.create(p.ada, "pitch-" + bank, request(bank))
    p.dispatcher.run_once(identifier)
    return identifier


def drain(p):
    delivery, worker = components(p.registry)
    for _ in range(40):
        a = delivery.run_once()
        b = worker.run_once()
        if not a and not b:
            return
    pytest.fail("Worker failed to quiesce")


@pytest.mark.anyio
async def test_four_act_pitch_api_contract_and_actual_context(pitch):
    p = pitch
    app = create_app(p.settings)
    async with (
        app.router.lifespan_context(app),
        AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client,
    ):
        client.cookies.set("cedar_demo_session", p.staff)
        for name in [
            "services.json",
            "dependencies.csv",
            "routes.json",
            "historical_incidents.md",
            "operations_sop.txt",
        ]:
            body = (ROOT / "fixtures/onboarding" / name).read_bytes()
            response = await client.post(
                "/v1/veriq/banks/CED/sources",
                files={"file": (name, body, "application/octet-stream")},
                data={"source_kind": "PITCH_FIXTURE"},
            )
            registered = contract(response, "/v1/veriq/banks/{bankId}/sources", "post")
            assert registered["status"] == (
                "PARSED" if name.endswith((".json", ".csv")) else "UPLOADED"
            )
        ctx = contract(
            await client.get("/v1/veriq/banks/CED/context"), "/v1/veriq/banks/{bankId}/context"
        )
        assert ctx["source_count"] == 5 and ctx["entity_counts"] == {
            "BANK": 3,
            "SERVICE": 2,
            "ROUTE": 2,
        }
        assert ctx["context_version"] == 5 and ctx["verified_count"] == 0
        edges = contract(
            await client.get("/v1/veriq/banks/CED/relationships"),
            "/v1/veriq/banks/{bankId}/relationships",
        )
        assert len(edges) == 10 and {("CED", "G2"), ("G2", "ELM")} <= {
            (e["from_entity_id"], e["to_entity_id"]) for e in edges
        }
        assert all(
            e["status"] == "DOCUMENTED" and e["source_id"] and e["evidence_ids"] for e in edges
        )
        sources = contract(
            await client.get("/v1/veriq/banks/CED/sources"), "/v1/veriq/banks/{bankId}/sources"
        )
        for source in sources:
            assert (
                source["checksum_sha256"]
                == sha256(
                    (ROOT / "fixtures/onboarding" / source["filename"]).read_bytes()
                ).hexdigest()
            )
            claims = await client.get(
                "/v1/veriq/banks/CED/sources/" + source["source_id"] + "/claims"
            )
            assert contract(claims, "/v1/veriq/banks/{bankId}/sources/{sourceId}/claims") == []
        telemetry(p)
        ops = contract(
            await client.get("/v1/veriq/banks/CED/operations"),
            "/v1/veriq/banks/{bankId}/operations",
        )
        assert {x["service_id"]: x["status"] for x in ops} == {"G2": "DEGRADED", "G3": "NORMAL"}
        incidents = contract(
            await client.get("/v1/veriq/banks/CED/incidents"), "/v1/veriq/banks/{bankId}/incidents"
        )
        assert (
            len(incidents) == 1
            and incidents[0]["case_ids"] == []
            and incidents[0]["status"] == "SUSPECTED"
        )
        contract(
            await client.get("/v1/veriq/banks/CED/incidents/" + incidents[0]["id"]),
            "/v1/veriq/banks/{bankId}/incidents/{incidentId}",
        )
        client.cookies.set("cedar_demo_session", p.customer)
        response = await client.post(
            "/v1/cedar/transfers",
            json=request().model_dump(),
            headers={"Idempotency-Key": "pitch-http-hero"},
        )
        t = contract(response, "/v1/cedar/transfers", "post")
        assert t["financial_outcome"] == "UNKNOWN"
        response = await client.post(
            "/v1/cedar/complaints",
            json={
                "transfer_id": t["id"],
                "description": "My fictional Elm transfer timed out; please investigate.",
            },
        )
        complaint = contract(response, "/v1/cedar/complaints", "post")
        assert complaint["customer_safe_updates"] == [] and complaint["status"] == "OPEN"
        contract(
            await client.get("/v1/cedar/complaints/" + complaint["id"]),
            "/v1/cedar/complaints/{caseId}",
        )
        # No investigate button/request precedes durable automatic investigation.
        drain(p)
        client.cookies.set("cedar_demo_session", p.staff)
        inv = contract(
            await client.get("/v1/veriq/banks/CED/cases/" + complaint["id"]),
            "/v1/veriq/banks/{bankId}/cases/{caseId}",
        )
        assert inv["financial_outcome"] == "UNKNOWN" and inv["ai_result"] is None
        assert inv["status"] == "EVIDENCE_READY_AI_UNAVAILABLE" and inv["incident_ids"] == [
            incidents[0]["id"]
        ]
        assert any(e["kind"] == "DOCUMENTED_RELATIONSHIP" for e in inv["evidence"])
        assert all(
            e["id"] and e["citation"] and e["source_system"] and e["observed_at"]
            for e in inv["evidence"]
        )
        assert not any(
            x in json.dumps(inv)
            for x in ["recipient_credits", "private_ground_truth", "credited_kobo"]
        )
        with p.v() as session:
            internal = session.scalar(select(CaseInvestigation))
            assert internal.id != complaint["id"] and internal.id != incidents[0]["id"]
        actions = await client.post("/v1/veriq/banks/CED/cases/" + complaint["id"] + "/investigate")
        contract(actions, "/v1/veriq/banks/{bankId}/cases/{caseId}/investigate", "post")
        with p.v() as session:
            assert session.scalar(select(func.count()).select_from(CaseInvestigation)) == 1


@pytest.mark.anyio
async def test_staff_bank_scope_and_customer_privilege_denial(pitch):
    p = pitch
    telemetry(p)
    app = create_app(p.settings)
    async with (
        app.router.lifespan_context(app),
        AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client,
    ):
        assert (await client.get("/v1/veriq/banks/CED/operations")).status_code == 401
        for token in (p.customer, p.foreign):
            client.cookies.set("cedar_demo_session", token)
            assert (await client.get("/v1/veriq/banks/CED/operations")).status_code == 403
        client.cookies.set("cedar_demo_session", p.staff)
        assert (await client.get("/v1/veriq/banks/OTHER/incidents")).status_code == 403
        assert (await client.get("/v1/cedar/accounts/me")).status_code == 401
        assert (await client.get("/v1/veriq/banks/CED/incidents/nonexistent")).status_code == 404


@pytest.mark.anyio
async def test_complaint_owner_only_and_persistence_when_veriq_offline(pitch, monkeypatch):
    p = pitch
    t = transfer(p)
    app = create_app(p.settings)

    def offline(*args, **kwargs):
        raise ConnectionError("Veriq and AI unavailable")

    monkeypatch.setattr(CaseReceiver, "accept", offline)
    async with (
        app.router.lifespan_context(app),
        AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            cookies={"cedar_demo_session": p.customer},
        ) as client,
    ):
        result = await client.post(
            "/v1/cedar/complaints",
            json={"transfer_id": t, "description": "Timeout complaint must persist offline."},
        )
        assert result.status_code == 201
        case = result.json()["id"]
        assert (await client.get("/v1/cedar/complaints/" + case)).status_code == 200
        client.cookies.set("cedar_demo_session", p.other)
        assert (await client.get("/v1/cedar/complaints/" + case)).status_code == 404
        assert (
            await client.post(
                "/v1/cedar/complaints", json={"transfer_id": t, "description": "Not my transfer"}
            )
        ).status_code == 404
        client.cookies.clear()
        assert (await client.get("/v1/cedar/complaints/" + case)).status_code == 401
    delivery, _ = components(p.registry)
    assert delivery.run_once()
    with p.c() as session:
        assert session.scalar(select(ComplaintOutbox)).state == "RETRY_WAIT"
    with p.v() as session:
        assert session.scalar(select(func.count()).select_from(CaseInvestigation)) == 0


def test_event_replay_concurrent_dedup_and_crash_after_receiver_commit(pitch):
    p = pitch
    t = transfer(p)
    c = Complaints(p.c).create(
        p.ada, ComplaintInput(transfer_id=t, description="Durable replay test complaint")
    )
    with p.c() as session:
        row = session.scalar(select(ComplaintOutbox))
        event = CaseEvent.model_validate(row.payload)
    receiver = CaseReceiver(p.v)
    with ThreadPoolExecutor(max_workers=3) as pool:
        ids = list(pool.map(lambda _: receiver.accept(event), range(6)))
    assert len(set(ids)) == 1
    with p.v() as session:
        assert session.scalar(select(func.count()).select_from(CaseInvestigation)) == 1
        assert session.scalar(select(func.count()).select_from(CaseReceipt)) == 1
    # Receiver committed before sender ack. Normal queued delivery retries safely.
    drain(p)
    with p.v() as session:
        inv = session.scalar(select(CaseInvestigation))
        assert inv.bundle["financial_outcome"] == "UNKNOWN"
        assert inv.case_id == c["id"]
    with pytest.raises(ValueError):
        receiver.accept(event.model_copy(update={"financial_outcome": "CREDIT_CONFIRMED"}))
    with pytest.raises(PermissionError):
        receiver.accept(event.model_copy(update={"bank_id": "OTHER"}))
    with pytest.raises(ValidationError):
        CaseEvent.model_validate(
            {
                **event.model_dump(),
                "evidence": [
                    {**event.evidence[0].model_dump(), "data": {"private_ground_truth": "CANARY"}}
                ],
            }
        )


def test_birch_and_out_of_window_never_link_to_g2(pitch):
    p = pitch
    telemetry(p)
    t = transfer(p, "BIR")
    complaint = Complaints(p.c).create(
        p.ada, ComplaintInput(transfer_id=t, description="G2 Elm words do not make a Birch link.")
    )
    drain(p)
    with p.v() as session:
        inv = session.scalar(
            select(CaseInvestigation).where(CaseInvestigation.case_id == complaint["id"])
        )
        assert inv.incident_ids == [] and inv.bundle["incident_ids"] == []
    with p.c() as session:
        row = session.scalar(select(ComplaintOutbox))
        event = CaseEvent.model_validate(row.payload)
    # Exact route/service alone is insufficient without temporal supporting evidence.
    modified = event.model_copy(
        update={
            "case_id": "unrelated-old-case",
            "event_id": "old-case-event",
            "route_id": "ROUTE-CED-ELM-G2",
            "service_id": "G2",
            "transfer_at": event.transfer_at - timedelta(days=1),
            "evidence": tuple(
                e.model_copy(
                    update={"data": {**e.data, "route_id": "ROUTE-CED-ELM-G2", "service_id": "G2"}}
                )
                for e in event.evidence
            ),
        }
    )
    CaseReceiver(p.v).accept(modified)
    drain(p)
    with p.v() as session:
        assert (
            session.scalar(
                select(CaseInvestigation).where(CaseInvestigation.case_id == "unrelated-old-case")
            ).incident_ids
            == []
        )


@pytest.mark.anyio
async def test_upload_limits_validation_dedupe_and_failed_parse_is_durable(pitch):
    p = pitch
    app = create_app(p.settings)
    async with (
        app.router.lifespan_context(app),
        AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            cookies={"cedar_demo_session": p.staff},
        ) as client,
    ):

        async def upload(name, body):
            return await client.post(
                "/v1/veriq/banks/CED/sources",
                files={"file": (name, body)},
                data={"source_kind": "PITCH_FIXTURE"},
            )

        assert (await upload("private.exe", b"test")).status_code == 422
        assert (await upload("services.json", b"\xff")).status_code == 422
        assert (await upload("operations_sop.txt", b"A" * 300000)).status_code == 413
        assert (await upload("operations_sop.txt", b"A" * (MAX_BYTES + 1))).status_code == 422
        body = (ROOT / "fixtures/onboarding/services.json").read_bytes()
        first = await upload("services.json", body)
        second = await upload("services.json", body)
        assert first.json() == second.json()
        invalid = await upload(
            "dependencies.csv", b"from_entity_id,to_entity_id,type\nMISSING,G2,USES\n"
        )
        assert invalid.status_code == 202 and invalid.json()["status"] == "FAILED"
        with p.v() as session:
            source = session.get(Source, ("CED", invalid.json()["source_id"]))
            assert source.content.startswith(b"from_entity_id") and source.job_state == "FAILED"
            assert session.scalar(select(func.count()).select_from(Source)) == 2
            assert session.scalar(select(func.count()).select_from(Relationship)) == 0
            assert session.scalar(select(func.count()).select_from(Entity)) == 5
        assert (await client.get("/v1/veriq/banks/OTHER/sources")).status_code == 403
        assert (
            await client.post(
                "/v1/veriq/banks/CED/sources",
                files={"file": ("services.json", body)},
                data={"source_kind": "PITCH_FIXTURE"},
                headers={"Origin": "https://untrusted.example"},
            )
        ).status_code == 403


def test_unstructured_not_fake_extracted_and_context_version_dedup(pitch):
    p = pitch
    knowledge = Knowledge(p.v)
    content = (ROOT / "fixtures/onboarding/historical_incidents.md").read_bytes()
    first = knowledge.register("CED", "historical_incidents.md", "HISTORICAL_INCIDENT", content)
    assert (
        knowledge.register("CED", "historical_incidents.md", "HISTORICAL_INCIDENT", content)
        == first
    )
    assert knowledge.context("CED")["context_version"] == 1
    assert knowledge.context("CED")["verified_count"] == 0
    with p.v() as session:
        source = session.get(Source, ("CED", first["source_id"]))
        assert source.job_state == "AI_UNAVAILABLE" and source.method == "NONE"
        assert source.content == content
    assert knowledge.context("OTHER")["source_count"] == 0


def test_new_case_evidence_fences_stale_job_and_worker_crash_recovers(pitch):
    p = pitch
    t = transfer(p)
    Complaints(p.c).create(
        p.ada, ComplaintInput(transfer_id=t, description="Evidence revision and lease test.")
    )
    delivery, worker = components(p.registry)
    delivery.run_once()
    old = worker.claim()
    assert old.kind == "CASE_ANALYSIS"
    with p.c() as session:
        event = CaseEvent.model_validate(session.scalar(select(ComplaintOutbox)).payload)
    newer = event.model_copy(
        update={
            "event_id": "new-bank-evidence",
            "observed_at": event.observed_at + timedelta(seconds=1),
        }
    )
    CaseReceiver(p.v).accept(newer)
    assert worker.finish(old)
    drain(p)
    with p.v() as session:
        inv = session.scalar(select(CaseInvestigation))
        assert inv.revision == 2
        assert inv.bundle["financial_outcome"] == "UNKNOWN"
        assert session.get(Job, ("CED", old.job_id)).last_error == "SUPERSEDED"


def test_case_expired_worker_and_sender_lease_recover_without_duplicates(pitch):
    p = pitch
    t = transfer(p)
    Complaints(p.c).create(
        p.ada, ComplaintInput(transfer_id=t, description="Interrupted automatic case handoff.")
    )
    with p.admin.begin() as connection:
        connection.execute(
            text(
                "UPDATE cedar.complaint_outbox SET state='LEASED', attempts=1, generation=1, "
                "lease_until=clock_timestamp()-interval '1 second'"
            )
        )
    delivery, old_worker = components(p.registry)
    assert delivery.run_once()
    old = old_worker.claim()
    assert old and old.kind == "CASE_ANALYSIS"
    with p.admin.begin() as connection:
        connection.execute(
            text(
                "UPDATE veriq.investigation_jobs "
                "SET lease_until=clock_timestamp()-interval '1 second' "
                "WHERE id=:id"
            ),
            {"id": old.job_id},
        )
    _, new_worker = components(p.registry)
    current = new_worker.claim()
    assert current.job_id == old.job_id
    assert not old_worker.finish(old)
    assert new_worker.finish(current)
    with p.v() as session:
        assert session.scalar(select(func.count()).select_from(CaseInvestigation)) == 1
        assert session.scalar(select(func.count()).select_from(CaseReceipt)) == 1
        assert session.get(Job, ("CED", old.job_id)).attempts == 2


@pytest.mark.parametrize(
    "row",
    [
        "G2,ELM,UNSUPPORTED",
        "G2,ELM,CAUSED_BY",
        "G2,ELM,DESTINATION",  # Valid only in the route adapter.
        "G2,ELM,uses",  # Vocabulary is exact and case-sensitive.
        "ELM,G2,CONNECTS_TO",  # Supported word, reversed endpoint types.
        "CED,ELM,USES",  # Bank cannot use a bank as a service.
    ],
)
def test_dependency_semantics_reject_entire_file_with_provenance(pitch, row):
    p = pitch
    knowledge = Knowledge(p.v)
    knowledge.register(
        "CED",
        "services.json",
        "PITCH_FIXTURE",
        (ROOT / "fixtures/onboarding/services.json").read_bytes(),
    )
    valid = (ROOT / "fixtures/onboarding/dependencies.csv").read_bytes()
    knowledge.register("CED", "dependencies.csv", "PITCH_FIXTURE", valid)
    before = knowledge.relationships("CED")
    # Two valid rows precede the adversarial row; neither may survive the savepoint.
    body = (
        "from_entity_id,to_entity_id,type\nCED,G2,USES\nG2,ELM,CONNECTS_TO\n" + row + "\n"
    ).encode()
    result = knowledge.register("CED", "dependencies.csv", "PITCH_FIXTURE", body)
    assert result["status"] == "FAILED"
    assert knowledge.relationships("CED") == before
    with p.v() as session:
        source = session.get(Source, ("CED", result["source_id"]))
        assert source.content == body and source.checksum == sha256(body).hexdigest()
        assert source.error_code == "SOURCE_VALIDATION_FAILED"
        assert source.job_state == "FAILED"
        assert not session.scalar(select(Relationship).where(Relationship.source_id == source.id))
    assert all(e["source_id"] != result["source_id"] for e in before)


@pytest.mark.parametrize("field", ["service_id", "from_bank_id", "to_bank_id"])
def test_route_adapter_rejects_wrong_endpoint_type_atomically(pitch, field):
    p = pitch
    knowledge = Knowledge(p.v)
    knowledge.register(
        "CED",
        "services.json",
        "PITCH_FIXTURE",
        (ROOT / "fixtures/onboarding/services.json").read_bytes(),
    )
    data = json.loads((ROOT / "fixtures/onboarding/routes.json").read_bytes())
    data["routes"][1][field] = "CED" if field == "service_id" else "G2"
    result = knowledge.register("CED", "routes.json", "PITCH_FIXTURE", json.dumps(data).encode())
    assert result["status"] == "FAILED"
    assert knowledge.relationships("CED") == []
    # The first complete route and the invalid route entity are also rolled back.
    assert knowledge.context("CED")["entity_counts"] == {"BANK": 3, "SERVICE": 2}


@pytest.mark.parametrize("exhaust", [False, True])
def test_complaint_failure_diagnostics_bounded_retry_and_safe_recovery(pitch, capsys, exhaust):
    p = pitch
    configure_logging("INFO")
    t = transfer(p)
    report = "PRIVATE-COMPLAINT-CANARY never include in worker logs"
    complaint = Complaints(p.c).create(p.ada, ComplaintInput(transfer_id=t, description=report))
    receiver = CaseReceiver(p.v)
    poison = "postgresql://secret-user:SECRET-TOKEN@private/db " + report

    class Offline:
        def accept(self, event):
            # Simulate receiver commit followed by lost acknowledgement on each retry.
            receiver.accept(event)
            raise ConnectionError(poison)

    delivery = ComplaintDelivery(p.c, Offline())
    rounds = 5 if exhaust else 2
    with p.c() as session:
        original = session.scalar(select(ComplaintOutbox)).payload
    for attempt in range(1, rounds + 1):
        assert delivery.run_once()
        with p.c() as session:
            outbox = session.scalar(select(ComplaintOutbox))
            assert outbox.state == ("DEAD_LETTER" if attempt == 5 else "RETRY_WAIT")
            assert outbox.attempts == attempt and outbox.generation == attempt
            assert outbox.lease_until is None and outbox.payload == original
            assert outbox.available_at > datetime.now(UTC)
            delivery_id = outbox.id
        records = [json.loads(line) for line in capsys.readouterr().out.splitlines() if line]
        record = next(r for r in records if r["event"] == "complaint_delivery.completed")
        assert record["error_code"] == "DELIVERY_UNAVAILABLE"
        assert record["delivery_id"] == delivery_id and record["attempts"] == attempt
        assert record["generation"] == attempt
        assert record["delivery_state"] == outbox.state
        assert record["level"] == ("ERROR" if attempt == 5 else "WARNING")
        assert all(x not in json.dumps(records) for x in (report, "SECRET-TOKEN", "postgresql"))
        # No eager retry before persisted backoff, nor an automatic dead-letter loop.
        assert not delivery.run_once()
        if attempt < rounds:
            with p.c.begin() as session:
                session.scalar(select(ComplaintOutbox)).available_at = datetime.now(
                    UTC
                ) - timedelta(seconds=1)
    delivery.receiver = receiver  # Underlying outage corrected.
    if exhaust:
        assert not delivery.run_once()  # Exhausted records require explicit operator replay.
    with p.admin.begin() as connection:
        # Controlled maintenance on this one synthetic delivery, never a data reset.
        connection.execute(
            text(
                "UPDATE cedar.complaint_outbox SET state='RETRY_WAIT', attempts=:attempts, "
                "available_at=clock_timestamp()-interval '1 second' WHERE id=:id"
            ),
            {"id": delivery_id, "attempts": 0 if exhaust else rounds},
        )
    assert delivery.run_once()
    records = [json.loads(line) for line in capsys.readouterr().out.splitlines() if line]
    record = next(r for r in records if r["event"] == "complaint_delivery.completed")
    assert record["delivery_state"] == "SUCCEEDED" and "error_code" not in record
    with p.c() as session:
        outbox = session.scalar(select(ComplaintOutbox))
        assert outbox.state == "SUCCEEDED" and outbox.payload == original
        assert outbox.generation == rounds + 1
    with p.v() as session:
        assert session.scalar(select(func.count()).select_from(CaseReceipt)) == 1
        assert session.scalar(select(func.count()).select_from(CaseInvestigation)) == 1
        assert session.scalar(select(CaseInvestigation)).case_id == complaint["id"]
    assert not delivery.run_once()


def test_exhausted_expired_complaint_lease_logs_terminal_state(pitch, capsys):
    p = pitch
    configure_logging("INFO")
    t = transfer(p)
    Complaints(p.c).create(
        p.ada, ComplaintInput(transfer_id=t, description="Exhausted crashed worker")
    )
    with p.admin.begin() as connection:
        connection.execute(
            text(
                "UPDATE cedar.complaint_outbox SET state='LEASED', attempts=5, generation=5, "
                "lease_until=clock_timestamp()-interval '1 second'"
            )
        )
    delivery, _ = components(p.registry)
    assert delivery.run_once()
    record = json.loads(capsys.readouterr().out.strip())
    assert record["error_code"] == "ATTEMPTS_EXHAUSTED"
    assert record["delivery_state"] == "DEAD_LETTER" and record["attempts"] == 5
    with p.c() as session:
        outbox = session.scalar(select(ComplaintOutbox))
        assert outbox.state == "DEAD_LETTER" and outbox.lease_until is None
    with p.v() as session:
        assert session.scalar(select(func.count()).select_from(CaseReceipt)) == 0
    assert not delivery.run_once()


def test_complaint_stale_failure_cannot_overwrite_recovered_delivery(pitch, capsys):
    p = pitch
    configure_logging("INFO")
    t = transfer(p)
    Complaints(p.c).create(
        p.ada, ComplaintInput(transfer_id=t, description="Complaint sender generation fencing")
    )
    successor, _ = components(p.registry)

    class LostLease:
        def accept(self, event):
            with p.admin.begin() as connection:
                connection.execute(
                    text(
                        "UPDATE cedar.complaint_outbox "
                        "SET lease_until=clock_timestamp()-interval '1 second'"
                    )
                )
            assert successor.run_once()
            raise RuntimeError("UNTRUSTED-SECRET-EXCEPTION")

    assert ComplaintDelivery(p.c, LostLease()).run_once()
    records = [json.loads(line) for line in capsys.readouterr().out.splitlines() if line]
    assert [(r["delivery_state"], r["generation"]) for r in records] == [
        ("SUCCEEDED", 2),
        ("STALE_ACK", 1),
    ]
    assert records[-1]["error_code"] == "DELIVERY_UNEXPECTED_ERROR"
    assert "UNTRUSTED-SECRET-EXCEPTION" not in json.dumps(records)
    with p.c() as session:
        row = session.scalar(select(ComplaintOutbox))
        assert row.state == "SUCCEEDED" and row.generation == 2 and row.attempts == 2
    with p.v() as session:
        assert session.scalar(select(func.count()).select_from(CaseReceipt)) == 1
        assert session.scalar(select(func.count()).select_from(CaseInvestigation)) == 1


def test_standalone_worker_emits_sanitized_json_on_actual_delivery_failure(pitch, tmp_path):
    p = pitch
    t = transfer(p)
    report = "PRIVATE-COMPLAINT-WORKER-CANARY"
    Complaints(p.c).create(p.ada, ComplaintInput(transfer_id=t, description=report))
    role = p.registry.engines[DatabaseDomain.VERIQ].url.username
    env = os.environ.copy()
    env.pop("MIGRATION_DATABASE_URL", None)
    env.update(ENVIRONMENT="test", LOG_LEVEL="INFO")
    for domain in ("cedar", "veriq", "simulator"):
        env[domain.upper() + "_DATABASE_URL"] = getattr(
            p.settings, domain + "_database_url"
        ).get_secret_value()
    log_path = tmp_path / "standalone-worker.log"
    process = None
    try:
        # A real receiver database error after successful worker readiness, not a mocked sink.
        with p.admin.begin() as connection:
            connection.connection.driver_connection.execute(
                sql.SQL("REVOKE SELECT ON veriq.case_event_receipts FROM {}").format(
                    sql.Identifier(role)
                )
            )
        with log_path.open("w") as output:
            process = subprocess.Popen(
                [sys.executable, "-m", "veriq_cedar.composition.g2", "worker"],
                cwd=ROOT / "apps/backend",
                env=env,
                stdout=output,
                stderr=subprocess.STDOUT,
            )
            deadline = time.monotonic() + 15
            while time.monotonic() < deadline:
                if log_path.stat().st_size:
                    break
                assert process.poll() is None, "Standalone worker exited before delivery diagnostic"
                time.sleep(0.05)
            else:
                pytest.fail("Standalone worker emitted no delivery diagnostic")
            assert process.poll() is None
    finally:
        if process is not None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
        with p.admin.begin() as connection:
            connection.connection.driver_connection.execute(
                sql.SQL("GRANT SELECT ON veriq.case_event_receipts TO {}").format(
                    sql.Identifier(role)
                )
            )
    output = log_path.read_text()
    for domain in ("cedar", "veriq", "simulator"):
        url = p.registry.engines[
            {
                "cedar": DatabaseDomain.CEDAR,
                "veriq": DatabaseDomain.VERIQ,
                "simulator": DatabaseDomain.SIMULATOR,
            }[domain]
        ].url
        assert url.render_as_string(hide_password=False) not in output
        assert url.password not in output
    assert not any(
        value in output
        for value in (
            report,
            "postgresql",
            "Traceback",
            "permission denied",
            "SELECT ",
        )
    )
    records = [json.loads(line) for line in output.splitlines()]
    record = next(r for r in records if r["event"] == "complaint_delivery.completed")
    assert record["error_code"] == "DELIVERY_DATABASE_ERROR"
    assert record["delivery_state"] == "RETRY_WAIT"
    assert record["attempts"] == 1 and record["generation"] == 1
    assert record["level"] == "WARNING"
    with p.c() as session:
        outbox = session.scalar(select(ComplaintOutbox))
        assert outbox.id == record["delivery_id"] and outbox.state == "RETRY_WAIT"
        assert outbox.attempts == 1 and outbox.generation == 1 and outbox.lease_until is None
    with p.v() as session:
        assert session.scalar(select(func.count()).select_from(CaseReceipt)) == 0

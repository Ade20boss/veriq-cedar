"""Real PostgreSQL four-act API acceptance and frozen-contract verification."""

import json
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from pathlib import Path
from types import SimpleNamespace

import pytest
import yaml
from httpx import ASGITransport, AsyncClient
from jsonschema import Draft202012Validator
from pydantic import ValidationError
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from veriq_cedar.cedar.accounts.auth import CustomerIdentity
from veriq_cedar.cedar.accounts.seed import mint_session, seed, seed_customer
from veriq_cedar.cedar.adapters.synthetic import SyntheticEvents
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

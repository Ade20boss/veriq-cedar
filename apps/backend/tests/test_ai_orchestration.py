"""Real PostgreSQL cases, private HTTP transports and actual AI-service smoke."""

import asyncio
import copy
import json
import os
import secrets
import socket
import subprocess
import sys
import time
from datetime import timedelta

import httpx
import pytest
from jsonschema import Draft202012Validator
from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError
from test_ai_client_errors import ai_envelopes as envelope_fixture
from test_pitch import (  # noqa: F401
    CONTRACT,
    ROOT,
    contract,
    telemetry,
    transfer,
)
from test_pitch import (
    pitch as pitch_fixture,
)

from veriq_cedar.cedar.complaints.models import ComplaintOutbox
from veriq_cedar.cedar.complaints.service import ComplaintInput, Complaints
from veriq_cedar.composition.g2 import components
from veriq_cedar.integration.cases import CaseEvent
from veriq_cedar.main import create_app
from veriq_cedar.veriq.ai.client import AIClient, AIError
from veriq_cedar.veriq.ai.orchestration import build_request
from veriq_cedar.veriq.investigations.cases import CaseReceiver
from veriq_cedar.veriq.knowledge.service import Knowledge
from veriq_cedar.veriq.persistence.operational import Job
from veriq_cedar.veriq.persistence.pitch import CaseAI, CaseInvestigation

ai_envelopes = envelope_fixture
pitch = pitch_fixture
pytestmark = pytest.mark.postgres


def enqueue(p, client):
    for filename in (
        "services.json",
        "dependencies.csv",
        "routes.json",
        "historical_incidents.md",
        "operations_sop.txt",
    ):
        Knowledge(p.v).register(
            "CED", filename, "PITCH_FIXTURE", (ROOT / "fixtures/onboarding" / filename).read_bytes()
        )
    telemetry(p)
    identifier = transfer(p)
    case = Complaints(p.c).create(
        p.ada,
        ComplaintInput(
            transfer_id=identifier,
            description="Fictional complaint remains available without AI.",
        ),
    )
    delivery, worker = components(p.registry, client)
    assert delivery.run_once()
    for _ in range(20):
        with p.v() as session:
            run = session.scalar(select(CaseAI))
            if run:
                return case, worker, run.id
        assert worker.run_once()
    pytest.fail("Deterministic assembly did not queue optional AI")


def claim_ai(worker):
    for _ in range(10):
        claim = worker.claim()
        assert claim
        if claim.kind == "CASE_AI":
            return claim
        assert worker.finish(claim)
    pytest.fail("Missing AI claim")


def result(payload):
    eid = next(e["id"] for e in payload["evidence"] if e["verified_for_purpose"])
    return {
        "case_id": payload["case_id"],
        "financial_outcome": payload["financial_outcome"],
        "observations": [{"text": "The bank recorded sender-side events.", "evidence_ids": [eid]}],
        "hypotheses": [
            {
                "text": "Route conditions may explain response delays; cause is unverified.",
                "evidence_ids": [eid],
                "alternatives": ["A transaction-specific response loss is possible."],
            }
        ],
        "unknowns": ["Beneficiary-credit outcome remains unknown."],
        "recommended_checks": ["Request authorized transfer-status verification."],
        "customer_safe_update_draft": "UNREVIEWED_PROVIDER_DRAFT",
    }


def client_for(handler):
    return AIClient(
        "http://private-ai.test", "synthetic-test-key", transport=httpx.MockTransport(handler)
    )


def response(value, mode="mock"):
    return httpx.Response(200, json=value, headers={"X-Veriq-AI-Mode": mode})


def read_case(p, case):
    async def read():
        app = create_app(p.settings)
        async with (
            app.router.lifespan_context(app),
            httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app),
                base_url="http://test",
                cookies={"cedar_demo_session": p.staff},
            ) as client,
        ):
            return contract(
                await client.get("/v1/veriq/banks/CED/cases/" + case),
                "/v1/veriq/banks/{bankId}/cases/{caseId}",
            )

    return asyncio.run(read())


def test_persisted_analysis_exact_contract_no_network_transaction_and_no_customer_publish(pitch):
    p = pitch
    seen = []

    def handler(request):
        payload = json.loads(request.content)
        assert request.url.path == "/internal/ai/analyze-case"
        assert request.headers["X-Internal-Service-Key"] == "synthetic-test-key"
        Draft202012Validator(
            {
                "$ref": "#/components/schemas/AIInvestigationInput",
                "components": CONTRACT["components"],
            }
        ).validate(payload)
        with p.admin.begin() as connection:
            # Neither deterministic/job transaction nor row locks span the HTTP request.
            connection.execute(text("SELECT id FROM veriq.case_investigations FOR UPDATE NOWAIT"))
            connection.execute(text("SELECT id FROM veriq.investigation_jobs FOR UPDATE NOWAIT"))
        assert {e["kind"] for e in payload["evidence"]} == {
            "TRANSFER_STATE",
            "TRANSFER_STAGE",
            "CUSTOMER_REPORT",
            "ROUTE_METRIC_SNAPSHOT",
            "DOCUMENTED_RELATIONSHIP",
        }
        assert len(payload["known_relationships"]) == 5
        assert len(payload["historical_incidents"]) == 1
        assert payload["historical_incidents"][0]["status"] == "SUSPECTED"
        assert not any(
            v in json.dumps(payload)
            for v in ("private_ground_truth", "recipient_credits", "RECIPIENT_CREDITED")
        )
        seen.append(payload)
        return response(result(payload))

    case, worker, jid = enqueue(p, client_for(handler))
    before = read_case(p, case["id"])
    assert before["status"] == "AI_PENDING" and before["ai_result"] is None
    claim = claim_ai(worker)
    assert worker.finish(claim)
    assert not worker.finish(claim)
    public = read_case(p, case["id"])
    assert len(seen) == 1 and public["status"] == "FINDINGS_READY"
    assert public["financial_outcome"] == "UNKNOWN"
    assert public["evidence"] == before["evidence"]
    assert "MOCK_PROVIDER" in public["ai_result"]["unknowns"][-1]
    assert "UNREVIEWED_PROVIDER_DRAFT" not in public["ai_result"]["customer_safe_update_draft"]
    assert Complaints(p.c).get(p.ada, case["id"])["customer_safe_updates"] == []
    with p.v() as session:
        run = session.get(CaseAI, ("CED", jid))
        assert run.result == public["ai_result"] and run.provider_mode == "mock"
        assert run.completed_at and run.request == seen[0]
        assert session.get(Job, ("CED", jid)).state == "SUCCEEDED"


@pytest.mark.parametrize(
    "failure,code",
    [
        ("offline", "AI_UNAVAILABLE"),
        ("timeout", "AI_TIMEOUT"),
        (401, "AI_AUTH_FAILED"),
        (429, "AI_RATE_LIMITED"),
        (503, "AI_UNAVAILABLE"),
        ("provider_rate", "AI_RATE_LIMITED"),
        ("provider_auth", "AI_AUTH_FAILED"),
        ("malformed", "AI_INVALID_SCHEMA"),
        ("schema", "AI_INVALID_SCHEMA"),
        ("oversize", "AI_RESPONSE_TOO_LARGE"),
        ("invented", "AI_INVALID_EVIDENCE"),
        ("foreign", "AI_INVALID_EVIDENCE"),
        ("report", "AI_INVALID_EVIDENCE"),
        ("case", "AI_IDENTITY_MISMATCH"),
        ("outcome", "AI_IDENTITY_MISMATCH"),
        ("extra", "AI_INVALID_SCHEMA"),
        ("nested", "AI_INVALID_SCHEMA"),
        ("unsafe", "AI_UNSAFE_FINANCIAL_TEXT"),
        ("cause", "AI_UNSAFE_CAUSAL_CLAIM"),
        ("mode", "AI_INVALID_MODE"),
        ("deadline", "AI_TIMEOUT"),
    ],
)
def test_ai_failure_preserves_evidence_and_durable_retry(
    pitch, failure, code, capsys, ai_envelopes
):
    p = pitch

    async def handler(request):
        if failure in {"provider_rate", "provider_auth"}:
            envelope = ai_envelopes["429" if failure == "provider_rate" else "401"]
            return httpx.Response(envelope["status"], json=envelope["body"])
        if failure == "offline":
            raise httpx.ConnectError("DO-NOT-LOG private-service-secret")
        if failure == "timeout":
            raise httpx.ReadTimeout("DO-NOT-LOG credentials")
        if failure == "deadline":
            await asyncio.sleep(1)
        if isinstance(failure, int):
            return httpx.Response(failure, text="DO-NOT-LOG secret-error-body")
        if failure == "malformed":
            return httpx.Response(200, content=b"{invalid", headers={"X-Veriq-AI-Mode": "mock"})
        if failure == "oversize":
            return httpx.Response(200, content=b"X" * 262145)
        data = json.loads(request.content)
        value = result(data)
        if failure == "schema":
            value["observations"] = "wrong"
        if failure == "invented":
            value["observations"][0]["evidence_ids"] = ["fabricated"]
        if failure == "foreign":
            value["observations"][0]["evidence_ids"] = ["OTHER-BANK/foreign-case"]
        if failure == "report":
            value["observations"][0]["evidence_ids"] = ["case/" + data["case_id"]]
        if failure == "case":
            value["case_id"] = "other-case"
        if failure == "outcome":
            value["financial_outcome"] = "CREDIT_CONFIRMED"
        if failure == "extra":
            value["unapproved"] = True
        if failure == "nested":
            value["observations"][0]["unapproved"] = True
        if failure == "unsafe":
            value["observations"][0]["text"] = "The recipient received the money."
        if failure == "cause":
            value["hypotheses"][0]["text"] = "The root cause is a verified gateway fault."
        return response(value, "unknown" if failure == "mode" else "mock")

    client = client_for(handler)
    if failure == "deadline":
        client.timeout = 0.1
    case, worker, jid = enqueue(p, client)
    before = read_case(p, case["id"])
    for _ in range(10):
        assert worker.run_once()
        with p.v() as session:
            job = session.get(Job, ("CED", jid))
            if job.state == "RETRY_WAIT":
                assert job.last_error == code and job.attempts == 1
                break
    else:
        pytest.fail("AI failure did not become retryable")
    records = [json.loads(line) for line in capsys.readouterr().out.splitlines() if line]
    assert any(
        r.get("error_code") == code and r.get("analysis_state") == "RETRY_WAIT" for r in records
    )
    assert all(
        value not in json.dumps(records)
        for value in ("DO-NOT-LOG", "synthetic-test-key", "secret-error-body")
    )
    after = read_case(p, case["id"])
    assert after["status"] == "EVIDENCE_READY_AI_UNAVAILABLE" and after["ai_result"] is None
    assert after["financial_outcome"] == "UNKNOWN" and after["evidence"] == before["evidence"]
    with p.v() as session:
        assert session.get(CaseAI, ("CED", jid)).result is None


def test_stale_response_after_new_revision_and_crashed_lease_fenced(pitch):
    p = pitch

    def handler(request):
        data = json.loads(request.content)
        with p.c() as session:
            event = CaseEvent.model_validate(session.scalar(select(ComplaintOutbox)).payload)
        newer = event.model_copy(
            update={
                "event_id": "new-revision",
                "observed_at": event.observed_at + timedelta(seconds=1),
            }
        )
        CaseReceiver(p.v).accept(newer)
        return response(result(data))

    case, worker, jid = enqueue(p, client_for(handler))
    old = claim_ai(worker)
    # Claimed process dies before HTTP; replacement reclaims expired generation.
    with p.admin.begin() as connection:
        connection.execute(
            text(
                "UPDATE veriq.investigation_jobs "
                "SET lease_until=clock_timestamp()-interval '1 second' WHERE id=:id"
            ),
            {"id": jid},
        )
    current = claim_ai(worker)
    assert current.generation == old.generation + 1
    assert not worker.finish(old)
    assert worker.finish(current)
    with p.v() as session:
        inv = session.scalar(select(CaseInvestigation))
        assert inv.revision == 2 and inv.bundle is None
        assert session.get(CaseAI, ("CED", jid)).result is None
        assert session.get(Job, ("CED", jid)).last_error == "SUPERSEDED"


def test_exhausted_job_recovery_and_snapshot_immutability(pitch):
    p = pitch
    case, worker, jid = enqueue(p, client_for(lambda request: httpx.Response(503)))
    worker.max_attempts = 2
    for _attempt in range(2):
        claim = claim_ai(worker)
        worker.fail(claim, "AI_UNAVAILABLE")
        with p.v.begin() as session:
            job = session.get(Job, ("CED", jid))
            job.available_at = job.updated_at - timedelta(seconds=1)
    with p.v() as session:
        assert session.get(Job, ("CED", jid)).state == "DEAD_LETTER"
    assert worker.claim() is None
    with p.v.begin() as session:
        job = session.get(Job, ("CED", jid))
        job.state, job.attempts = "RETRY_WAIT", 0
    worker.ai_client = client_for(lambda request: response(result(json.loads(request.content))))
    assert worker.finish(claim_ai(worker))
    assert read_case(p, case["id"])["status"] == "FINDINGS_READY"
    with pytest.raises(DBAPIError), p.v.begin() as session:
        run = session.get(CaseAI, ("CED", jid))
        run.request = {**run.request, "bank_id": "OTHER"}
    with pytest.raises(DBAPIError), p.v.begin() as session:
        session.get(CaseAI, ("CED", jid)).result = {}


def test_foreign_evidence_in_snapshot_rejected_before_http(pitch):
    p = pitch
    calls = []
    case, worker, jid = enqueue(p, client_for(lambda r: calls.append(r)))
    with p.v() as session:
        inv = session.scalar(select(CaseInvestigation))
        inv.bundle = copy.deepcopy(inv.bundle)
        inv.bundle["evidence"].append({**inv.bundle["evidence"][0], "id": "foreign-bank-evidence"})
        with pytest.raises(AIError) as error:
            build_request(session, inv)
        assert str(error.value) == "AI_INPUT_SCOPE_INVALID"
    assert calls == []


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


@pytest.mark.parametrize("connected", [False, True])
def test_actual_backend_worker_http_and_ai_service_smoke(pitch, tmp_path, connected):
    p = pitch
    ai_port, backend_port = free_port(), free_port()
    ai_url, backend_url = f"http://127.0.0.1:{ai_port}", f"http://127.0.0.1:{backend_port}"
    key = secrets.token_urlsafe(32)
    case, _, jid = enqueue(p, AIClient(ai_url, key, timeout=1))
    env = os.environ.copy()
    env.pop("MIGRATION_DATABASE_URL", None)
    env.update(
        ENVIRONMENT="test",
        AI_ENABLED="true",
        AI_BASE_URL=ai_url,
        AI_SERVICE_KEY=key,
        AI_TIMEOUT_SECONDS="1",
        INTERNAL_SERVICE_KEY=key,
        LLM_PROVIDER="mock",
        LLM_API_KEY="",
        LLM_BASE_URL="",
        LLM_MODEL="",
        LOG_LEVEL="INFO",
    )
    for domain in ("cedar", "veriq", "simulator"):
        env[domain.upper() + "_DATABASE_URL"] = getattr(
            p.settings, domain + "_database_url"
        ).get_secret_value()
    processes = []

    def wait_health(url):
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            try:
                if httpx.get(url, timeout=0.5, trust_env=False).status_code == 200:
                    return
            except httpx.HTTPError:
                pass
            time.sleep(0.05)
        pytest.fail("Local cross-service HTTP process did not start")

    with (tmp_path / "services.log").open("w") as logs:

        def start(args, cwd):
            process = subprocess.Popen(
                [sys.executable, *args], cwd=cwd, env=env, stdout=logs, stderr=subprocess.STDOUT
            )
            processes.append(process)

        try:
            if connected:
                start(
                    [
                        "-m",
                        "uvicorn",
                        "app.main:app",
                        "--host",
                        "127.0.0.1",
                        "--port",
                        str(ai_port),
                        "--no-access-log",
                    ],
                    ROOT / "apps/ai",
                )
                wait_health(ai_url + "/health")
            start(
                [
                    "-m",
                    "uvicorn",
                    "veriq_cedar.main:create_app",
                    "--factory",
                    "--host",
                    "127.0.0.1",
                    "--port",
                    str(backend_port),
                    "--no-access-log",
                ],
                ROOT / "apps/backend",
            )
            wait_health(backend_url + "/ready")
            start(["-m", "veriq_cedar.composition.g2", "worker"], ROOT / "apps/backend")
            deadline = time.monotonic() + 15
            while time.monotonic() < deadline:
                r = httpx.get(
                    backend_url + "/v1/veriq/banks/CED/cases/" + case["id"],
                    cookies={"cedar_demo_session": p.staff},
                    timeout=2,
                    trust_env=False,
                )
                public = contract(r, "/v1/veriq/banks/{bankId}/cases/{caseId}")
                if public["status"] == (
                    "FINDINGS_READY" if connected else "EVIDENCE_READY_AI_UNAVAILABLE"
                ):
                    break
                time.sleep(0.05)
            else:
                pytest.fail("Cross-service case analysis did not reach expected state")
            assert public["financial_outcome"] == "UNKNOWN" and len(public["evidence"]) == 13
            if connected:
                assert public["ai_result"]["observations"] == []
                assert public["ai_result"]["hypotheses"] == []
                assert "MOCK_PROVIDER" in public["ai_result"]["unknowns"][-1]
                with p.v() as session:
                    run = session.get(CaseAI, ("CED", jid))
                    assert run.provider_mode == "mock" and run.result == public["ai_result"]
            else:
                assert public["ai_result"] is None
                with p.v() as session:
                    job = session.get(Job, ("CED", jid))
                    assert job.last_error == "AI_UNAVAILABLE" and job.state == "RETRY_WAIT"
        finally:
            for process in reversed(processes):
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)


def test_expired_http_completion_is_fenced_and_replayed_without_duplicate_result(pitch):
    p = pitch
    calls = []

    def handler(request):
        data = json.loads(request.content)
        calls.append(data)
        if len(calls) == 1:
            with p.admin.begin() as connection:
                connection.execute(
                    text(
                        "UPDATE veriq.investigation_jobs "
                        "SET lease_until=clock_timestamp()-interval '1 second' WHERE kind='CASE_AI'"
                    )
                )
        return response(result(data))

    case, worker, jid = enqueue(p, client_for(handler))
    old = claim_ai(worker)
    assert not worker.finish(old)
    with p.v() as session:
        assert session.get(CaseAI, ("CED", jid)).result is None
        assert session.scalar(select(CaseInvestigation)).bundle["ai_result"] is None
    current = claim_ai(worker)
    assert current.generation == old.generation + 1
    assert worker.finish(current)
    assert not worker.finish(old) and not worker.finish(current)
    assert calls[0] == calls[1] and len(calls) == 2
    assert read_case(p, case["id"])["status"] == "FINDINGS_READY"
    with p.v() as session:
        assert session.get(Job, ("CED", jid)).attempts == 2

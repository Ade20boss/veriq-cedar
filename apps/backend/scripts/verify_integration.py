"""Disposable-only separate-process mock integration proof; emits sanitized JSON.

Requires fresh migrated/granted DB URLs and MIGRATION_DATABASE_URL in environment.
Run from apps/backend with the repository's Python environment. Never resets data.
"""

import argparse
import json
import os
import secrets
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import httpx
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from veriq_cedar.cedar.complaints.models import ComplaintOutbox
from veriq_cedar.veriq.persistence.operational import Job
from veriq_cedar.veriq.persistence.pitch import CaseAI, CaseInvestigation

ROOT = Path(__file__).resolve().parents[3]
BACKEND = ROOT / "apps/backend"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--request-artifact",
        type=Path,
        help="Write the exact permitted synthetic v1.0 request to a new JSON file after success",
    )
    args = parser.parse_args()
    if args.request_artifact and args.request_artifact.exists():
        parser.error("Request artifact must be a new file; existing evidence is never overwritten")
    if os.environ.get("ENVIRONMENT") != "test":
        raise SystemExit("Requires ENVIRONMENT=test and a fresh disposable database")
    ai_port = int(os.environ.get("INTEGRATION_AI_PORT", "8002"))
    for port in (8000, ai_port):
        with socket.socket() as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.bind(("127.0.0.1", port))
    env = os.environ.copy()
    key = secrets.token_urlsafe(32)
    env.update(
        AI_ENABLED="true",
        AI_BASE_URL=f"http://127.0.0.1:{ai_port}",
        AI_SERVICE_KEY=key,
        INTERNAL_SERVICE_KEY=key,
        AI_TIMEOUT_SECONDS="2",
        AI_TRUSTED_ORIGINS="[]",
        LLM_PROVIDER="mock",
        LLM_API_KEY="",
        LLM_BASE_URL="",
        LLM_MODEL="",
    )
    engines = {
        domain: create_engine(env[domain.upper() + "_DATABASE_URL"], hide_parameters=True)
        for domain in ("cedar", "veriq")
    }
    processes = []
    with tempfile.TemporaryDirectory(prefix="veriq-integration-") as directory:
        private = Path(directory)
        with (private / "services.log").open("w") as log:

            def command(module, *args):
                return [sys.executable, "-m", module, *args]

            def cli(module, *args):
                return subprocess.check_output(
                    command(module, *args), cwd=BACKEND, env=env, stderr=log, text=True
                )

            def start(module, *args, ai=False):
                runtime_env = {k: v for k, v in env.items() if k != "MIGRATION_DATABASE_URL"}
                if ai:
                    # The independent AI process receives no bank database credentials.
                    runtime_env = {
                        k: v
                        for k, v in runtime_env.items()
                        if k.startswith("LLM_")
                        or k in {"PATH", "HOME", "LOG_LEVEL", "INTERNAL_SERVICE_KEY"}
                    }
                process = subprocess.Popen(
                    command(module, *args),
                    cwd=ROOT / "apps/ai" if ai else BACKEND,
                    env=runtime_env,
                    stdout=log,
                    stderr=log,
                )
                processes.append(process)
                return process

            def health(url):
                deadline = time.monotonic() + 30
                while time.monotonic() < deadline:
                    try:
                        if httpx.get(url, timeout=1, trust_env=False).status_code == 200:
                            return
                    except httpx.HTTPError:
                        pass
                    time.sleep(0.1)
                raise RuntimeError("Local service did not become ready")

            try:
                disabled = json.loads(cli("veriq_cedar.composition.g2", "replay"))
                transfer_id = disabled["act_iii"]["transfer"]["id"]
                output = {
                    "synthetic": True,
                    "ai_disabled": {
                        "source_count": disabled["act_i"]["context"]["source_count"],
                        "sources": disabled["act_i"]["sources"],
                        "case_id": disabled["act_iv"]["complaint"]["id"],
                        "incident_ids": disabled["act_iv"]["incident_ids"],
                        "evidence_ids": disabled["act_iv"]["evidence_ids"],
                        "entity_count": sum(disabled["act_i"]["context"]["entity_counts"].values()),
                        "relationship_count": disabled["act_i"]["relationship_count"],
                        "operations": {
                            v["service_id"]: v["status"] for v in disabled["act_ii"]["operations"]
                        },
                        "incident_before_complaint": not disabled["act_ii"]["incident"]["case_ids"],
                        "transfer_id": transfer_id,
                        "processing_stage": disabled["act_iii"]["transfer"]["processing_stage"],
                        "financial_outcome": disabled["act_iv"]["financial_outcome"],
                        "investigation_status": disabled["act_iv"]["investigation_status"],
                        "verification": disabled["verification"],
                    },
                }
                cookies = {}
                for role, module, action in (
                    ("customer", "g1", "mint-session"),
                    ("staff", "g2", "staff-session"),
                ):
                    path = private / (role + ".session.json")
                    cli("veriq_cedar.composition." + module, action, "--cookie-file", str(path))
                    assert path.stat().st_mode & 0o777 == 0o600
                    cookies[role] = {
                        "cedar_demo_session": json.loads(path.read_text())["cookie_value"]
                    }
                start(
                    "uvicorn",
                    "veriq_cedar.main:create_app",
                    "--factory",
                    "--host",
                    "127.0.0.1",
                    "--port",
                    "8000",
                    "--no-access-log",
                )
                health("http://127.0.0.1:8000/ready")
                gateway = os.environ.get("CADDY_BINARY")
                if gateway:
                    for port in (2019, 8080, 8081):
                        with socket.socket() as sock:
                            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                            sock.bind(("127.0.0.1", port))
                    processes.append(
                        subprocess.Popen(
                            [
                                gateway,
                                "run",
                                "--config",
                                str(ROOT / "infra/pitch/Caddyfile"),
                                "--adapter",
                                "caddyfile",
                            ],
                            env={
                                k: v
                                for k, v in env.items()
                                if k
                                in {
                                    "PATH",
                                    "HOME",
                                    "XDG_DATA_HOME",
                                    "XDG_CONFIG_HOME",
                                    "XDG_CACHE_HOME",
                                }
                            },
                            stdout=log,
                            stderr=log,
                        )
                    )
                    health("http://localhost:8080/ready")
                    health("http://localhost:8081/ready")
                g1 = start("veriq_cedar.composition.g1", "worker")
                g2 = start("veriq_cedar.composition.g2", "worker")
                # Deliberately begin with no AI listener. Both complaints and evidence must survive.
                with httpx.Client(
                    base_url="http://127.0.0.1:8000", timeout=3, trust_env=False
                ) as client:
                    response = client.post(
                        "/v1/cedar/complaints",
                        cookies=cookies["customer"],
                        json={
                            "transfer_id": transfer_id,
                            "description": "Synthetic integration verification transfer enquiry.",
                        },
                    )
                    assert response.status_code == 201
                    case_id = response.json()["id"]
                    path = "/v1/veriq/banks/CED/cases/" + case_id
                    states = []

                    def await_state(target):
                        deadline = time.monotonic() + 45
                        while time.monotonic() < deadline:
                            result = client.get(path, cookies=cookies["staff"])
                            if result.status_code == 404:
                                time.sleep(0.1)
                                continue
                            assert result.status_code == 200
                            case = result.json()
                            if not states or states[-1] != case["status"]:
                                states.append(case["status"])
                            if case["status"] == target:
                                return case
                            time.sleep(0.1)
                        raise RuntimeError("Case did not reach expected integration state")

                    unavailable = await_state("EVIDENCE_READY_AI_UNAVAILABLE")
                    assert unavailable["evidence"] and unavailable["ai_result"] is None
                    with Session(engines["veriq"]) as session:
                        inv = session.scalar(
                            select(CaseInvestigation).where(CaseInvestigation.case_id == case_id)
                        )
                        job = session.scalar(
                            select(Job).where(
                                Job.case_investigation_id == inv.id, Job.kind == "CASE_AI"
                            )
                        )
                        assert job.state == "RETRY_WAIT" and job.last_error == "AI_UNAVAILABLE"
                        output["retry"] = {
                            "state": job.state,
                            "error_code": job.last_error,
                            "attempts": job.attempts,
                            "generation": job.generation,
                        }
                    start(
                        "uvicorn",
                        "app.main:app",
                        "--host",
                        "127.0.0.1",
                        "--port",
                        str(ai_port),
                        "--no-access-log",
                        ai=True,
                    )
                    health(f"http://127.0.0.1:{ai_port}/health")
                    case = await_state("FINDINGS_READY")
                    findings = case["ai_result"]
                    for field in ("observations", "hypotheses", "unknowns", "recommended_checks"):
                        assert findings[field]
                    assert case["financial_outcome"] == "UNKNOWN"
                    assert "MOCK_PROVIDER" in findings["unknowns"][-1]
                    eligible = {e["id"] for e in case["evidence"] if e["verified_for_purpose"]}
                    assert all(
                        set(f["evidence_ids"]) <= eligible
                        for f in findings["observations"] + findings["hypotheses"]
                    )
                    with Session(engines["veriq"]) as session:
                        inv = session.scalar(
                            select(CaseInvestigation).where(CaseInvestigation.case_id == case_id)
                        )
                        run = session.scalar(
                            select(CaseAI).where(CaseAI.case_investigation_id == inv.id)
                        )
                        job = session.get(Job, ("CED", run.id))
                        assert (
                            run.result == findings
                            and run.provider_mode == "mock"
                            and job.state == "SUCCEEDED"
                        )
                        request_artifact = run.request
                        output["ai_enabled"] = {
                            "case_id": case_id,
                            "investigation_id": inv.id,
                            "job_id": job.id,
                            "run_id": job.run_id,
                            "revision": run.revision,
                            "request_digest": run.request_digest,
                            "provider_mode": run.provider_mode,
                            "synthetic_label": True,
                            "financial_outcome": case["financial_outcome"],
                            "states_observed": states,
                            "evidence": [
                                {"id": e["id"], "kind": e["kind"]} for e in case["evidence"]
                            ],
                            "findings_count": {
                                f: len(findings[f])
                                for f in (
                                    "observations",
                                    "hypotheses",
                                    "unknowns",
                                    "recommended_checks",
                                )
                            },
                            "request_matches_persisted_evidence": run.request["evidence"]
                            == case["evidence"],
                            "job_state": job.state,
                            "attempts": job.attempts,
                        }
                        assert output["ai_enabled"]["request_matches_persisted_evidence"]
                    with Session(engines["cedar"]) as session:
                        outbox = session.scalar(
                            select(ComplaintOutbox).where(ComplaintOutbox.case_id == case_id)
                        )
                        assert outbox.state == "SUCCEEDED"
                        output["ai_enabled"]["complaint_delivery_state"] = outbox.state
                    customer_case = client.get(
                        "/v1/cedar/complaints/" + case_id, cookies=cookies["customer"]
                    )
                    assert customer_case.status_code == 200
                    assert customer_case.json()["customer_safe_updates"] == []
                    output["ai_enabled"]["customer_safe_updates"] = []
                    if gateway:
                        gateway_case = httpx.get(
                            "http://localhost:8081" + path,
                            cookies=cookies["staff"],
                            trust_env=False,
                        )
                        assert (
                            gateway_case.status_code == 200
                            and gateway_case.json()["ai_result"] == findings
                        )
                        if os.environ.get("VERIFY_CUSTOMER_FRONTEND") == "true":
                            shell = httpx.get("http://localhost:8080", trust_env=False, timeout=45)
                            assert (
                                shell.status_code == 200
                                and "text/html" in shell.headers["content-type"]
                            )
                            output["customer_frontend_shell_http"] = 200
                        output["gateway"] = {
                            "both_readiness_routes": True,
                            "persisted_investigator_result": True,
                        }
                    assert client.get(path).status_code == 401
                    assert client.get(path, cookies=cookies["customer"]).status_code == 403
                assert g1.poll() is None and g2.poll() is None
                output["standalone_g1_g2_alive"] = True
                if args.request_artifact:
                    # This verifier creates only its own fresh, fictional S2 workflow.
                    # Preserve the immutable allowlisted snapshot, including unverified
                    # synthetic report and genuine provenance, without adding wire fields.
                    with args.request_artifact.open("x") as artifact:
                        json.dump(request_artifact, artifact, indent=2)
                        artifact.write("\n")
                print(json.dumps(output, indent=2))
            finally:
                for process in reversed(processes):
                    if process.poll() is None:
                        process.terminate()
                        try:
                            process.wait(timeout=5)
                        except subprocess.TimeoutExpired:
                            process.kill()
                            process.wait(timeout=5)
                for engine in engines.values():
                    engine.dispose()


if __name__ == "__main__":
    main()

"""Security and real Task005 evidence-shape regression tests (synthetic only)."""
import asyncio
import httpx
import pytest
from fastapi.testclient import TestClient

import evaluate_provider as ev
from app.main import app
from app.providers import MockProvider


@pytest.mark.parametrize("url", [
    "https://untrusted.example:8001",
    "http://untrusted.example:8001",
    "http://localhost:8001",
    "http://127.0.0.2:8001",
    "http://127.0.0.1.evil.example:8001",
    "http://127.0.0.1:8001/path",
    "http://127.0.0.1:8001?secret=1",
    "http://user:pass@127.0.0.1:8001",
    "http://127.0.0.1:8001#fragment",
    "file:///tmp/untrusted",
])
def test_untrusted_url_rejected_before_network_or_key(monkeypatch, url):
    monkeypatch.setenv("INTERNAL_SERVICE_KEY", "SYNTHETIC-TEST-SECRET")
    def prohibited_client(**kwargs):
        raise AssertionError("Untrusted URL caused network request")
    monkeypatch.setattr(ev.httpx, "Client", prohibited_client)
    assert ev.main(["--mode", "live", "--url", url, "--case", "case_unknown.json"]) == 2


def test_loopback_only_validator():
    assert ev.trusted_live_url("http://127.0.0.1:8001/") == "http://127.0.0.1:8001"
    assert ev.trusted_live_url("http://[::1]:8001") == "http://[::1]:8001"


def test_direct_helper_fails_closed():
    class Prohibited:
        def post(self, *args, **kwargs):
            raise AssertionError("Key leaked to other host")
    with pytest.raises(ValueError, match="Loopback"):
        ev.test_one(Prohibited(), "case_unknown.json", "http://untrusted.example:8001", save_responses=False)


def test_redirect_does_not_leak_key(monkeypatch, tmp_path):
    monkeypatch.setenv("INTERNAL_SERVICE_KEY", "SYNTHETIC-TEST-SECRET")
    monkeypatch.setattr(ev, "REPORT_DIR", tmp_path)
    seen = []
    def handler(req):
        seen.append(req)
        if req.url.path == "/health":
            return httpx.Response(200, json={"mode": "openai_compatible"})
        assert req.headers["x-internal-service-key"] == "SYNTHETIC-TEST-SECRET"
        return httpx.Response(307, headers={"Location": "https://untrusted.example/leak"})
    original_client = httpx.Client
    def factory(**kwargs):
        assert kwargs["follow_redirects"] is False
        assert kwargs["trust_env"] is False
        return original_client(transport=httpx.MockTransport(handler), **kwargs)
    monkeypatch.setattr(ev.httpx, "Client", factory)
    assert ev.main(["--mode", "live", "--case", "case_unknown.json"]) == 1
    assert len(seen) == 2
    assert all(req.url.host == "127.0.0.1" for req in seen)
    assert "SYNTHETIC-TEST-SECRET" not in next(tmp_path.glob("*.json")).read_text()


def test_health_redirect_is_not_followed(monkeypatch):
    monkeypatch.setenv("INTERNAL_SERVICE_KEY", "SYNTHETIC-TEST-SECRET")
    requests = []
    def handler(req):
        requests.append(req)
        return httpx.Response(302, headers={"Location": "https://untrusted.example/health"})
    original_client = httpx.Client
    monkeypatch.setattr(ev.httpx, "Client", lambda **kw: original_client(
        transport=httpx.MockTransport(handler), **kw
    ))
    assert ev.main(["--mode", "live", "--case", "case_unknown.json"]) == 2
    assert len(requests) == 1
    assert "x-internal-service-key" not in requests[0].headers


def test_task005_evidence_produces_safe_findings(read_fixture):
    payload = ev.load_fixture("case_task005_shape.json")
    assert {rec["kind"] for rec in payload["evidence"]} == {
        "TRANSFER_STATE", "TRANSFER_STAGE", "ROUTE_METRIC_SNAPSHOT",
        "CUSTOMER_REPORT", "DOCUMENTED_RELATIONSHIP",
    }
    response = TestClient(app).post(
        "/internal/ai/analyze-case", json=payload,
        headers={"X-Internal-Service-Key": "tests-only-not-a-real-service-secret"},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["financial_outcome"] == "UNKNOWN"
    assert len(result["observations"]) >= 3
    assert len(result["hypotheses"]) >= 1
    assert result["hypotheses"][0]["alternatives"]
    assert result["recommended_checks"]
    eligible = {rec["id"] for rec in payload["evidence"] if rec["verified_for_purpose"]}
    for finding in result["observations"] + result["hypotheses"]:
        assert finding["evidence_ids"] and set(finding["evidence_ids"]) <= eligible
    assert "case/SYN-CASE-005" not in {
        eid for finding in result["observations"] + result["hypotheses"]
        for eid in finding["evidence_ids"]
    }
    assert all("baseline" not in o["text"].lower() for o in result["observations"])
    assert not [f for f in ev.audit("case_task005_shape.json", payload, result) if f.severity == "ERROR"]


def test_mock_ignores_unrelated_route_and_ineligible_stage():
    payload = ev.load_fixture("case_task005_shape.json")
    for rec in payload["evidence"]:
        if rec["kind"] == "TRANSFER_STAGE" and rec["data"]["stage"] == "RESPONSE_TIMEOUT":
            rec["verified_for_purpose"] = False
        if rec["kind"] == "ROUTE_METRIC_SNAPSHOT":
            rec["data"]["route_id"] = "ROUTE-CED-BIRCH-G3"
    result = asyncio.run(MockProvider().generate("case", "", payload))
    metric_id = next(rec["id"] for rec in payload["evidence"] if rec["kind"] == "ROUTE_METRIC_SNAPSHOT")
    assert all(metric_id not in h["evidence_ids"] for h in result["hypotheses"])
    assert result["financial_outcome"] == "UNKNOWN"

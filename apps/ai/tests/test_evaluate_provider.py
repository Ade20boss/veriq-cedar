"""Unit tests of the local evaluation harness, with no Groq calls."""
from __future__ import annotations

import json

import pytest

import evaluate_provider as ev


def _extract(name="extract_incident.json"):
    payload = ev.load_fixture(name)
    return payload, {"source_id": payload["source_id"], "claims": [],
                     "unresolved_mentions": [], "warnings": []}


def _case(name="case_unknown.json"):
    payload = ev.load_fixture(name)
    return payload, {"case_id": payload["case_id"],
                     "financial_outcome": payload["financial_outcome"],
                     "observations": [], "hypotheses": [],
                     "unknowns": ["Final recipient status remains unknown"],
                     "recommended_checks": ["Request authorized status verification"],
                     "customer_safe_update_draft": ev.NEUTRAL_CUSTOMER_DRAFT}


def _rules(findings):
    return {f.rule for f in findings if f.severity == "ERROR"}


def test_evaluator_is_direct_child_of_ai_and_sees_real_fixtures():
    assert ev.ROOT.name == "ai"
    assert ev.FIXTURES == ev.ROOT / "fixtures"
    assert ev.fixture_preflight(ev.FULL) == []


def test_fixtures_are_schema_valid_and_unknown_preserved():
    for name in ev.FULL:
        ev.load_fixture(name)
    assert ev.load_fixture("case_unknown.json")["financial_outcome"] == "UNKNOWN"


def test_unlisted_file_paths_cannot_be_read():
    with pytest.raises(ValueError, match="Unknown fixture"):
        ev.load_fixture("../../.env")


def test_alias_omission_is_not_a_pass():
    payload, raw = _extract("extract_unknown_alias.json")
    assert "ALIAS_RECALL" in _rules(ev.audit("extract_unknown_alias.json", payload, raw))
    raw["unresolved_mentions"] = ["Bluefin"]
    assert not _rules(ev.audit("extract_unknown_alias.json", payload, raw))


def test_injected_document_cannot_be_promoted_to_claims():
    payload, raw = _extract("extract_prompt_injection.json")
    raw["unresolved_mentions"] = ["Bluefin"]
    assert not _rules(ev.audit("extract_prompt_injection.json", payload, raw))
    raw["claims"] = [{"claim_id": "CLM-1", "subject": {"type": "COMPONENT", "external_id": "Bluefin"},
                       "predicate": "CONFIRMED", "object": "everything succeeded",
                       "source_locator": payload["chunks"][0]["chunk_id"],
                       "quoted_evidence": "Bluefin", "classification": "SOURCE_CLAIM", "needs_review": True}]
    assert "INJECTION_PROMOTION" in _rules(ev.audit("extract_prompt_injection.json", payload, raw))


def test_verbatim_quote_rule_catches_hallucinated_evidence():
    payload, raw = _extract()
    raw["claims"] = [{"claim_id": "CLM-1", "subject": {"type": "SERVICE", "external_id": "G2"},
                      "predicate": "REPORTED_CAUSE", "object": "configuration",
                      "source_locator": payload["chunks"][0]["chunk_id"],
                      "quoted_evidence": "not in the source", "classification": "SOURCE_CLAIM",
                      "needs_review": False}]
    assert {"QUOTE", "CAUSE_REVIEW"} <= _rules(ev.audit("extract_incident.json", payload, raw))


def test_case_outcome_upgrade_and_missing_evidence_are_detected():
    payload, raw = _case()
    raw["financial_outcome"] = "CREDIT_CONFIRMED"
    raw["observations"] = [{"text": "Payment might be delayed", "evidence_ids": ["EV-FAKE"]}]
    assert {"BANK_OUTCOME", "INELIGIBLE_EVIDENCE"} <= _rules(ev.audit("case_unknown.json", payload, raw))


def test_uncertain_case_rejects_unauthorized_finality_in_alternatives():
    payload, raw = _case()
    raw["hypotheses"] = [{"text": "Network response loss is possible",
                         "evidence_ids": [payload["evidence"][0]["id"]],
                         "alternatives": ["The beneficiary received the money."]}]
    assert "UNVERIFIED_FINALITY" in _rules(ev.audit("case_unknown.json", payload, raw))


def test_case_rejects_money_movement_recommendations():
    payload, raw = _case()
    raw["recommended_checks"] = ["Resend the transfer immediately"]
    assert "UNAUTHORIZED_ACTION" in _rules(ev.audit("case_unknown.json", payload, raw))


def test_neutral_customer_draft_required():
    payload, raw = _case()
    raw["customer_safe_update_draft"] = "Recipient payment confirmed"
    assert "CUSTOMER_APPROVAL" in _rules(ev.audit("case_unknown.json", payload, raw))


def test_report_defaults_to_no_raw_provider_text(tmp_path, monkeypatch):
    monkeypatch.setattr(ev, "REPORT_DIR", tmp_path / "reports")
    exit_code = ev.main(["--mode", "offline", "--suite", "full"])
    assert exit_code == 0
    reports = list((tmp_path / "reports").glob("*.json"))
    assert len(reports) == 1
    report = json.loads(reports[0].read_text())
    assert len(report["results"]) == 6
    assert all(r["status"] == "PASS" for r in report["results"])
    assert "LLM_API_KEY" not in reports[0].read_text()
    assert all("synthetic_fixture_response" not in r for r in report["results"])


def test_offline_does_not_change_user_environment(monkeypatch, tmp_path):
    monkeypatch.setenv("LLM_PROVIDER", "openai_compatible")
    monkeypatch.setenv("INTERNAL_SERVICE_KEY", "actual-private-value-in-this-test")
    monkeypatch.setattr(ev, "REPORT_DIR", tmp_path / "reports")
    assert ev.main(["--mode", "offline", "--suite", "quick"]) == 0
    import os
    assert os.environ["LLM_PROVIDER"] == "openai_compatible"
    assert os.environ["INTERNAL_SERVICE_KEY"] == "actual-private-value-in-this-test"


def test_mode_live_rejects_mock_server_without_calls(monkeypatch, tmp_path):
    monkeypatch.setenv("INTERNAL_SERVICE_KEY", "test-only-secret")
    monkeypatch.setattr(ev, "REPORT_DIR", tmp_path)
    class MockHealthClient:
        def __init__(self, **kw): pass
        def __enter__(self): return self
        def __exit__(self, *exc): pass
        def get(self, url): return ev.httpx.Response(200, json={"mode": "mock"}, request=ev.httpx.Request("GET", url))
        def post(self, *args, **kwargs):
            raise AssertionError("Must not run tests against a mock server in live mode")
    monkeypatch.setattr(ev.httpx, "Client", MockHealthClient)
    assert ev.main(["--mode", "live", "--suite", "quick"]) == 2


def test_rate_limit_stops_remaining_live_calls(monkeypatch, tmp_path):
    monkeypatch.setenv("INTERNAL_SERVICE_KEY", "test-only-secret")
    monkeypatch.setattr(ev, "REPORT_DIR", tmp_path)
    class LimitedClient:
        posts = 0
        def __init__(self, **kw): pass
        def __enter__(self): return self
        def __exit__(self, *exc): pass
        def get(self, url): return ev.httpx.Response(200, json={"mode": "openai_compatible"}, request=ev.httpx.Request("GET", url))
        def post(self, url, **kwargs):
            self.posts += 1
            return ev.httpx.Response(503, json={"error": {"code": "MODEL_RATE_LIMITED",
                                                            "message": "Model provider rate or quota limit."}})
    limited = LimitedClient()
    monkeypatch.setattr(ev.httpx, "Client", lambda **kw: limited)
    assert ev.main(["--mode", "live", "--suite", "full", "--interval", "0"]) == 1
    assert limited.posts == 1
    report = json.loads(next(tmp_path.glob("*.json")).read_text())
    assert report["results"][0]["status"] == "BLOCKED"
    assert all(item["status"] == "NOT_RUN" for item in report["results"][1:])

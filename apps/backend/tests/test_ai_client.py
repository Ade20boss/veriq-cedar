"""No-network tests for the approved v1.0 backend -> AI boundary."""
import io
import json
from urllib.error import HTTPError, URLError

import pytest

from veriq_cedar.veriq.ai_client.client import AIClientError, VeriqAIClient, build_case_request

KEY = "synthetic-test-only-service-key"
BASE = "http://127.0.0.1:8001"


class FakeResponse(io.BytesIO):
    status = 200


def client(output, *, recorder=None):
    def open_(request, timeout):
        if recorder is not None:
            recorder.append((request, timeout))
        return FakeResponse(json.dumps(output).encode())
    return VeriqAIClient(BASE, KEY, opener=open_)


def extraction():
    return {
        "bank_id": "CED", "source_id": "SRC-1", "source_kind": "note",
        "chunks": [{"chunk_id": "file#1", "text": "Gateway G2 saw timeouts."}],
    }


def result_extraction():
    return {
        "source_id": "SRC-1", "claims": [{
            "claim_id": "C1", "subject": {"type": "SERVICE", "external_id": "G2"},
            "predicate": "HAS_OBSERVATION", "object": "timeouts", "source_locator": "file#1",
            "quoted_evidence": "Gateway G2 saw timeouts.", "classification": "SOURCE_CLAIM",
            "needs_review": True,
        }], "unresolved_mentions": [], "warnings": [],
    }


def case():
    return {
        "case_id": "CASE-1", "bank_id": "CED", "financial_outcome": "UNKNOWN",
        "question": "What is known?", "evidence": [{
            "id": "EV-1", "verified_for_purpose": True,
            "kind": "TIMEOUT", "source_system": "cedar", "observed_at": "2026-10-15T12:00:00Z",
            "occurred_at": "2026-10-15T11:59:00Z", "citation": "log#1", "data": {},
        }], "known_relationships": [], "historical_incidents": [],
    }


def result_case():
    return {
        "case_id": "CASE-1", "financial_outcome": "UNKNOWN",
        "observations": [{"text": "A gateway timeout was observed.", "evidence_ids": ["EV-1"]}],
        "hypotheses": [{"text": "The response may have been lost.",
                        "evidence_ids": ["EV-1"], "alternatives": ["Status may be pending."]}],
        "unknowns": ["Recipient credit has not been verified."],
        "recommended_checks": ["Request authorized bank status verification."],
        "customer_safe_update_draft": "Unapproved template, not customer-facing.",
    }


def test_extract_requires_provenance_and_sends_private_key():
    seen = []
    result = client(result_extraction(), recorder=seen).extract_knowledge(extraction())
    assert result["claims"][0]["quoted_evidence"] == extraction()["chunks"][0]["text"]
    assert seen[0][0].full_url == BASE + "/internal/ai/extract-knowledge"
    assert seen[0][0].get_header("X-internal-service-key") == KEY
    assert seen[0][1] == 12.0


def test_extract_rejects_fabricated_quote():
    wrong = result_extraction()
    wrong["claims"][0]["quoted_evidence"] = "Fabricated quote"
    with pytest.raises(AIClientError, match="AI_INVALID_RESPONSE"):
        client(wrong).extract_knowledge(extraction())


def test_case_preserves_unknown_and_verified_evidence():
    response = client(result_case()).analyze_case(case())
    assert response["financial_outcome"] == "UNKNOWN"
    assert response["hypotheses"][0]["evidence_ids"] == ["EV-1"]


def test_case_rejects_fabricated_evidence_id():
    response = result_case()
    response["observations"][0]["evidence_ids"] = ["EV-FAKE"]
    with pytest.raises(AIClientError, match="AI_INVALID_RESPONSE"):
        client(response).analyze_case(case())


def test_case_rejects_financial_outcome_upgrade():
    response = result_case()
    response["financial_outcome"] = "CREDIT_CONFIRMED"
    with pytest.raises(AIClientError, match="AI_INVALID_RESPONSE"):
        client(response).analyze_case(case())


def test_rejects_nonlocal_unencrypted_destination():
    with pytest.raises(ValueError, match="Invalid internal AI connection"):
        VeriqAIClient("http://external.example", KEY)


def test_redirect_does_not_expose_key():
    from veriq_cedar.veriq.ai_client.client import _NoRedirect
    assert (
        _NoRedirect().redirect_request(None, None, 302, "redirect", {}, "https://bad.example")
        is None
    )


def test_rate_limits_fail_closed_no_retry():
    calls = []
    def limited(request, timeout):
        calls.append(request)
        raise HTTPError(request.full_url, 429, "rate limit", {}, None)
    with pytest.raises(AIClientError) as err:
        VeriqAIClient(BASE, KEY, opener=limited).analyze_case(case())
    assert err.value.code == "AI_RATE_LIMITED"
    assert err.value.retryable is True
    assert len(calls) == 1


def test_network_failure_has_sanitized_error():
    def unavailable(request, timeout):
        raise URLError("secret-network-text")
    with pytest.raises(AIClientError) as err:
        VeriqAIClient(BASE, KEY, opener=unavailable).analyze_case(case())
    assert str(err.value) == "AI_UNAVAILABLE"


def test_only_exact_v1_bundle_fields_are_exported():
    bundle = {
        "case_id": "CASE-1", "financial_outcome": "UNKNOWN",
        "evidence": case()["evidence"], "status": "EVIDENCE_READY_AI_UNAVAILABLE",
        "incident_ids": ["INC-1"], "ai_result": None,
    }
    output = build_case_request("CED", bundle)
    assert set(output) == set(case())
    assert output["bank_id"] == "CED"
    assert "incident_ids" not in output


def test_unready_bundle_cannot_be_used():
    with pytest.raises(ValueError):
        build_case_request("CED", {"case_id": "CASE-1", "status": "REQUESTED", "evidence": []})

from copy import deepcopy
import asyncio

import pytest
from fastapi.testclient import TestClient

from app.errors import AIServiceError
from app.guardrails import validate_case
from app.main import app
from app.schemas import AIInvestigationInput, AIInvestigationOutput
from app.service import analyze_case

client = TestClient(app)
HEADERS = {"X-Internal-Service-Key": "tests-only-not-a-real-service-secret"}


def test_case_unknown_preserved(read_fixture):
    payload = read_fixture("case_unknown.json")
    response = client.post("/internal/ai/analyze-case", json=payload, headers=HEADERS)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["financial_outcome"] == "UNKNOWN"
    assert body["unknowns"]
    assert body["hypotheses"] and body["hypotheses"][0]["alternatives"]
    allowed = {e["id"] for e in payload["evidence"] if e["verified_for_purpose"]}
    assert all(set(item["evidence_ids"]) <= allowed for item in body["observations"] + body["hypotheses"])


def test_bank_authorized_credit_only_from_input(read_fixture):
    response = client.post("/internal/ai/analyze-case", json=read_fixture("case_confirmed.json"), headers=HEADERS)
    assert response.status_code == 200, response.text
    assert response.json()["financial_outcome"] == "CREDIT_CONFIRMED"


def test_cross_bank_context_blocked(read_fixture):
    payload = read_fixture("case_unknown.json")
    payload["known_relationships"][0]["bank_id"] = "BIR"
    response = client.post("/internal/ai/analyze-case", json=payload, headers=HEADERS)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "AI_INVALID_INPUT"


def test_weak_evidence_not_used(read_fixture):
    payload = read_fixture("case_unknown.json")
    for record in payload["evidence"]:
        record["verified_for_purpose"] = False
    response = client.post("/internal/ai/analyze-case", json=payload, headers=HEADERS)
    assert response.status_code == 200
    assert response.json()["observations"] == []
    assert response.json()["hypotheses"] == []
    assert response.json()["unknowns"]


def test_fabricated_evidence_id_rejected(read_fixture):
    request = AIInvestigationInput.model_validate(read_fixture("case_unknown.json"))
    result = {
        "case_id": request.case_id, "financial_outcome": "UNKNOWN",
        "observations": [{"text": "Invented observation", "evidence_ids": ["EV-FAKE"]}],
        "hypotheses": [], "unknowns": ["Missing status"], "recommended_checks": [],
        "customer_safe_update_draft": "We are checking the final outcome."
    }
    with pytest.raises(AIServiceError, match="evidence"):
        validate_case(request, AIInvestigationOutput.model_validate(result))


def test_model_cannot_upgrade_outcome(read_fixture):
    request = AIInvestigationInput.model_validate(read_fixture("case_unknown.json"))
    result = {
        "case_id": request.case_id, "financial_outcome": "CREDIT_CONFIRMED",
        "observations": [], "hypotheses": [], "unknowns": [], "recommended_checks": [],
        "customer_safe_update_draft": "Payment complete"
    }
    with pytest.raises(AIServiceError, match="financial outcome"):
        validate_case(request, AIInvestigationOutput.model_validate(result))


def test_model_cannot_claim_credited_in_unknown_message(read_fixture):
    request = AIInvestigationInput.model_validate(read_fixture("case_unknown.json"))
    result = {
        "case_id": request.case_id, "financial_outcome": "UNKNOWN",
        "observations": [], "hypotheses": [], "unknowns": ["Missing status"], "recommended_checks": [],
        "customer_safe_update_draft": "The recipient was credited."
    }
    with pytest.raises(AIServiceError, match="definitive"):
        validate_case(request, AIInvestigationOutput.model_validate(result))


def test_case_provider_output_validation(read_fixture):
    class BadProvider:
        async def generate(self, task, instruction, payload):
            return {"case_id": payload["case_id"], "financial_outcome": "UNKNOWN", "observations": []}
    request = AIInvestigationInput.model_validate(read_fixture("case_unknown.json"))
    with pytest.raises(AIServiceError, match="schema"):
        asyncio.run(analyze_case(request, BadProvider()))


def test_case_uses_matching_route_metric_not_unrelated_route(read_fixture):
    payload = read_fixture("case_unknown.json")
    response = client.post("/internal/ai/analyze-case", json=payload, headers=HEADERS)
    assert response.status_code == 200
    ids = response.json()["hypotheses"][0]["evidence_ids"]
    assert "EV-METRIC-G2-01" in ids
    assert response.json()["financial_outcome"] == "UNKNOWN"
    payload["evidence"][2]["data"]["route_id"] = "ROUTE-CED-BIRCH-G3"
    unrelated = client.post("/internal/ai/analyze-case", json=payload, headers=HEADERS)
    assert unrelated.status_code == 200
    assert unrelated.json()["hypotheses"][0]["evidence_ids"] == ["EV-TIMEOUT-1042"]


def test_no_fabricated_case_in_a3_fixture(read_fixture):
    payload = read_fixture("incident_evidence_proposed_a3.json")
    assert payload["bank_case_id"] is None
    assert "financial_outcome" not in payload
    assert "NOT AN APPROVED" in payload["_notice"]

from copy import deepcopy
import pytest
from fastapi.testclient import TestClient

from app.errors import AIServiceError
from app.guardrails import validate_extraction
from app.main import app
from app.schemas import AIExtractInput, AIExtractOutput
from app.service import extract_knowledge

client = TestClient(app)
HEADERS = {"X-Internal-Service-Key": "tests-only-not-a-real-service-secret"}


@pytest.mark.parametrize("fixture,expected", [
    ("extract_incident.json", "REPORTED_CAUSE"),
    ("extract_dependency.json", "USED_BY"),
])
def test_mock_source_grounded_claims(read_fixture, fixture, expected):
    response = client.post("/internal/ai/extract-knowledge", json=read_fixture(fixture), headers=HEADERS)
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["claims"]) == 1
    assert body["claims"][0]["predicate"] == expected
    if fixture == "extract_dependency.json":
        assert body["claims"][0]["classification"] == "CANDIDATE_RELATIONSHIP"
        assert body["claims"][0]["needs_review"] is True
    assert body["claims"][0]["quoted_evidence"] in read_fixture(fixture)["chunks"][0]["text"]
    assert any("MOCK_PROVIDER" in warning for warning in body["warnings"])


def test_unknown_alias_remains_unresolved(read_fixture):
    result = client.post("/internal/ai/extract-knowledge", json=read_fixture("extract_unknown_alias.json"), headers=HEADERS)
    assert result.status_code == 200
    assert result.json()["claims"] == []
    assert "Bluefin" in result.json()["unresolved_mentions"]


def test_prompt_injection_fixture_is_data(read_fixture):
    result = client.post("/internal/ai/extract-knowledge", json=read_fixture("extract_prompt_injection.json"), headers=HEADERS)
    assert result.status_code == 200
    assert result.json()["claims"] == []
    assert "Bluefin" in result.json()["unresolved_mentions"]


def test_invalid_service_key(read_fixture):
    request = read_fixture("extract_incident.json")
    assert client.post("/internal/ai/extract-knowledge", json=request).status_code == 401
    assert client.post("/internal/ai/extract-knowledge", json=request, headers={"X-Internal-Service-Key": "wrong"}).status_code == 401


def test_malformed_input_is_422(read_fixture):
    request = read_fixture("extract_incident.json")
    request["chunks"] = [{"chunk_id": "duplicate", "text": "one"}, {"chunk_id": "duplicate", "text": "two"}]
    result = client.post("/internal/ai/extract-knowledge", json=request, headers=HEADERS)
    assert result.status_code == 422
    assert result.json()["error"]["code"] == "AI_INVALID_INPUT"



def test_rejects_forged_quote(read_fixture):
    request = AIExtractInput.model_validate(read_fixture("extract_incident.json"))
    raw = {"source_id": request.source_id, "claims": [{
        "claim_id": "CLM-1", "subject": {"type": "SERVICE", "external_id": "G2"},
        "predicate": "REPORTED_CAUSE", "object": "fictional root cause", "source_locator": request.chunks[0].chunk_id,
        "quoted_evidence": "This quoted text does not occur", "classification": "SOURCE_CLAIM", "needs_review": True
    }], "unresolved_mentions": [], "warnings": []}
    with pytest.raises(AIServiceError, match="quotation"):
        validate_extraction(request, AIExtractOutput.model_validate(raw))


def test_rejects_forged_locator_and_subject(read_fixture):
    request = AIExtractInput.model_validate(read_fixture("extract_incident.json"))
    valid_claim = client.post("/internal/ai/extract-knowledge", json=read_fixture("extract_incident.json"), headers=HEADERS).json()
    claim = deepcopy(valid_claim["claims"][0])
    claim["source_locator"] = "other.txt#1"
    with pytest.raises(AIServiceError, match="locator"):
        validate_extraction(request, AIExtractOutput.model_validate({**valid_claim, "claims": [claim]}))
    claim["source_locator"] = request.chunks[0].chunk_id
    claim["subject"]["external_id"] = "G999"
    with pytest.raises(AIServiceError, match="subject identifier"):
        validate_extraction(request, AIExtractOutput.model_validate({**valid_claim, "claims": [claim]}))


def test_schema_fails_for_extra_claim_field(read_fixture):
    from pydantic import ValidationError
    result = client.post("/internal/ai/extract-knowledge", json=read_fixture("extract_incident.json"), headers=HEADERS).json()
    result["claims"][0]["verified"] = True
    with pytest.raises(ValidationError):
        AIExtractOutput.model_validate(result)


def test_http_extra_fields_get_safe_contract_error(read_fixture):
    payload = read_fixture("extract_incident.json")
    payload["proposed_events"] = []
    response = client.post("/internal/ai/extract-knowledge", json=payload, headers=HEADERS)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "CONTRACT_VALIDATION_ERROR"


def test_successful_response_declares_mock_mode(read_fixture):
    response = client.post("/internal/ai/extract-knowledge", json=read_fixture("extract_incident.json"), headers=HEADERS)
    assert response.headers["x-veriq-ai-mode"] == "mock"

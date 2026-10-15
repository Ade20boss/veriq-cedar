from pathlib import Path
import yaml
import pytest
from pydantic import ValidationError

from app.schemas import (AIExtractInput, AIExtractOutput, AIClaim,
                         AIInvestigationInput, AIInvestigationOutput,
                         EvidenceRecord, KnowledgeRelationship, Incident,
                         AIObservation, AIHypothesis)

CANONICAL = Path(__file__).resolve().parents[3] / "contracts" / "openapi.yaml"


@pytest.mark.parametrize("name,cls", [
    ("AIExtractInput", AIExtractInput), ("AIExtractOutput", AIExtractOutput),
    ("AIClaim", AIClaim), ("AIInvestigationInput", AIInvestigationInput),
    ("AIInvestigationOutput", AIInvestigationOutput), ("EvidenceRecord", EvidenceRecord),
    ("KnowledgeRelationship", KnowledgeRelationship), ("Incident", Incident),
    ("AIObservation", AIObservation), ("AIHypothesis", AIHypothesis),
])
def test_exact_top_level_fields_and_required(name, cls):
    source = yaml.safe_load(CANONICAL.read_text(encoding="utf8"))["components"]["schemas"][name]
    assert set(cls.model_fields) == set(source["properties"])
    required = {field for field, value in cls.model_fields.items() if value.is_required()}
    assert required == set(source["required"])
    assert cls.model_json_schema()["additionalProperties"] is False


def test_invalid_financial_outcome_rejected(read_fixture):
    payload = read_fixture("case_unknown.json")
    payload["financial_outcome"] = "PAID_MAYBE"
    with pytest.raises(ValidationError):
        AIInvestigationInput.model_validate(payload)


def test_extra_schema_fields_rejected(read_fixture):
    payload = read_fixture("extract_incident.json")
    payload["new_proposed_entities"] = []
    with pytest.raises(ValidationError):
        AIExtractInput.model_validate(payload)

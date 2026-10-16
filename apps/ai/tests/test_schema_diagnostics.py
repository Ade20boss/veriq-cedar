"""Safe output validation diagnostics; no real provider network needed."""
import asyncio
import logging

import pytest

from app.errors import AIServiceError
from app.prompts import CASE_INSTRUCTION
from app.schemas import AIInvestigationInput
from app.service import analyze_case


def test_schema_error_identifies_safe_fields_without_logging_values(read_fixture, caplog):
    request = AIInvestigationInput.model_validate(read_fixture("case_unknown.json"))
    class InvalidStructure:
        async def generate(self, task, instruction, payload):
            return {
                "case_id": payload["case_id"],
                "financial_outcome": payload["financial_outcome"],
                "observations": [{"text": "SECRET-FIXTURE-TEXT", "evidence_ids": "EV-PRIVATE"}],
                "hypotheses": [],
                "unknowns": "SECRET-FIXTURE-TEXT",
                "recommended_checks": [],
                "customer_safe_update_draft": "Neutral draft",
                "arbitrary-external-provider-field": "SECRET-FIXTURE-TEXT",
            }
    with caplog.at_level(logging.WARNING, logger="veriq.ai.service"):
        with pytest.raises(AIServiceError, match="schema"):
            asyncio.run(analyze_case(request, InvalidStructure()))
    assert "observations.[].evidence_ids:list_type" in caplog.text
    assert "unknowns:list_type" in caplog.text
    assert "<extra>:extra_forbidden" in caplog.text
    assert "SECRET-FIXTURE-TEXT" not in caplog.text
    assert "EV-PRIVATE" not in caplog.text
    assert "arbitrary-external-provider-field" not in caplog.text


def test_case_prompt_spells_out_nested_json_contract():
    assert "JSON TYPES" in CASE_INSTRUCTION
    assert "evidence_ids (array of strings)" in CASE_INSTRUCTION
    assert "Never send null" in CASE_INSTRUCTION

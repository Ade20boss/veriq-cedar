"""Live-output hardening tests: offline, synthetic and no real API requests."""
import asyncio
import logging
import pytest
from app.errors import AIServiceError
from app.prompts import EXTRACTION_INSTRUCTION, CASE_INSTRUCTION
from app.schemas import AIExtractInput, AIInvestigationInput
from app.service import extract_knowledge, analyze_case

class EmptyExtraction:
    async def generate(self, task, instruction, payload):
        return {"source_id":payload["source_id"],"claims":[],"unresolved_mentions":[],"warnings":[]}

@pytest.mark.parametrize("fixture", ["extract_unknown_alias.json","extract_prompt_injection.json"])
def test_explicit_missing_alias_recovers_without_claim(read_fixture,fixture):
    request=AIExtractInput.model_validate(read_fixture(fixture))
    result=asyncio.run(extract_knowledge(request,EmptyExtraction()))
    assert result.claims == []
    assert result.unresolved_mentions == ["Bluefin"]
    assert result.warnings == ["SOURCE_BACKED_ALIAS_RECOVERY"]

def test_source_with_official_identifier_does_not_trigger_recovery():
    request=AIExtractInput.model_validate({"bank_id":"CED","source_id":"S","source_kind":"notes","chunks":[{"chunk_id":"a","text":"Operations refers to a component as Bluefin. Official identifier is BF-123."}]})
    result=asyncio.run(extract_knowledge(request,EmptyExtraction()))
    assert result.unresolved_mentions == []
    assert result.warnings == []

def test_existing_alias_not_duplicated(read_fixture):
    request=AIExtractInput.model_validate(read_fixture("extract_unknown_alias.json"))
    class Existing:
        async def generate(self,task,instruction,payload):
            return {"source_id":payload["source_id"],"claims":[],"unresolved_mentions":["Bluefin (unresolved)"],"warnings":[]}
    result=asyncio.run(extract_knowledge(request,Existing()))
    assert result.unresolved_mentions == ["Bluefin (unresolved)"]
    assert result.warnings == []

def test_other_named_missing_alias_is_unresolved_not_claim():
    request=AIExtractInput.model_validate({"bank_id":"CED","source_id":"S","source_kind":"notes","chunks":[{"chunk_id":"a","text":"Operations refers to a component as Pearl, with no official identifier."}]})
    result=asyncio.run(extract_knowledge(request,EmptyExtraction()))
    assert result.unresolved_mentions == ["Pearl"]
    assert result.claims == []

def test_unsafe_model_case_rejected_with_field_only_log(read_fixture,caplog):
    request=AIInvestigationInput.model_validate(read_fixture("case_unknown.json"))
    unsafe_text="The recipient received the money. PRIVATE-SYNTHETIC-EXAMPLE"
    class Unsafe:
        async def generate(self,task,instruction,payload):
            return {"case_id":payload["case_id"],"financial_outcome":"UNKNOWN","observations":[],"hypotheses":[],"unknowns":["Credit status unknown"],"recommended_checks":[unsafe_text],"customer_safe_update_draft":"We are reviewing the transfer."}
    with caplog.at_level(logging.WARNING,logger="veriq.ai.guardrails"):
        with pytest.raises(AIServiceError,match="definitive"):
            asyncio.run(analyze_case(request,Unsafe()))
    assert "field=recommended_checks" in caplog.text
    assert unsafe_text not in caplog.text

def test_prompts_emphasize_fidelity_and_uncertainty():
    assert "EVERY chunk" in EXTRACTION_INSTRUCTION
    assert "unresolved_mentions" in EXTRACTION_INSTRUCTION
    assert "SAME clause" in CASE_INSTRUCTION
    assert "sender-side ledger debit" in CASE_INSTRUCTION

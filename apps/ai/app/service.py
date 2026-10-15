"""Thin orchestration: schema-validate *and* independently verify provenance."""
import logging
from pydantic import ValidationError

from .errors import AIServiceError
from .guardrails import check_extract_input, check_case_input, validate_extraction, validate_case
from .prompts import EXTRACTION_INSTRUCTION, CASE_INSTRUCTION
from .providers import JSONProvider, get_provider
from .schemas import AIExtractInput, AIExtractOutput, AIInvestigationInput, AIInvestigationOutput

logger = logging.getLogger("veriq.ai.service")


async def extract_knowledge(request: AIExtractInput, provider: JSONProvider | None = None) -> AIExtractOutput:
    check_extract_input(request)
    provider = provider or get_provider()
    raw = await provider.generate("extraction", EXTRACTION_INSTRUCTION, request.model_dump(mode="json"))
    try:
        result = AIExtractOutput.model_validate(raw)
    except ValidationError as exc:
        logger.warning("Extraction contract validation failed: %s", type(exc).__name__)
        raise AIServiceError("AI_INVALID_OUTPUT", "Extraction model output violates v1.0 schema.") from exc
    validate_extraction(request, result)
    return result


async def analyze_case(request: AIInvestigationInput, provider: JSONProvider | None = None) -> AIInvestigationOutput:
    check_case_input(request)
    provider = provider or get_provider()
    raw = await provider.generate("case", CASE_INSTRUCTION, request.model_dump(mode="json"))
    try:
        result = AIInvestigationOutput.model_validate(raw)
    except ValidationError as exc:
        logger.warning("Case contract validation failed: %s", type(exc).__name__)
        raise AIServiceError("AI_INVALID_OUTPUT", "Case model output violates v1.0 schema.") from exc
    validate_case(request, result)
    return result

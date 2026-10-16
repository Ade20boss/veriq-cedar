"""Thin orchestration: schema-validate *and* independently verify provenance."""
import logging
from pydantic import ValidationError

from .errors import AIServiceError
from .alias_recovery import recover_unresolved_aliases
from .financial_safety import NEUTRAL_CUSTOMER_DRAFT
from .guardrails import check_extract_input, check_case_input, validate_extraction, validate_case
from .prompts import EXTRACTION_INSTRUCTION, CASE_INSTRUCTION
from .providers import JSONProvider, get_provider
from .schemas import AIExtractInput, AIExtractOutput, AIInvestigationInput, AIInvestigationOutput

logger = logging.getLogger("veriq.ai.service")

# Whitelist known schema keys; provider-defined extra field names and values are
# never logged. Pydantic location indices are reduced to `[]`.
_ALLOWED_SCHEMA_KEYS = frozenset({
    "case_id", "financial_outcome", "observations", "hypotheses",
    "unknowns", "recommended_checks", "customer_safe_update_draft",
    "text", "evidence_ids", "alternatives",
})


def _safe_schema_error_summary(exc: ValidationError) -> str:
    """Log Pydantic field paths and error classes, without bank/model content."""
    items = []
    for issue in exc.errors(include_input=False, include_context=False, include_url=False)[:8]:
        location = []
        for part in issue["loc"]:
            if isinstance(part, int):
                location.append("[]")
            elif isinstance(part, str) and part in _ALLOWED_SCHEMA_KEYS:
                location.append(part)
            else:
                location.append("<extra>")
        # The Pydantic-provided type is controlled by the validation library.
        items.append(f"{'.'.join(location) or '<root>'}:{issue['type']}")
    return ", ".join(items)



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
    recover_unresolved_aliases(request, result)
    return result


async def analyze_case(request: AIInvestigationInput, provider: JSONProvider | None = None) -> AIInvestigationOutput:
    check_case_input(request)
    provider = provider or get_provider()
    raw = await provider.generate("case", CASE_INSTRUCTION, request.model_dump(mode="json"))
    try:
        result = AIInvestigationOutput.model_validate(raw)
    except ValidationError as exc:
        logger.warning("Case contract validation failed fields=%s", _safe_schema_error_summary(exc))
        raise AIServiceError("AI_INVALID_OUTPUT", "Case model output violates v1.0 schema.") from exc
    # Never forward provider-authored customer communication. Backend approval required.
    result.customer_safe_update_draft = NEUTRAL_CUSTOMER_DRAFT
    validate_case(request, result)
    return result

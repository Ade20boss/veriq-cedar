"""Deterministic trust boundaries; never rely on the prompt alone for correctness."""
from __future__ import annotations

from .errors import AIServiceError
from .financial_safety import contains_unqualified_outcome, recommends_financial_action
from .schemas import AIExtractInput, AIExtractOutput, AIInvestigationInput, AIInvestigationOutput


def _invalid(reason: str) -> None:
    raise AIServiceError("AI_INVALID_OUTPUT", reason, 502)


def check_extract_input(request: AIExtractInput) -> None:
    if not request.bank_id.strip() or not request.source_id.strip() or not request.source_kind.strip():
        raise AIServiceError("AI_INVALID_INPUT", "Bank, source and kind must be nonempty.", 422)
    if not request.chunks or len(request.chunks) > 30:
        raise AIServiceError("AI_INVALID_INPUT", "Provide 1-30 source chunks.", 422)
    ids = [c.chunk_id for c in request.chunks]
    if not all(ids) or len(set(ids)) != len(ids):
        raise AIServiceError("AI_INVALID_INPUT", "Chunk identifiers must be unique and nonempty.", 422)
    if any(not c.text.strip() for c in request.chunks) or sum(len(c.text) for c in request.chunks) > 50_000:
        raise AIServiceError("AI_INVALID_INPUT", "Source text is empty or exceeds demo limits.", 422)


def validate_extraction(request: AIExtractInput, result: AIExtractOutput) -> None:
    if result.source_id != request.source_id:
        _invalid("Extracted source ID does not match input source ID.")
    chunks = {c.chunk_id: c.text for c in request.chunks}
    seen_ids: set[str] = set()
    for claim in result.claims:
        if not claim.claim_id.strip() or claim.claim_id in seen_ids:
            _invalid("Missing or duplicate claim ID.")
        seen_ids.add(claim.claim_id)
        if claim.source_locator not in chunks:
            _invalid("Claim references an unknown chunk locator.")
        source_text = chunks[claim.source_locator]
        if not claim.quoted_evidence.strip() or claim.quoted_evidence not in source_text:
            _invalid("Claim quotation does not occur verbatim in its source chunk.")
        if not claim.subject.type.strip() or not claim.subject.external_id.strip():
            _invalid("Claim's typed subject identifier is missing.")
        if claim.subject.external_id not in source_text:
            _invalid("Claim's subject identifier is not supported by the source chunk.")
        if not claim.predicate.strip() or not claim.object.strip():
            _invalid("Claim predicate/object must not be blank.")
        if claim.predicate == "REPORTED_CAUSE" and not claim.needs_review:
            _invalid("Reported causal claims must require review.")
    if any(not mention.strip() for mention in result.unresolved_mentions):
        _invalid("Unresolved entity mention must not be blank.")


def check_case_input(request: AIInvestigationInput) -> None:
    if not request.case_id.strip() or not request.bank_id.strip() or not request.question.strip():
        raise AIServiceError("AI_INVALID_INPUT", "Case, bank and question must be nonempty.", 422)
    if len(request.evidence) > 100 or len(request.known_relationships) > 100 or len(request.historical_incidents) > 50:
        raise AIServiceError("AI_INVALID_INPUT", "Evidence package exceeds demo limits.", 422)
    ids = [item.id for item in request.evidence]
    if len(ids) != len(set(ids)) or any(not value.strip() for value in ids):
        raise AIServiceError("AI_INVALID_INPUT", "Evidence IDs must be unique and nonempty.", 422)
    if any(r.bank_id != request.bank_id for r in request.known_relationships):
        raise AIServiceError("AI_INVALID_INPUT", "Cross-bank relationship is not permitted.", 422)
    if any(r.bank_id != request.bank_id for r in request.historical_incidents):
        raise AIServiceError("AI_INVALID_INPUT", "Cross-bank incident is not permitted.", 422)
    # Scope of EvidenceRecord is not expressible (no bank_id in approved v1.0 record).
    # Caller MUST enforce its own bank/customer permissions before invoking this service.




def validate_case(request: AIInvestigationInput, result: AIInvestigationOutput) -> None:
    if result.case_id != request.case_id or result.financial_outcome != request.financial_outcome:
        _invalid("AI must preserve case ID and bank-authoritative financial outcome exactly.")
    allowed = {e.id for e in request.evidence if e.verified_for_purpose}
    for finding in [*result.observations, *result.hypotheses]:
        if not finding.text.strip():
            _invalid("Empty investigation finding.")
        if not finding.evidence_ids or any(eid not in allowed for eid in finding.evidence_ids):
            _invalid("Investigation references missing or ineligible evidence IDs.")
    if any(not h.alternatives or any(not a.strip() for a in h.alternatives) for h in result.hypotheses):
        _invalid("Hypotheses require meaningful alternatives.")
    if request.financial_outcome == "UNKNOWN":
        if not result.unknowns:
            _invalid("Unknown financial outcome must have explicit uncertainty.")
        texts = [
            *(o.text for o in result.observations),
            *(h.text for h in result.hypotheses),
            *(a for h in result.hypotheses for a in h.alternatives),
            *result.unknowns,
            *result.recommended_checks,
            result.customer_safe_update_draft,
        ]
        if any(contains_unqualified_outcome(t) for t in texts):
            _invalid("AI asserts a definitive recipient/payment outcome while bank outcome is UNKNOWN.")
    if any(recommends_financial_action(t) for t in [*result.recommended_checks, result.customer_safe_update_draft]):
        _invalid("AI recommended an unauthorized financial action; advisory checks only.")

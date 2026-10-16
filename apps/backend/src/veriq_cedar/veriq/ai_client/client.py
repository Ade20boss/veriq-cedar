"""Narrow, synchronous, fail-closed client for Veriq AI contract v1.0.

Not a bank authority. Invoke it outside DB transactions after bank-scoped
permission checks. A3 case-free incident analysis is NOT supported here.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Literal
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from pydantic import BaseModel, ConfigDict, ValidationError

_MAX_RESPONSE_BYTES = 256 * 1024
_OUTCOMES = {"UNKNOWN", "CREDIT_CONFIRMED", "FAILURE_CONFIRMED", "REVERSAL_POSTED"}


class AIClientError(Exception):
    """Sanitized provider/client failure; excludes customer data and secret values."""

    def __init__(self, code: str, *, retryable: bool = False) -> None:
        super().__init__(code)
        self.code = code
        self.retryable = retryable


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class _Subject(_Strict):
    type: str
    external_id: str


class _Claim(_Strict):
    claim_id: str
    subject: _Subject
    predicate: str
    object: str
    source_locator: str
    quoted_evidence: str
    classification: Literal["SOURCE_CLAIM", "CANDIDATE_RELATIONSHIP"]
    needs_review: bool


class _Extraction(_Strict):
    source_id: str
    claims: list[_Claim]
    unresolved_mentions: list[str]
    warnings: list[str]


class _Finding(_Strict):
    text: str
    evidence_ids: list[str]


class _Hypothesis(_Finding):
    alternatives: list[str]


class _CaseAnalysis(_Strict):
    case_id: str
    financial_outcome: Literal[
        "UNKNOWN", "CREDIT_CONFIRMED", "FAILURE_CONFIRMED", "REVERSAL_POSTED"
    ]
    observations: list[_Finding]
    hypotheses: list[_Hypothesis]
    unknowns: list[str]
    recommended_checks: list[str]
    customer_safe_update_draft: str


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


@dataclass(frozen=True)
class VeriqAIClient:
    """Two approved private AI operations; always caller-authenticated.

    The provided `bank_id`, chunks and evidence MUST be filtered by a separate
    authenticated banking authority. This transport cannot establish permissions.
    """

    base_url: str
    internal_key: str
    timeout_seconds: float = 12.0
    opener: Any = None  # Injectable for deterministic transport tests.

    def __post_init__(self) -> None:
        parsed = urlsplit(self.base_url)
        local = parsed.hostname in {"localhost", "127.0.0.1", "::1"}
        if (
            not self.internal_key
            or not 0 < self.timeout_seconds <= 120
            or parsed.scheme not in {"http", "https"}
            or (parsed.scheme == "http" and not local)
            or not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
            or parsed.query
            or parsed.fragment
            or parsed.path.rstrip("/")
        ):
            raise ValueError("Invalid internal AI connection configuration")
        if self.opener is None:
            object.__setattr__(self, "opener", build_opener(_NoRedirect()).open)

    def _post(self, route: str, payload: dict[str, Any]) -> dict[str, Any]:
        url = self.base_url.rstrip("/") + route
        request = Request(
            url,
            data=json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8"),
            headers={
                "X-Internal-Service-Key": self.internal_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )
        try:
            with self.opener(request, timeout=self.timeout_seconds) as response:
                if response.status != 200:
                    raise AIClientError("AI_UNEXPECTED_STATUS", retryable=response.status >= 500)
                content = response.read(_MAX_RESPONSE_BYTES + 1)
        except HTTPError as exc:
            if exc.code in {401, 403}:
                raise AIClientError("AI_AUTH_FAILED") from None
            if exc.code == 429:
                raise AIClientError("AI_RATE_LIMITED", retryable=True) from None
            if exc.code in {502, 503, 504}:
                raise AIClientError("AI_UNAVAILABLE", retryable=True) from None
            raise AIClientError("AI_REQUEST_REJECTED") from None
        except (URLError, TimeoutError, OSError):
            raise AIClientError("AI_UNAVAILABLE", retryable=True) from None
        if len(content) > _MAX_RESPONSE_BYTES:
            raise AIClientError("AI_RESPONSE_TOO_LARGE")
        try:
            result = json.loads(content)
        except (UnicodeDecodeError, ValueError):
            raise AIClientError("AI_INVALID_RESPONSE") from None
        if not isinstance(result, dict):
            raise AIClientError("AI_INVALID_RESPONSE")
        return result

    def extract_knowledge(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Returns only candidate source claims; no automatic acceptance."""
        required = {"bank_id", "source_id", "source_kind", "chunks"}
        if set(payload) != required or not payload.get("bank_id") or not payload.get("source_id"):
            raise ValueError("Invalid authorized extraction request")
        chunks = payload.get("chunks")
        if not isinstance(chunks, list) or not chunks:
            raise ValueError("Missing source chunks")
        try:
            sources = {chunk["chunk_id"]: chunk["text"] for chunk in chunks}
            if len(sources) != len(chunks) or any(not text for text in sources.values()):
                raise ValueError("Bad source chunks")
        except (KeyError, TypeError):
            raise ValueError("Invalid source chunks") from None
        raw = self._post("/internal/ai/extract-knowledge", payload)
        try:
            result = _Extraction.model_validate(raw)
            if result.source_id != payload["source_id"]:
                raise ValueError("Mismatched source ID")
            for claim in result.claims:
                text = sources[claim.source_locator]
                if (
                    not claim.quoted_evidence
                    or claim.quoted_evidence not in text
                    or not claim.subject.external_id
                    or claim.subject.external_id not in text
                ):
                    raise ValueError("Unverified source support")
                if claim.predicate == "REPORTED_CAUSE" and not claim.needs_review:
                    raise ValueError("Source cause requires review")
        except (ValidationError, ValueError, KeyError):
            raise AIClientError("AI_INVALID_RESPONSE") from None
        return result.model_dump()

    def analyze_case(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Preserves bank finality and eligible evidence IDs. DRAFT is never approved."""
        required = {
            "case_id", "bank_id", "financial_outcome", "question", "evidence",
            "known_relationships", "historical_incidents",
        }
        if set(payload) != required or payload.get("financial_outcome") not in _OUTCOMES:
            raise ValueError("Invalid authorized case request")
        if not payload.get("bank_id") or not payload.get("case_id"):
            raise ValueError("Missing bank/case identity")
        records = payload["evidence"]
        if not isinstance(records, list):
            raise ValueError("Invalid eligible evidence")
        try:
            eligible = {item["id"] for item in records if item["verified_for_purpose"] is True}
            if len({item["id"] for item in records}) != len(records):
                raise ValueError("Duplicate evidence identifiers")
        except (KeyError, TypeError):
            raise ValueError("Invalid eligible evidence") from None
        raw = self._post("/internal/ai/analyze-case", payload)
        try:
            result = _CaseAnalysis.model_validate(raw)
            if (
                result.case_id != payload["case_id"]
                or result.financial_outcome != payload["financial_outcome"]
            ):
                raise ValueError("Bank-authoritative identity/outcome changed")
            for finding in [*result.observations, *result.hypotheses]:
                if (
                    not finding.text.strip()
                    or not finding.evidence_ids
                    or not set(finding.evidence_ids) <= eligible
                ):
                    raise ValueError("Unverified finding")
            if any(not hypothesis.alternatives for hypothesis in result.hypotheses):
                raise ValueError("Hypothesis without alternatives")
            if result.financial_outcome == "UNKNOWN" and not result.unknowns:
                raise ValueError("Unknown financial outcome omitted")
        except (ValidationError, ValueError):
            raise AIClientError("AI_INVALID_RESPONSE") from None
        # Never publish or act on this returned draft; reviewer approval is separate.
        return result.model_dump()


def build_case_request(bank_id: str, bundle: dict[str, Any]) -> dict[str, Any]:
    """Map a permission-filtered CASE bundle to *exact* approved v1.0 fields.

    This is NOT a query or a bank-scope authorization check. Only a backend
    worker acting for an authorized bank should call this after checking
    the case/tenant scope and current evidence revision.
    """
    if (
        not bank_id
        or bundle.get("status") != "EVIDENCE_READY_AI_UNAVAILABLE"
        or not bundle.get("case_id")
        or bundle.get("financial_outcome") not in _OUTCOMES
        or not isinstance(bundle.get("evidence"), list)
    ):
        raise ValueError("Case evidence bundle is not eligible for AI analysis")
    return {
        "case_id": bundle["case_id"],
        "bank_id": bank_id,
        "financial_outcome": bundle["financial_outcome"],
        "question": (
            "What can the authorized evidence establish about this case, "
            "and what remains unverified?"
        ),
        "evidence": bundle["evidence"],
        "known_relationships": [],
        "historical_incidents": [],
    }

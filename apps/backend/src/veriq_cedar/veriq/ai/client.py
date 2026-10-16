"""Bounded private HTTP client; no credentials, bodies or exception text in diagnostics."""

import asyncio
import json

import httpx
from pydantic import ValidationError

from veriq_cedar.integration.ai import AIInvestigationInput, AIInvestigationOutput
from veriq_cedar.veriq.ai.safety import (
    NEUTRAL_CUSTOMER_DRAFT,
    asserts_verified_cause,
    contains_unqualified_outcome,
    recommends_financial_action,
)

MAX_BYTES = 262144
MAX_ERROR_BYTES = 8192
# Exact safe codes/statuses emitted by the existing AI service; messages are never trusted.
SERVICE_ERRORS = {
    (503, "MODEL_RATE_LIMITED"): "AI_RATE_LIMITED",
    (502, "MODEL_AUTH_FAILED"): "AI_AUTH_FAILED",
    (503, "MODEL_TIMEOUT"): "AI_TIMEOUT",
    (503, "MODEL_UNAVAILABLE"): "AI_UNAVAILABLE",
    (503, "MODEL_NOT_CONFIGURED"): "AI_UNAVAILABLE",
    (503, "MODEL_PROVIDER_INVALID"): "AI_UNAVAILABLE",
    (503, "SERVICE_NOT_CONFIGURED"): "AI_UNAVAILABLE",
    (502, "MODEL_NOT_FOUND"): "AI_UNAVAILABLE",
    (502, "MODEL_UPSTREAM_ERROR"): "AI_UNAVAILABLE",
    (502, "MODEL_MALFORMED_JSON"): "AI_INVALID_SCHEMA",
    (502, "AI_INVALID_OUTPUT"): "AI_INVALID_SCHEMA",
    (401, "UNAUTHORIZED"): "AI_AUTH_FAILED",
}


async def error_code(response: httpx.Response) -> str:
    fallback = {401: "AI_AUTH_FAILED", 403: "AI_AUTH_FAILED", 429: "AI_RATE_LIMITED"}.get(
        response.status_code, "AI_UNAVAILABLE"
    )
    # Do not inspect redirects or arbitrary success statuses as trusted service failures.
    if response.status_code not in {401, 403, 429, 502, 503}:
        return fallback
    if (
        response.headers.get("content-encoding", "identity").lower() != "identity"
        or response.headers.get("content-type", "").split(";", 1)[0].strip().lower()
        != "application/json"
    ):
        return fallback
    content = bytearray()
    async for part in response.aiter_bytes(chunk_size=MAX_ERROR_BYTES + 1):
        if len(content) + len(part) > MAX_ERROR_BYTES:
            return fallback
        content.extend(part)
    try:
        envelope = json.loads(content)
        error = envelope.get("error") if isinstance(envelope, dict) else None
        code = error.get("code") if isinstance(error, dict) else None
        if not isinstance(code, str):
            return fallback
        return SERVICE_ERRORS.get((response.status_code, code), fallback)
    except (ValueError, UnicodeError, RecursionError):
        return fallback


class AIError(Exception):
    def __init__(self, code):
        self.code = code
        super().__init__(code)


def validate_result(request: AIInvestigationInput, raw: bytes, mode: str) -> AIInvestigationOutput:
    try:
        result = AIInvestigationOutput.model_validate_json(raw)
    except (ValidationError, ValueError):
        raise AIError("AI_INVALID_SCHEMA") from None
    if result.case_id != request.case_id or result.financial_outcome != request.financial_outcome:
        raise AIError("AI_IDENTITY_MISMATCH")
    allowed = {e.id for e in request.evidence if e.verified_for_purpose}
    for finding in [*result.observations, *result.hypotheses]:
        if (
            not finding.text.strip()
            or not finding.evidence_ids
            or not set(finding.evidence_ids) <= allowed
        ):
            raise AIError("AI_INVALID_EVIDENCE")
    if any(
        not h.alternatives or any(not a.strip() for a in h.alternatives) for h in result.hypotheses
    ):
        raise AIError("AI_INVALID_FINDING")
    texts = [
        *(o.text for o in result.observations),
        *(h.text for h in result.hypotheses),
        *(a for h in result.hypotheses for a in h.alternatives),
        *result.unknowns,
        *result.recommended_checks,
        result.customer_safe_update_draft,
    ]
    if request.financial_outcome == "UNKNOWN" and (
        not result.unknowns or any(contains_unqualified_outcome(t) for t in texts)
    ):
        raise AIError("AI_UNSAFE_FINANCIAL_TEXT")
    if any(
        recommends_financial_action(t)
        for t in [*result.recommended_checks, result.customer_safe_update_draft]
    ):
        raise AIError("AI_UNSAFE_FINANCIAL_ACTION")
    if any(asserts_verified_cause(t) for t in texts):
        raise AIError("AI_UNSAFE_CAUSAL_CLAIM")
    # Wire field stays an UNAPPROVED advisory draft. Nothing invokes customer publication.
    result.customer_safe_update_draft = NEUTRAL_CUSTOMER_DRAFT
    if mode == "mock":
        label = "MOCK_PROVIDER: synthetic deterministic result; no external model called."
        if label not in result.unknowns:
            result.unknowns.append(label)
    elif mode != "openai_compatible":
        raise AIError("AI_INVALID_MODE")
    return result


class AIClient:
    def __init__(self, base_url, service_key, timeout=5, *, transport=None):
        self.base_url, self.service_key, self.timeout = base_url.rstrip("/"), service_key, timeout
        self.transport = transport

    def analyze(self, request: AIInvestigationInput) -> tuple[AIInvestigationOutput, str]:
        return asyncio.run(self._analyze(request))

    async def _analyze(self, request: AIInvestigationInput) -> tuple[AIInvestigationOutput, str]:
        body = request.model_dump_json().encode()
        if len(body) > MAX_BYTES:
            raise AIError("AI_INPUT_TOO_LARGE")
        try:
            # Overall wall-clock deadline, not just a timeout reset by each streamed chunk.
            async with (
                asyncio.timeout(self.timeout),
                httpx.AsyncClient(
                    timeout=self.timeout,
                    follow_redirects=False,
                    trust_env=False,
                    transport=self.transport,
                ) as client,
            ):
                async with client.stream(
                    "POST",
                    self.base_url + "/internal/ai/analyze-case",
                    headers={
                        "X-Internal-Service-Key": self.service_key,
                        "Content-Type": "application/json",
                        "Accept-Encoding": "identity",
                    },
                    content=body,
                ) as response:
                    if response.status_code != 200:
                        raise AIError(await error_code(response))
                    content = bytearray()
                    async for part in response.aiter_bytes():
                        content.extend(part)
                        if len(content) > MAX_BYTES:
                            raise AIError("AI_RESPONSE_TOO_LARGE")
                    mode = response.headers.get("X-Veriq-AI-Mode", "")
                    return validate_result(request, bytes(content), mode), mode
        except (TimeoutError, httpx.TimeoutException):
            raise AIError("AI_TIMEOUT") from None
        except httpx.HTTPError:
            raise AIError("AI_UNAVAILABLE") from None

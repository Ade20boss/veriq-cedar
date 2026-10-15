"""Interchangeable model providers. Mock is deterministic and expressly labelled."""
from __future__ import annotations

import json
import logging
from typing import Any, Protocol

import httpx

from .config import Settings, settings
from .errors import AIServiceError

logger = logging.getLogger("veriq.ai.provider")


class JSONProvider(Protocol):
    async def generate(self, task: str, instruction: str, payload: dict[str, Any]) -> dict[str, Any]: ...


class OpenAICompatibleProvider:
    def __init__(self, config: Settings):
        self.config = config

    async def generate(self, task: str, instruction: str, payload: dict[str, Any]) -> dict[str, Any]:
        c = self.config
        if not c.key or not c.base_url or not c.model:
            raise AIServiceError("MODEL_NOT_CONFIGURED", "Provider key, URL or model is missing.", 503)
        # Configurable to providers implementing OpenAI-compatible chat completions.
        request = {
            "model": c.model,
            "messages": [
                {"role": "system", "content": instruction},
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False, default=str)},
            ],
        }
        if c.json_mode:
            request["response_format"] = {"type": "json_object"}
        url = c.base_url.rstrip("/") + "/chat/completions"
        try:
            async with httpx.AsyncClient(timeout=c.timeout_seconds) as client:
                response = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {c.key}", "Content-Type": "application/json"},
                    json=request,
                )
                response.raise_for_status()
                value = response.json()["choices"][0]["message"]["content"]
                parsed = json.loads(value)
                if not isinstance(parsed, dict):
                    raise ValueError("LLM JSON root is not an object")
                return parsed
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            # Log status and allowlisted provider code, not response body or credentials.
            provider_code = None
            try:
                provider_code = exc.response.json().get("error", {}).get("code")
            except (ValueError, AttributeError, TypeError):
                pass
            safe_code = provider_code if provider_code in {
                "model_not_found", "invalid_api_key", "rate_limit_exceeded", "insufficient_quota"
            } else "other"
            logger.warning("LLM provider HTTP status=%s code=%s task=%s", status, safe_code, task)
            if status in {401, 403}:
                raise AIServiceError("MODEL_AUTH_FAILED", "Model provider rejected credentials or access.") from exc
            if status == 404:
                raise AIServiceError("MODEL_NOT_FOUND", "Model or provider endpoint is unavailable.") from exc
            if status == 429:
                raise AIServiceError("MODEL_RATE_LIMITED", "Model provider rate or quota limit.", 503) from exc
            raise AIServiceError("MODEL_UPSTREAM_ERROR", "Model provider rejected the request.") from exc
        except httpx.TimeoutException as exc:
            logger.warning("LLM request timeout task=%s", task)
            raise AIServiceError("MODEL_TIMEOUT", "Model provider did not respond in time.", 503) from exc
        except httpx.HTTPError as exc:
            logger.warning("LLM connectivity error type=%s task=%s", type(exc).__name__, task)
            raise AIServiceError("MODEL_UNAVAILABLE", "Model provider is unreachable.", 503) from exc
        except (ValueError, KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            logger.warning("LLM malformed response type=%s task=%s", type(exc).__name__, task)
            raise AIServiceError("MODEL_MALFORMED_JSON", "Model provider returned malformed JSON.") from exc


class MockProvider:
    """FIXTURE ONLY: deliberately narrow examples, not a substitute for model reasoning.

    Uses explicit strings in the supplied chunks, never makes independent bank assertions.
    Responses contain a conspicuous MOCK_PROVIDER warning. Do not use for live AI demos.
    """

    async def generate(self, task: str, instruction: str, payload: dict[str, Any]) -> dict[str, Any]:
        if task == "extraction":
            return self._extract(payload)
        if task == "case":
            return self._case(payload)
        raise AIServiceError("UNSUPPORTED_TASK", "Unknown AI task.", 400)

    def _extract(self, payload: dict[str, Any]) -> dict[str, Any]:
        claims: list[dict[str, Any]] = []
        unresolved: list[str] = []
        for chunk in payload["chunks"]:
            text = chunk["text"]
            locator = chunk["chunk_id"]
            candidate: tuple[str, str, str, str, bool] | None = None
            if "G2" in text and "Engineers identified a connection-pool configuration issue" in text:
                candidate = (
                    "G2", "REPORTED_CAUSE", "connection-pool configuration issue",
                    "Engineers identified a connection-pool configuration issue", True,
                )
            elif "G2" in text and "experienced repeated transaction timeouts" in text:
                candidate = (
                    "G2", "REPORTED_SYMPTOM", "repeated transaction timeouts",
                    "experienced repeated transaction timeouts", True,
                )
            elif "G2" in text and "routes transfers through Gateway G2" in text:
                candidate = (
                    "G2", "USED_BY", "Cedar outbound transfer service",
                    "routes transfers through Gateway G2", True,
                )
            if candidate:
                external_id, predicate, object_value, quote, review = candidate
                claims.append({
                    "claim_id": f"CLM-{len(claims) + 1:03d}",
                    "subject": {"type": "SERVICE", "external_id": external_id},
                    "predicate": predicate,
                    "object": object_value,
                    "source_locator": locator,
                    "quoted_evidence": quote,
                    "classification": ("CANDIDATE_RELATIONSHIP" if predicate == "USED_BY" else "SOURCE_CLAIM"),
                    "needs_review": review,
                })
            if "Bluefin" in text and "Bluefin" not in unresolved:
                unresolved.append("Bluefin")
        return {
            "source_id": payload["source_id"],
            "claims": claims,
            "unresolved_mentions": unresolved,
            "warnings": ["MOCK_PROVIDER: deterministic fixture result; no external LLM was called"],
        }

    def _case(self, payload: dict[str, Any]) -> dict[str, Any]:
        eligible = [ev for ev in payload["evidence"] if ev["verified_for_purpose"]]
        observations = []
        for ev in eligible:
            if ev["kind"] == "SENDER_DEBIT_POSTED":
                observations.append({"text": "A sender-side debit was recorded.", "evidence_ids": [ev["id"]]})
            elif ev["kind"] == "GATEWAY_RESPONSE_TIMEOUT":
                observations.append({"text": "A gateway response timeout was recorded.", "evidence_ids": [ev["id"]]})
        timeouts = [e for e in eligible if e["kind"] == "GATEWAY_RESPONSE_TIMEOUT"]
        metrics = [e for e in eligible if e["kind"] == "ROUTE_METRIC"]
        hypothesis = []
        if timeouts:
            timeout = timeouts[0]
            # Explicit route IDs are required: a similar-sounding unrelated Birch/G3
            # incident is not linked by language similarity or historic context alone.
            matching_metric = next((m for m in metrics if m["data"].get("route_id")
                                    and m["data"].get("route_id") == timeout["data"].get("route_id")), None)
            if matching_metric:
                d = matching_metric["data"]
                if all(isinstance(d.get(field), int) for field in (
                    "window_attempts", "window_timeouts", "baseline_attempts", "baseline_timeouts"
                )) and d["window_attempts"] > 0 and d["baseline_attempts"] > 0:
                    observations.append({
                        "text": (f"Route telemetry recorded {d['window_timeouts']} timeouts across "
                                 f"{d['window_attempts']} attempts, compared with "
                                 f"{d['baseline_timeouts']} across {d['baseline_attempts']} baseline attempts."),
                        "evidence_ids": [matching_metric["id"]],
                    })
                hypothesis = [{
                    "text": "Observed route conditions may have contributed to the gateway timeout; root cause is unverified.",
                    "evidence_ids": [timeout["id"], matching_metric["id"]],
                    "alternatives": ["A transaction-specific response loss may be unrelated to route-wide conditions.",
                                     "Recipient credit cannot be established from a timeout."],
                }]
            else:
                hypothesis = [{
                    "text": "A lost response could explain the absence of conclusive transfer status.",
                    "evidence_ids": [timeout["id"]],
                    "alternatives": ["A timeout does not establish whether the recipient was credited."],
                }]
        if payload["financial_outcome"] == "CREDIT_CONFIRMED":
            for ev in eligible:
                if ev["kind"] == "AUTHORIZED_CREDIT_CONFIRMATION":
                    observations.append({
                        "text": "An authorized status response recorded recipient credit.",
                        "evidence_ids": [ev["id"]],
                    })
        return {
            "case_id": payload["case_id"],
            "financial_outcome": payload["financial_outcome"],
            "observations": observations,
            "hypotheses": hypothesis,
            "unknowns": (["Authoritative beneficiary-credit outcome is not established."]
                         if payload["financial_outcome"] == "UNKNOWN" else []),
            "recommended_checks": (["Request an authorized transfer-status verification."]
                                   if payload["financial_outcome"] == "UNKNOWN" else []),
            "customer_safe_update_draft": (
                "We are checking the final status of your transfer."
                if payload["financial_outcome"] == "UNKNOWN"
                else "The bank has received updated status evidence; please refer to the approved bank record."
            ),
        }


def get_provider() -> JSONProvider:
    cfg = settings()
    if cfg.provider == "mock":
        return MockProvider()
    if cfg.provider == "openai_compatible":
        return OpenAICompatibleProvider(cfg)
    raise AIServiceError("MODEL_PROVIDER_INVALID", "Unsupported LLM_PROVIDER value.", 503)

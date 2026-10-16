"""Actual AI-provider/HTTP error envelopes and bounded, message-free client handling."""

import json
import os
import subprocess
import sys
from pathlib import Path

import httpx
import pytest

from veriq_cedar.integration.ai import AIInvestigationInput
from veriq_cedar.veriq.ai.client import MAX_ERROR_BYTES, AIClient, AIError

ROOT = Path(__file__).resolve().parents[3]
POISON = "UNTRUSTED-PROVIDER-MESSAGE secret-key postgres://private/complaint"


@pytest.fixture(scope="module")
def ai_envelopes():
    # Isolate the AI app's dotenv/module state. All upstream I/O is intercepted;
    # use its unchanged provider, guardrails, endpoint and error handler, not copied formats.
    script = r"""
import asyncio, json, httpx
from unittest.mock import patch
from app.main import app
from app.providers import OpenAICompatibleProvider
from app.config import Settings

RealClient = httpx.AsyncClient
payload = {"case_id":"error-format-case", "bank_id":"CED", "financial_outcome":"UNKNOWN",
           "question":"Inspect permitted evidence", "evidence":[], "known_relationships":[],
           "historical_incidents":[]}
provider = OpenAICompatibleProvider(Settings("openai_compatible", "fixture-provider-key",
    "http://upstream.invalid", "fixture-model", 1, True))
async def main():
    output = {}
    for failure in (429,401,403,404,500,"timeout","offline","malformed"):
        def upstream(request):
            if failure == "timeout": raise httpx.ReadTimeout("UNTRUSTED timeout")
            if failure == "offline": raise httpx.ConnectError("UNTRUSTED offline")
            if failure == "malformed":
                return httpx.Response(200,json={"choices":[{"message":{"content":"{broken"}}]})
            return httpx.Response(failure,json={"error":{"code":"other",
                "message":"UNTRUSTED upstream provider body secret"}})
        caller = RealClient(transport=httpx.ASGITransport(app=app),base_url="http://ai")
        async with caller:
            with patch("app.service.get_provider",return_value=provider), patch(
                "app.providers.httpx.AsyncClient",
                side_effect=lambda **kwargs: RealClient(
                    transport=httpx.MockTransport(upstream),**kwargs)):
                response=await caller.post("/internal/ai/analyze-case",json=payload,
                    headers={"X-Internal-Service-Key":"fixture-internal-key"})
        output[str(failure)]={"status":response.status_code,"body":response.json()}
    print(json.dumps(output))
asyncio.run(main())
"""
    env = os.environ.copy()
    env.update(
        INTERNAL_SERVICE_KEY="fixture-internal-key",
        LLM_PROVIDER="openai_compatible",
        LLM_API_KEY="",
        LLM_BASE_URL="",
        LLM_MODEL="",
    )
    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=ROOT / "apps/ai",
        env=env,
        text=True,
        capture_output=True,
        timeout=20,
        check=True,
    )
    envelopes = json.loads(result.stdout)
    assert "UNTRUSTED" not in result.stdout
    assert envelopes["429"] == {
        "status": 503,
        "body": {
            "error": {
                "code": "MODEL_RATE_LIMITED",
                "message": "Model provider rate or quota limit.",
            }
        },
    }
    assert envelopes["401"]["status"] == 502
    assert envelopes["401"]["body"]["error"]["code"] == "MODEL_AUTH_FAILED"
    return envelopes


def input_request():
    return AIInvestigationInput.model_validate_json(
        json.dumps(
            {
                "case_id": "case",
                "bank_id": "CED",
                "financial_outcome": "UNKNOWN",
                "question": "Review evidence",
                "evidence": [],
                "known_relationships": [],
                "historical_incidents": [],
            }
        )
    )


@pytest.mark.parametrize(
    "upstream,expected",
    [
        ("429", "AI_RATE_LIMITED"),
        ("401", "AI_AUTH_FAILED"),
        ("403", "AI_AUTH_FAILED"),
        ("404", "AI_UNAVAILABLE"),
        ("500", "AI_UNAVAILABLE"),
        ("timeout", "AI_TIMEOUT"),
        ("offline", "AI_UNAVAILABLE"),
        ("malformed", "AI_INVALID_SCHEMA"),
    ],
)
def test_actual_service_provider_error_envelopes(ai_envelopes, upstream, expected, capsys):
    envelope = ai_envelopes[upstream]
    # Poison the ignored message to verify the client never propagates even service messages.
    body = {"error": {**envelope["body"]["error"], "message": POISON}}
    client = AIClient(
        "http://private-ai.invalid",
        "fixture-client-key",
        transport=httpx.MockTransport(
            lambda request: httpx.Response(envelope["status"], json=body)
        ),
    )
    with pytest.raises(AIError) as error:
        client.analyze(input_request())
    assert error.value.code == expected and str(error.value) == expected
    captured = capsys.readouterr()
    assert POISON not in captured.out + captured.err


@pytest.mark.parametrize(
    "body",
    [
        {"error": {"code": "EVIL_CODE", "message": POISON}},
        {"error": {"code": ["MODEL_RATE_LIMITED"]}},
        {"error": None},
        [],
        {"code": "MODEL_RATE_LIMITED"},
    ],
)
def test_unknown_or_malformed_envelopes_fall_back(body):
    client = AIClient(
        "http://private-ai.invalid",
        "fixture-key",
        transport=httpx.MockTransport(lambda request: httpx.Response(503, json=body)),
    )
    with pytest.raises(AIError, match="^AI_UNAVAILABLE$"):
        client.analyze(input_request())


@pytest.mark.parametrize(
    "variant", ["oversize", "invalid_json", "wrong_status", "compressed", "html"]
)
def test_untrusted_errors_are_bounded_and_not_reclassified(variant):
    data = json.dumps({"error": {"code": "MODEL_RATE_LIMITED", "message": POISON}}).encode()
    headers = {"Content-Type": "application/json"}
    status = 503
    if variant == "oversize":
        data += b" " * MAX_ERROR_BYTES
    if variant == "invalid_json":
        data = b"{broken"
    if variant == "wrong_status":
        status = 500
    if variant == "compressed":
        headers["Content-Encoding"] = "gzip"
    if variant == "html":
        headers["Content-Type"] = "text/html"

    class Stream(httpx.AsyncByteStream):
        async def __aiter__(self):
            yield data
            if variant == "oversize":
                pytest.fail("Client continued reading after bounded error limit")

    client = AIClient(
        "http://private-ai.invalid",
        "fixture-key",
        transport=httpx.MockTransport(
            lambda request: httpx.Response(status, headers=headers, stream=Stream())
        ),
    )
    with pytest.raises(AIError, match="^AI_UNAVAILABLE$"):
        client.analyze(input_request())


def test_error_response_deadline_applies_to_stream():
    import asyncio

    class Slow(httpx.AsyncByteStream):
        async def __aiter__(self):
            yield b'{"error":'
            await asyncio.sleep(1)
            yield b"null}"

    client = AIClient(
        "http://private-ai.invalid",
        "fixture-key",
        timeout=0.05,
        transport=httpx.MockTransport(
            lambda request: httpx.Response(
                503, headers={"Content-Type": "application/json"}, stream=Slow()
            )
        ),
    )
    with pytest.raises(AIError, match="^AI_TIMEOUT$"):
        client.analyze(input_request())

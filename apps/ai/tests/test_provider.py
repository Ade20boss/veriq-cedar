import asyncio
from dataclasses import replace
import httpx
import pytest

from app.config import Settings
from app.errors import AIServiceError
from app.providers import OpenAICompatibleProvider

CFG = Settings(provider="openai_compatible", key="test-key-not-real", base_url="https://mock.invalid/v1",
               model="test-model", timeout_seconds=2, json_mode=True)


def test_model_not_found_is_explicit(monkeypatch):
    def handle(request: httpx.Request):
        return httpx.Response(404, json={"error": {"code": "model_not_found", "message": "Unavailable"}})
    real_cls = httpx.AsyncClient
    monkeypatch.setattr(httpx, "AsyncClient", lambda **kw: real_cls(transport=httpx.MockTransport(handle), **kw))
    with pytest.raises(AIServiceError) as exc:
        asyncio.run(OpenAICompatibleProvider(CFG).generate("extraction", "JSON only", {"source_id": "x"}))
    assert exc.value.code == "MODEL_NOT_FOUND"
    assert "key" not in exc.value.message.lower()


def test_mock_provider_does_not_need_real_key(read_fixture):
    from fastapi.testclient import TestClient
    from app.main import app
    result = TestClient(app).post("/internal/ai/extract-knowledge",
        json=read_fixture("extract_incident.json"),
        headers={"X-Internal-Service-Key": "tests-only-not-a-real-service-secret"})
    assert result.status_code == 200
    assert "MOCK_PROVIDER" in result.text


def test_missing_provider_settings_fail_cleanly():
    provider = OpenAICompatibleProvider(replace(CFG, key=""))
    with pytest.raises(AIServiceError) as exc:
        asyncio.run(provider.generate("case", "", {}))
    assert exc.value.code == "MODEL_NOT_CONFIGURED"


def test_openai_compatible_success_path_with_fake_http(monkeypatch, read_fixture):
    from app.schemas import AIExtractInput
    from app.service import extract_knowledge
    from app.providers import MockProvider
    request = AIExtractInput.model_validate(read_fixture("extract_incident.json"))
    model_response = asyncio.run(MockProvider().generate("extraction", "", request.model_dump(mode="json")))
    import json

    def handle(req: httpx.Request):
        assert req.url.path == "/v1/chat/completions"
        assert req.headers["authorization"] == "Bearer test-key-not-real"
        data = json.loads(req.content)
        assert data["model"] == "test-model"
        assert data["response_format"] == {"type": "json_object"}
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(model_response)}}]})

    real_cls = httpx.AsyncClient
    monkeypatch.setattr(httpx, "AsyncClient", lambda **kw: real_cls(transport=httpx.MockTransport(handle), **kw))
    result = asyncio.run(extract_knowledge(request, OpenAICompatibleProvider(CFG)))
    assert result.claims[0].subject.external_id == "G2"
    # This verifies the integration shape with an HTTP stub; NOT a live LLM success.

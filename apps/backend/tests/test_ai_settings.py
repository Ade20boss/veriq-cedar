"""Optional AI settings default safe; credentials never enter repr/validation errors."""

import pytest
from pydantic import ValidationError

from veriq_cedar.composition.g2 import configured_ai
from veriq_cedar.platform.settings import Settings

URL = "postgresql+psycopg://runtime:test-password@localhost/veriq_cedar_test_unit"


def config(**kwargs):
    return Settings(
        _env_file=None,
        CEDAR_DATABASE_URL=URL,
        VERIQ_DATABASE_URL=URL,
        SIMULATOR_DATABASE_URL=URL,
        **kwargs,
    )


def test_ai_disabled_and_unconfigured_fail_closed():
    assert configured_ai(config()) is None
    assert configured_ai(config(AI_ENABLED=True)) is None
    settings = config(
        AI_ENABLED=True, AI_BASE_URL="http://127.0.0.1:8001", AI_SERVICE_KEY="synthetic-private-key"
    )
    client = configured_ai(settings)
    assert client.timeout == 5 and client.base_url == "http://127.0.0.1:8001"
    assert "synthetic-private-key" not in repr(settings)
    assert "synthetic-private-key" not in settings.model_dump_json()


@pytest.mark.parametrize(
    "value",
    [
        "file:///tmp/ai",
        "https://user:secret@example.test",
        "http://ai/x",
        "http://ai?key=secret",
        "http://ai/#secret",
        "not-a-url",
        "http://ai:bad",
        "http://ai:0",
    ],
)
def test_ai_url_validation(value):
    with pytest.raises(ValidationError) as error:
        config(AI_BASE_URL=value)
    assert value not in str(error.value)


@pytest.mark.parametrize("value", [0, 21, "invalid"])
def test_ai_timeout_bounded(value):
    with pytest.raises(ValidationError):
        config(AI_TIMEOUT_SECONDS=value)


@pytest.mark.parametrize(
    "origin", ["http://localhost:8001", "http://127.0.0.1:8900", "http://[::1]:8001"]
)
def test_loopback_origins_work_without_allowlist(origin):
    assert config(AI_BASE_URL=origin).ai_base_url.get_secret_value() == origin


@pytest.mark.parametrize(
    "origin",
    [
        "https://public.example",
        "http://veriq-ai:8001",
        "http://10.0.0.7:8001",
        "http://localhost.evil:8001",
    ],
)
def test_non_loopback_requires_explicit_trust(origin):
    with pytest.raises(ValidationError) as error:
        config(AI_BASE_URL=origin)
    assert "AI_TRUSTED_ORIGINS" in str(error.value) and origin not in str(error.value)


def test_exact_internal_origin_allowlist_and_empty_unconfigured_url():
    assert configured_ai(config(AI_ENABLED=True, AI_BASE_URL="")) is None
    settings = config(
        AI_BASE_URL="http://veriq-ai:8001", AI_TRUSTED_ORIGINS=["http://veriq-ai:8001"]
    )
    assert settings.ai_base_url.get_secret_value() == "http://veriq-ai:8001"
    # Origin identity includes scheme and port; a generic private IP is not trust proof.
    for url in ("https://veriq-ai:8001", "http://veriq-ai:8002", "http://10.0.0.8:8001"):
        with pytest.raises(ValidationError):
            config(AI_BASE_URL=url, AI_TRUSTED_ORIGINS=["http://veriq-ai:8001"])


@pytest.mark.parametrize(
    "origin",
    ["http://*.internal:8001", "http://ai/path", "https://user:secret@ai", "http://ai?key=secret"],
)
def test_allowlist_origins_must_be_exact_valid_origins(origin):
    with pytest.raises(ValidationError):
        config(AI_TRUSTED_ORIGINS=[origin])


def test_internal_origin_allowlist_loads_from_private_environment(monkeypatch):
    monkeypatch.setenv("AI_TRUSTED_ORIGINS", '["https://veriq-ai.internal:8443"]')
    assert config(AI_BASE_URL="https://veriq-ai.internal:8443").ai_trusted_origins == [
        "https://veriq-ai.internal:8443"
    ]

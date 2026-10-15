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

import json
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(autouse=True)
def fixed_test_env(monkeypatch):
    monkeypatch.setenv("INTERNAL_SERVICE_KEY", "tests-only-not-a-real-service-secret")
    monkeypatch.setenv("LLM_PROVIDER", "mock")
    monkeypatch.delenv("LLM_API_KEY", raising=False)


@pytest.fixture
def read_fixture():
    def load(name: str):
        return json.loads((ROOT / "fixtures" / name).read_text(encoding="utf8"))
    return load

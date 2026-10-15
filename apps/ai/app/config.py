"""Environment-based provider config; never print credentials."""
from dataclasses import dataclass
import os
from pathlib import Path
from dotenv import load_dotenv

# Absolute path works from PyCharm, tests, or Uvicorn without cwd dependence.
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    provider: str
    key: str
    base_url: str
    model: str
    timeout_seconds: float
    json_mode: bool


def settings() -> Settings:
    return Settings(
        provider=os.getenv("LLM_PROVIDER", "mock").strip().lower(),
        key=os.getenv("LLM_API_KEY", "").strip(),
        base_url=os.getenv("LLM_BASE_URL", "").strip(),
        model=os.getenv("LLM_MODEL", "").strip(),
        timeout_seconds=float(os.getenv("LLM_TIMEOUT_SECONDS", "30")),
        json_mode=os.getenv("LLM_JSON_MODE", "true").lower() in {"true", "1", "yes"},
    )

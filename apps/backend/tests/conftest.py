from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from veriq_cedar.main import create_app
from veriq_cedar.platform.settings import Settings

BACKEND = Path(__file__).resolve().parents[1]
UNIT_URL = "postgresql+psycopg://runtime:unit-only-password@127.0.0.1:1/veriq_cedar_unit"


@pytest.fixture
def settings() -> Settings:
    return Settings(
        _env_file=None,
        ENVIRONMENT="test",
        CEDAR_DATABASE_URL=UNIT_URL,
        VERIQ_DATABASE_URL=UNIT_URL,
        SIMULATOR_DATABASE_URL=UNIT_URL,
        DB_CONNECT_TIMEOUT_SECONDS=1,
    )


@pytest.fixture
def app(settings):
    return create_app(settings)


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client(app):
    async with app.router.lifespan_context(app):
        async with AsyncClient(
            transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test"
        ) as test_client:
            yield test_client


pytest_plugins = ["postgres_support"]

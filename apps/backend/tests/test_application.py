import json
from typing import Annotated

import pytest
from fastapi import Depends
from sqlalchemy import Engine
from sqlalchemy.exc import OperationalError

from veriq_cedar.main import create_app
from veriq_cedar.platform.database.session import (
    DatabaseDomain,
    get_cedar_session,
    get_databases,
)
from veriq_cedar.platform.errors import InfrastructureError

pytestmark = pytest.mark.anyio


async def test_factory_and_lifespan_create_and_dispose_separate_engines(settings, monkeypatch):
    disposed = []
    original = Engine.dispose

    def record(engine, *args, **kwargs):
        disposed.append(engine)
        return original(engine, *args, **kwargs)

    monkeypatch.setattr(Engine, "dispose", record)
    application = create_app(settings)
    assert not hasattr(application.state, "databases")
    async with application.router.lifespan_context(application):
        registry = application.state.databases
        assert set(registry.engines) == set(DatabaseDomain)
        assert len({id(e) for e in registry.engines.values()}) == 3
        assert not disposed
    assert len(disposed) == 3


async def test_health_never_connects_database(client, app, monkeypatch):
    def fail(*args, **kwargs):
        raise AssertionError("Liveness must not connect")

    for engine in app.state.databases.engines.values():
        monkeypatch.setattr(engine, "connect", fail)
    result = await client.get("/health")
    assert result.status_code == 200
    assert result.json() == {"status": "ok"}
    assert result.headers["cache-control"] == "no-store"
    assert len(result.headers["x-request-id"]) == 32


async def test_readiness_dependency_injection_with_explicit_fake(app, client):
    class ReadyRegistry:
        called = False

        def check_ready(self):
            self.called = True

    fake = ReadyRegistry()
    app.dependency_overrides[get_databases] = lambda: fake
    assert (await client.get("/ready")).json() == {"status": "ready"}
    assert fake.called


async def test_unavailable_database_uses_actual_refused_connection(client):
    # No mock: connect via psycopg to loopback port 1, with bounded connect timeout.
    result = await client.get("/ready")
    assert result.status_code == 503
    assert result.json()["error"]["code"] == "DATABASE_UNAVAILABLE"
    assert "unit-only-password" not in result.text
    assert "127.0.0.1" not in result.text
    assert (await client.get("/health")).status_code == 200


async def test_pending_migrations_response_with_explicit_fake(app, client):
    class PendingRegistry:
        def check_ready(self):
            raise InfrastructureError("MIGRATIONS_PENDING", "Database migrations pending.")

    app.dependency_overrides[get_databases] = lambda: PendingRegistry()
    result = await client.get("/ready")
    assert result.status_code == 503
    assert result.json()["error"]["code"] == "MIGRATIONS_PENDING"


async def test_session_dependency_is_domain_scoped_and_does_not_connect(app, client):
    @app.get("/test-session")
    def use_session(session: Annotated[object, Depends(get_cedar_session)]):
        return {"cedar_engine": session.bind is app.state.databases.engines[DatabaseDomain.CEDAR]}

    assert (await client.get("/test-session")).json() == {"cedar_engine": True}


async def test_only_authorized_banking_and_infrastructure_routes(app, client):
    assert set(app.openapi()["paths"]) == {
        "/health",
        "/ready",
        "/v1/cedar/accounts/me",
        "/v1/cedar/banks",
        "/v1/cedar/name-enquiries",
        "/v1/cedar/transfers",
        "/v1/cedar/transfers/{transferId}",
    }
    assert (await client.get("/v1/cedar/accounts/me")).status_code == 401
    assert (await client.get("/v1/cedar/staff/cases")).status_code == 404
    assert (await client.get("/docs")).status_code == 404
    assert (await client.get("/infra/openapi.json")).status_code == 200


async def test_safe_http_validation_and_unexpected_errors(app, client):
    @app.get("/test-validation")
    def validated(value: int):
        return {"value": value}

    @app.get("/test-error")
    def failing():
        raise RuntimeError("postgresql://sensitive:do-not-log@private-host/db")

    invalid = await client.get("/test-validation?value=secret-input")
    assert invalid.status_code == 422
    assert invalid.json() == {
        "error": {"code": "VALIDATION_ERROR", "message": "Request validation failed."}
    }
    assert "secret-input" not in invalid.text
    failure = await client.get("/test-error")
    assert failure.status_code == 500
    assert failure.json()["error"]["code"] == "INTERNAL_ERROR"
    assert "do-not-log" not in failure.text
    assert len(failure.headers["x-request-id"]) == 32
    assert (await client.post("/health")).status_code == 405


async def test_dependency_database_error_is_sanitized(app, client):
    def fail():
        raise OperationalError("private sql", {"password": "do-not-log"}, Exception("secret-host"))

    app.dependency_overrides[get_databases] = fail
    result = await client.get("/ready")
    assert result.status_code == 503
    assert result.json()["error"]["code"] == "DATABASE_UNAVAILABLE"
    assert "do-not-log" not in result.text


async def test_structured_logs_omit_queries_and_exception_secrets(app, client, capsys):
    from veriq_cedar.platform.logging import configure_logging

    configure_logging("INFO")

    @app.get("/test-log-error")
    def fail():
        raise RuntimeError("do-not-log-secret")

    result = await client.get("/test-log-error?password=do-not-log-secret")
    records = [json.loads(line) for line in capsys.readouterr().out.splitlines() if line]
    assert records
    assert "do-not-log-secret" not in json.dumps(records)
    requests = [x for x in records if x["event"] == "request.completed"]
    assert requests[-1]["request_id"] == result.headers["x-request-id"]
    assert requests[-1]["status_code"] == 500
    assert requests[-1]["route"] == "/test-log-error"
    assert "duration_ms" in requests[-1]

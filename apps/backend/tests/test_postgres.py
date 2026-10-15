import os
import secrets
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from psycopg import sql
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import DBAPIError

from veriq_cedar.main import create_app
from veriq_cedar.platform.database.revision import SCHEMA_REVISION
from veriq_cedar.platform.database.session import DatabaseDomain, DatabaseRegistry
from veriq_cedar.platform.settings import Settings

pytestmark = pytest.mark.postgres
ROOT = Path(__file__).resolve().parents[1]


def alembic_config():
    return Config(str(ROOT / "alembic.ini"))


@pytest.fixture(scope="module")
def admin():
    dsn = os.environ.get("TEST_DATABASE_ADMIN_URL")
    if not dsn:
        pytest.skip("TEST_DATABASE_ADMIN_URL absent; real PostgreSQL test not run")
    url = make_url(dsn)
    if url.drivername != "postgresql+psycopg" or not (url.database or "").startswith(
        "veriq_cedar_test_"
    ):
        pytest.fail("Real migration tests require a dedicated veriq_cedar_test_* database")
    engine = create_engine(url, hide_parameters=True, connect_args={"connect_timeout": 2})
    try:
        with engine.connect() as connection:
            assert connection.execute(text("SELECT 1")).scalar_one() == 1
            assert not connection.execute(
                text(
                    "SELECT schema_name FROM information_schema.schemata "
                    "WHERE schema_name IN ('cedar', 'veriq', 'cedar_private')"
                )
            ).all(), "Use a fresh test database; tests do not reset existing schemas"
        yield engine
    finally:
        engine.dispose()


@pytest.fixture
def migrated(admin, monkeypatch):
    monkeypatch.setenv("MIGRATION_DATABASE_URL", admin.url.render_as_string(hide_password=False))
    command.upgrade(alembic_config(), "head")
    try:
        yield admin
    finally:
        command.downgrade(alembic_config(), "base")


@pytest.fixture
def runtime_settings(migrated):
    suffix = uuid4().hex[:10]
    roles = {domain: f"test_{domain.name.lower()}_{suffix}" for domain in DatabaseDomain}
    passwords = {domain: secrets.token_hex(16) for domain in DatabaseDomain}
    with migrated.begin() as connection:
        driver = connection.connection.driver_connection
        for domain, role in roles.items():
            driver.execute(
                sql.SQL(
                    "CREATE ROLE {} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD {}"
                ).format(sql.Identifier(role), sql.Literal(passwords[domain]))
            )
        grant_path = ROOT.parents[1] / "infra/postgres/grant-runtime.sql"
        grants = grant_path.read_text()
        grants = "\n".join(line for line in grants.splitlines() if not line.startswith("\\"))
        for variable, domain in [
            ("cedar_role", DatabaseDomain.CEDAR),
            ("veriq_role", DatabaseDomain.VERIQ),
            ("simulator_role", DatabaseDomain.SIMULATOR),
        ]:
            grants = grants.replace(
                f':"{variable}"', sql.Identifier(roles[domain]).as_string(driver)
            )
        connection.exec_driver_sql(grants)
    urls = {
        domain: migrated.url.set(username=role, password=passwords[domain]).render_as_string(
            hide_password=False
        )
        for domain, role in roles.items()
    }
    settings = Settings(
        _env_file=None,
        ENVIRONMENT="test",
        CEDAR_DATABASE_URL=urls[DatabaseDomain.CEDAR],
        VERIQ_DATABASE_URL=urls[DatabaseDomain.VERIQ],
        SIMULATOR_DATABASE_URL=urls[DatabaseDomain.SIMULATOR],
    )
    try:
        yield settings
    finally:
        with migrated.begin() as connection:
            for role in roles.values():
                connection.exec_driver_sql(f'DROP OWNED BY "{role}"')
                connection.exec_driver_sql(f'DROP ROLE "{role}"')


def test_real_migration_upgrade_idempotent_head_and_downgrade(migrated):
    command.upgrade(alembic_config(), "head")
    with migrated.connect() as connection:
        assert (
            connection.execute(text("SELECT version_num FROM public.alembic_version")).scalar_one()
            == SCHEMA_REVISION
        )
        schemas = set(
            connection.execute(
                text(
                    "SELECT schema_name FROM information_schema.schemata "
                    "WHERE schema_name IN ('cedar','veriq','cedar_private')"
                )
            ).scalars()
        )
        assert schemas == {"cedar", "veriq", "cedar_private"}
        tables = connection.execute(
            text(
                "SELECT tablename FROM pg_tables "
                "WHERE schemaname IN ('cedar','veriq','cedar_private')"
            )
        ).all()
        assert tables == []
    # Alembic autogeneration is restricted to our owned schemas.
    with migrated.begin() as connection:
        connection.execute(text("CREATE TABLE public.unrelated_probe (value integer)"))
    try:
        command.check(alembic_config())
    finally:
        with migrated.begin() as connection:
            connection.execute(text("DROP TABLE public.unrelated_probe"))
    command.downgrade(alembic_config(), "base")
    with migrated.connect() as connection:
        assert not connection.execute(
            text(
                "SELECT schema_name FROM information_schema.schemata "
                "WHERE schema_name IN ('cedar','veriq','cedar_private')"
            )
        ).all()
        assert not connection.execute(text("SELECT version_num FROM public.alembic_version")).all()


@pytest.mark.anyio
async def test_real_readiness_three_runtime_roles_and_grants(runtime_settings):
    registry = DatabaseRegistry(runtime_settings)
    try:
        registry.check_ready()
        for domain, engine in registry.engines.items():
            with engine.connect() as connection:
                for candidate in DatabaseDomain:
                    allowed = connection.execute(
                        text("SELECT has_schema_privilege(current_user, :name, 'USAGE')"),
                        {"name": candidate.value},
                    ).scalar_one()
                    assert allowed is (candidate == domain)
                assert not connection.execute(
                    text(
                        "SELECT rolsuper OR rolcreaterole OR rolcreatedb "
                        "FROM pg_roles WHERE rolname=current_user"
                    )
                ).scalar_one()
        app = create_app(runtime_settings)
        async with app.router.lifespan_context(app):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                assert (await client.get("/ready")).status_code == 200
                assert (await client.get("/ready")).json() == {"status": "ready"}
    finally:
        registry.dispose()


def test_real_veriq_and_cedar_cannot_query_private_tables(runtime_settings, migrated):
    with migrated.begin() as connection:
        connection.execute(text("CREATE TABLE cedar_private.private_probe (secret text)"))
    registry = DatabaseRegistry(runtime_settings)
    try:
        for domain in (DatabaseDomain.CEDAR, DatabaseDomain.VERIQ):
            with registry.engines[domain].connect() as connection:
                with pytest.raises(DBAPIError):
                    connection.execute(text("SELECT * FROM cedar_private.private_probe"))
                connection.rollback()
    finally:
        registry.dispose()
        with migrated.begin() as connection:
            connection.execute(text("DROP TABLE cedar_private.private_probe"))


def test_real_sessions_rollback_uncommitted_and_commit_explicitly(runtime_settings, migrated):
    registry = DatabaseRegistry(runtime_settings)
    role = registry.engines[DatabaseDomain.CEDAR].url.username
    with migrated.begin() as connection:
        connection.execute(text("CREATE TABLE cedar.session_probe (value integer)"))
        connection.exec_driver_sql(f'GRANT SELECT, INSERT ON cedar.session_probe TO "{role}"')
    try:
        generator = registry.session(DatabaseDomain.CEDAR)
        session = next(generator)
        session.execute(text("INSERT INTO cedar.session_probe VALUES (1)"))
        generator.close()
        with migrated.connect() as connection:
            assert (
                connection.execute(text("SELECT count(*) FROM cedar.session_probe")).scalar_one()
                == 0
            )
        generator = registry.session(DatabaseDomain.CEDAR)
        session = next(generator)
        session.execute(text("INSERT INTO cedar.session_probe VALUES (2)"))
        session.commit()
        generator.close()
        with migrated.connect() as connection:
            assert (
                connection.execute(text("SELECT value FROM cedar.session_probe")).scalar_one() == 2
            )
    finally:
        registry.dispose()
        with migrated.begin() as connection:
            connection.execute(text("DROP TABLE cedar.session_probe"))


@pytest.mark.anyio
async def test_real_unmigrated_database_not_ready(admin):
    url = admin.url.render_as_string(hide_password=False)
    settings = Settings(
        _env_file=None,
        ENVIRONMENT="test",
        CEDAR_DATABASE_URL=url,
        VERIQ_DATABASE_URL=url,
        SIMULATOR_DATABASE_URL=url,
    )
    app = create_app(settings)
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            result = await client.get("/ready")
            assert result.status_code == 503
            assert result.json()["error"]["code"] == "MIGRATIONS_PENDING"
            assert (await client.get("/health")).status_code == 200

import os
import secrets
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from psycopg import sql
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from veriq_cedar.platform.database.session import DatabaseDomain
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

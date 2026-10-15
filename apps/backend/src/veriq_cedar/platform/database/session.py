"""Domain-scoped engines; construction is lazy, sessions never auto-commit."""

from collections.abc import Iterator
from enum import StrEnum
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from veriq_cedar.platform.database.revision import SCHEMA_REVISION
from veriq_cedar.platform.errors import InfrastructureError
from veriq_cedar.platform.settings import Settings


class DatabaseDomain(StrEnum):
    CEDAR = "cedar"
    VERIQ = "veriq"
    SIMULATOR = "cedar_private"


class DatabaseRegistry:
    def __init__(self, settings: Settings):
        urls = {
            DatabaseDomain.CEDAR: settings.cedar_database_url,
            DatabaseDomain.VERIQ: settings.veriq_database_url,
            DatabaseDomain.SIMULATOR: settings.simulator_database_url,
        }
        self.engines: dict[DatabaseDomain, Engine] = {}
        self.sessions: dict[DatabaseDomain, sessionmaker[Session]] = {}
        try:
            for domain, url in urls.items():
                engine = create_engine(
                    url.get_secret_value(),
                    pool_pre_ping=True,
                    pool_size=settings.db_pool_size,
                    max_overflow=0,
                    pool_timeout=settings.db_pool_timeout_seconds,
                    hide_parameters=True,
                    connect_args={
                        "connect_timeout": settings.db_connect_timeout_seconds,
                        "options": f"-c statement_timeout={settings.db_statement_timeout_ms}",
                    },
                )
                self.engines[domain] = engine
                self.sessions[domain] = sessionmaker(
                    bind=engine, autoflush=False, expire_on_commit=False
                )
        except Exception:
            self.dispose()
            raise

    def dispose(self) -> None:
        for engine in self.engines.values():
            engine.dispose()

    def session(self, domain: DatabaseDomain) -> Iterator[Session]:
        # Closing an uncommitted SQLAlchemy session rolls back. Domain services must
        # explicitly commit their future units of work; a dependency never commits.
        with self.sessions[domain]() as session:
            yield session

    def check_ready(self) -> None:
        for domain, engine in self.engines.items():
            try:
                with engine.connect() as connection:
                    connection.execute(text("SELECT 1")).scalar_one()
                    table = connection.execute(
                        text("SELECT to_regclass('public.alembic_version')")
                    ).scalar_one()
                    if table is None:
                        raise InfrastructureError(
                            "MIGRATIONS_PENDING", "Database migrations pending."
                        )
                    revisions = set(
                        connection.execute(text("SELECT version_num FROM public.alembic_version"))
                        .scalars()
                        .all()
                    )
                    if revisions != {SCHEMA_REVISION}:
                        raise InfrastructureError(
                            "MIGRATIONS_PENDING", "Database migrations pending."
                        )
                    allowed = connection.execute(
                        text("SELECT has_schema_privilege(current_user, :schema, 'USAGE')"),
                        {"schema": domain.value},
                    ).scalar_one()
                    if not allowed:
                        raise InfrastructureError(
                            "DATABASE_UNAVAILABLE", "Database is unavailable."
                        )
            except SQLAlchemyError:
                raise InfrastructureError(
                    "DATABASE_UNAVAILABLE", "Database is unavailable."
                ) from None


def get_databases(request: Request) -> DatabaseRegistry:
    return request.app.state.databases


DatabaseDependency = Annotated[DatabaseRegistry, Depends(get_databases)]


def get_cedar_session(databases: DatabaseDependency) -> Iterator[Session]:
    yield from databases.session(DatabaseDomain.CEDAR)


def get_veriq_session(databases: DatabaseDependency) -> Iterator[Session]:
    yield from databases.session(DatabaseDomain.VERIQ)


def get_simulator_session(databases: DatabaseDependency) -> Iterator[Session]:
    yield from databases.session(DatabaseDomain.SIMULATOR)

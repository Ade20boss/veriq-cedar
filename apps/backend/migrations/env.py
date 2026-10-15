"""No runtime credential fallback; SQLAlchemy metadata is not create_all."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool

from veriq_cedar.cedar.accounts import models as account_models  # noqa: F401
from veriq_cedar.cedar.adapters import models as cedar_models  # noqa: F401
from veriq_cedar.cedar.base import CedarBase
from veriq_cedar.cedar.ledger import models as ledger_models  # noqa: F401
from veriq_cedar.cedar.simulator import models as simulator_models  # noqa: F401
from veriq_cedar.cedar.simulator.base import SimulatorBase
from veriq_cedar.cedar.transfers import models as transfer_models  # noqa: F401
from veriq_cedar.platform.settings import MigrationSettings
from veriq_cedar.veriq.persistence import operational as operational_models  # noqa: F401
from veriq_cedar.veriq.persistence.base import VeriqBase

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = [CedarBase.metadata, VeriqBase.metadata, SimulatorBase.metadata]
settings = MigrationSettings()


def include_name(name, type_, parent_names):
    # Autogenerate must never propose dropping unrelated/public application tables.
    return type_ != "schema" or name in {"cedar", "veriq", "cedar_private"}


def run_migrations_offline() -> None:
    context.configure(
        url=settings.database_url.get_secret_value(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_schemas=True,
        include_name=include_name,
        version_table_schema="public",
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(
        settings.database_url.get_secret_value(),
        poolclass=NullPool,
        hide_parameters=True,
        connect_args={"connect_timeout": 3, "options": "-c statement_timeout=10000"},
    )
    try:
        with engine.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                include_schemas=True,
                include_name=include_name,
                version_table_schema="public",
                compare_type=True,
            )
            with context.begin_transaction():
                context.run_migrations()
    finally:
        engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

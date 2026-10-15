import pytest
from pydantic import ValidationError

from veriq_cedar.platform.settings import MigrationSettings, Settings

URL = "postgresql+psycopg://runtime:unit-only-password@127.0.0.1:1/veriq_cedar_unit"


def values():
    return dict(CEDAR_DATABASE_URL=URL, VERIQ_DATABASE_URL=URL, SIMULATOR_DATABASE_URL=URL)


def test_missing_environment_fails_without_secret_input(monkeypatch, tmp_path):
    for key in values():
        monkeypatch.delenv(key, raising=False)
    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValidationError) as exc:
        Settings(_env_file=None)
    assert {e["loc"][0] for e in exc.value.errors()} == set(values())


@pytest.mark.parametrize("bad", ["sqlite:///test.db", "postgresql://x:y@localhost/db", "invalid"])
def test_only_explicit_psycopg_postgres_urls(bad):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **{**values(), "CEDAR_DATABASE_URL": bad})


@pytest.mark.parametrize(
    "override",
    [
        {"DB_POOL_SIZE": 0},
        {"DB_CONNECT_TIMEOUT_SECONDS": 0},
        {"DB_STATEMENT_TIMEOUT_MS": 0},
        {"ENVIRONMENT": "invented"},
        {"LOG_LEVEL": "verbose"},
    ],
)
def test_invalid_settings_rejected(override):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **values(), **override)


def test_runtime_excludes_migration_secret(settings):
    assert "migration" not in " ".join(Settings.model_fields)
    assert "unit-only-password" not in repr(settings)
    assert "unit-only-password" not in settings.model_dump_json()


def test_validation_error_does_not_echo_url():
    with pytest.raises(ValidationError) as exc:
        Settings(_env_file=None, **{**values(), "CEDAR_DATABASE_URL": "sqlite://secret-password"})
    assert "secret-password" not in str(exc.value)


def test_migration_credential_separate(monkeypatch):
    monkeypatch.delenv("MIGRATION_DATABASE_URL", raising=False)
    with pytest.raises(ValidationError):
        MigrationSettings(_env_file=None)
    config = MigrationSettings(_env_file=None, MIGRATION_DATABASE_URL=URL)
    assert config.database_url.get_secret_value() == URL


def test_dotenv_loading_and_environment_precedence(monkeypatch, tmp_path):
    for key in values():
        monkeypatch.delenv(key, raising=False)
    env = tmp_path / ".env"
    env.write_text(
        "\n".join(f"{key}={value}" for key, value in values().items()) + "\nLOG_LEVEL=INFO"
    )
    monkeypatch.setenv("LOG_LEVEL", "WARNING")
    config = Settings(_env_file=env)
    assert config.log_level == "WARNING"
    assert config.cedar_database_url.get_secret_value() == URL

"""Validate environment without logging credentials; migration access is CLI-only."""

from typing import Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError


class EnvironmentSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", extra="ignore", case_sensitive=True, hide_input_in_errors=True
    )

    @staticmethod
    def validate_postgres(value: SecretStr) -> SecretStr:
        try:
            url = make_url(value.get_secret_value())
        except ArgumentError:
            raise ValueError("must be a valid PostgreSQL psycopg URL") from None
        if url.drivername != "postgresql+psycopg" or not url.database or not url.username:
            raise ValueError("must use postgresql+psycopg with a username and database")
        if not url.host and not url.query.get("host"):
            raise ValueError("must specify a PostgreSQL TCP host or Unix socket host")
        return value


class Settings(EnvironmentSettings):
    environment: Literal["development", "test", "production"] = Field(
        default="development", validation_alias="ENVIRONMENT"
    )
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO", validation_alias="LOG_LEVEL"
    )
    cedar_database_url: SecretStr = Field(validation_alias="CEDAR_DATABASE_URL")
    veriq_database_url: SecretStr = Field(validation_alias="VERIQ_DATABASE_URL")
    simulator_database_url: SecretStr = Field(validation_alias="SIMULATOR_DATABASE_URL")
    db_connect_timeout_seconds: int = Field(
        default=2, ge=1, le=10, validation_alias="DB_CONNECT_TIMEOUT_SECONDS"
    )
    db_statement_timeout_ms: int = Field(
        default=3000, ge=100, le=30000, validation_alias="DB_STATEMENT_TIMEOUT_MS"
    )
    db_pool_size: int = Field(default=5, ge=1, le=20, validation_alias="DB_POOL_SIZE")
    db_pool_timeout_seconds: int = Field(
        default=2, ge=1, le=10, validation_alias="DB_POOL_TIMEOUT_SECONDS"
    )

    @field_validator("cedar_database_url", "veriq_database_url", "simulator_database_url")
    @classmethod
    def database_url(cls, value: SecretStr) -> SecretStr:
        return cls.validate_postgres(value)


class MigrationSettings(EnvironmentSettings):
    database_url: SecretStr = Field(validation_alias="MIGRATION_DATABASE_URL")

    @field_validator("database_url")
    @classmethod
    def migration_url(cls, value: SecretStr) -> SecretStr:
        return cls.validate_postgres(value)

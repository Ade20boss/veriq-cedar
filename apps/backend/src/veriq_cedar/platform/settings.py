"""Validate environment without logging credentials; migration access is CLI-only."""

from ipaddress import ip_address
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
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

    ai_enabled: bool = Field(default=False, validation_alias="AI_ENABLED")
    ai_base_url: SecretStr | None = Field(default=None, validation_alias="AI_BASE_URL")
    ai_service_key: SecretStr | None = Field(default=None, validation_alias="AI_SERVICE_KEY")
    ai_timeout_seconds: float = Field(
        default=5, ge=0.1, le=20, validation_alias="AI_TIMEOUT_SECONDS"
    )

    ai_trusted_origins: list[str] = Field(
        default_factory=list, validation_alias="AI_TRUSTED_ORIGINS"
    )

    @staticmethod
    def ai_origin(value: str) -> tuple[str, str, int]:
        try:
            url = urlsplit(value)
            valid = (
                url.scheme in {"http", "https"}
                and url.hostname
                and not url.username
                and not url.password
                and not url.query
                and not url.fragment
                and url.path in {"", "/"}
                and url.port != 0
                and not any(ch.isspace() or ch in "\\%*" for ch in value)
            )
            if valid:
                return (
                    url.scheme,
                    url.hostname.lower(),
                    url.port or (443 if url.scheme == "https" else 80),
                )
        except ValueError:
            pass
        raise ValueError("must be an HTTP service origin without credentials or path")

    @field_validator("ai_base_url")
    @classmethod
    def private_ai_url(cls, value):
        if value is not None:
            if not value.get_secret_value().strip():
                return None
            cls.ai_origin(value.get_secret_value())
        return value

    @field_validator("ai_trusted_origins")
    @classmethod
    def explicit_origins(cls, values):
        for value in values:
            cls.ai_origin(value)
        return values

    @model_validator(mode="after")
    def trusted_ai_destination(self):
        if self.ai_base_url is not None:
            origin = self.ai_origin(self.ai_base_url.get_secret_value())
            host = origin[1]
            try:
                loopback = ip_address(host).is_loopback
            except ValueError:
                loopback = host == "localhost"
            if not loopback and origin not in {self.ai_origin(v) for v in self.ai_trusted_origins}:
                raise ValueError("AI_BASE_URL must be loopback or match AI_TRUSTED_ORIGINS exactly")
        return self

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

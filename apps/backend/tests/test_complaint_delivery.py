"""Fixed delivery classifications never interpolate adapter/driver diagnostics."""

import logging
import sys

import pytest
from sqlalchemy.exc import SQLAlchemyError

from veriq_cedar.cedar.complaints.delivery import failure_code


@pytest.mark.parametrize(
    ("error_type", "expected"),
    [
        (SQLAlchemyError, "DELIVERY_DATABASE_ERROR"),
        (TimeoutError, "DELIVERY_TIMEOUT"),
        (ConnectionError, "DELIVERY_UNAVAILABLE"),
        (PermissionError, "DELIVERY_FORBIDDEN"),
        (ValueError, "DELIVERY_REJECTED"),
        (TypeError, "DELIVERY_REJECTED"),
        (RuntimeError, "DELIVERY_UNEXPECTED_ERROR"),
    ],
)
def test_fixed_delivery_error_classification(error_type, expected):
    assert failure_code(error_type("postgresql://user:SECRET@private/db RAW-COMPLAINT")) == expected


@pytest.mark.parametrize("level", ["INFO", "WARNING"])
def test_worker_initializes_structured_logging_from_settings(monkeypatch, settings, level):
    from veriq_cedar.composition import g2
    from veriq_cedar.platform.logging import JsonFormatter

    logger = logging.getLogger("veriq_cedar")
    monkeypatch.setattr(logger, "handlers", [])
    monkeypatch.setattr(logger, "level", logging.CRITICAL)
    monkeypatch.setattr(logger, "propagate", True)
    monkeypatch.setattr(sys, "argv", ["g2", "worker"])
    monkeypatch.setenv("LOG_LEVEL", level)
    for domain in ("cedar", "veriq", "simulator"):
        monkeypatch.setenv(
            domain.upper() + "_DATABASE_URL",
            getattr(settings, domain + "_database_url").get_secret_value(),
        )

    class StopBeforeDatabase(Exception):
        pass

    def registry(validated):
        assert isinstance(validated, g2.Settings) and validated.log_level == level
        assert logger.level == getattr(logging, level) and not logger.propagate
        assert len(logger.handlers) == 1
        assert isinstance(logger.handlers[0].formatter, JsonFormatter)
        raise StopBeforeDatabase

    monkeypatch.setattr(g2, "DatabaseRegistry", registry)
    with pytest.raises(StopBeforeDatabase):
        g2.main()

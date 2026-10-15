"""Fixed delivery classifications never interpolate adapter/driver diagnostics."""

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

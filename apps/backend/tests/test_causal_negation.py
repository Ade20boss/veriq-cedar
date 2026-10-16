"""Denying verified causality must not be confused with asserting it."""

import pytest

from veriq_cedar.veriq.ai.safety import asserts_verified_cause


@pytest.mark.parametrize(
    "text,unsafe",
    [
        ("A source-backed service relationship is documented, not a verified cause.", False),
        ("This is not the confirmed root cause.", False),
        ("This is not a verified cause but the root cause is a gateway defect.", True),
        ("Not a verified cause; the incident is confirmed.", True),
        ("Not a verified cause, confirmed cause is a gateway defect.", True),
        ("A verified cause has been established.", True),
        ("The root cause is a gateway defect.", True),
        ("The root cause is unverified.", False),
    ],
)
def test_local_causal_negation_preserves_assertion_rejection(text, unsafe):
    assert asserts_verified_cause(text) is unsafe

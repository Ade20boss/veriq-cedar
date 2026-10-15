from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from pydantic import ValidationError

from veriq_cedar.cedar.adapters.synthetic import SyntheticEvents
from veriq_cedar.integration.operational import IncidentStatus, MetricEvent
from veriq_cedar.veriq.operations.detector import DetectionRule

FIXTURE = Path(__file__).resolve().parents[3] / "contracts/demo.json"


@pytest.mark.parametrize(
    "changes,expected",
    [
        ({}, True),
        ({"timeouts": 5}, True),
        ({"timeouts": 4}, False),
        ({"attempts": 19}, False),
        ({"baseline_attempts": 99}, False),
        ({"baseline_timeouts": 6}, False),
        ({"timeouts": 5, "baseline_timeouts": 5}, True),
        ({"timeouts": 5, "baseline_timeouts": 6}, False),
    ],
)
def test_frozen_rule_thresholds(changes, expected):
    now = datetime.now(UTC)
    event = next(
        e for e in SyntheticEvents.from_fixture(FIXTURE, now).read_events() if e.service_id == "G2"
    )
    assert DetectionRule().qualifies(event.model_copy(update=changes), now) is expected


def test_internal_contract_validation_and_status_allowlist():
    now = datetime.now(UTC)
    event = SyntheticEvents.from_fixture(FIXTURE, now).read_events()[0]
    for changes in (
        {"timeouts": 99},
        {"attempts": True},
        {"window_start": now - timedelta(minutes=4)},
        {"baseline_end": now},
        {"occurred_at": now.replace(tzinfo=None)},
        {"private_ground_truth": "CANARY"},
    ):
        with pytest.raises(ValidationError):
            MetricEvent.model_validate({**event.model_dump(), **changes})
    assert not DetectionRule().qualifies(event, now - timedelta(seconds=1))
    with pytest.raises(ValueError):
        DetectionRule(min_attempts=0)
    fields = set(IncidentStatus.model_fields)
    assert fields == {
        "contract_version",
        "delivery_id",
        "bank_id",
        "incident_id",
        "investigation_id",
        "revision",
        "incident_status",
        "investigation_status",
        "review_status",
        "route_id",
        "service_id",
        "evidence_ids",
        "bank_case_ids",
        "emitted_at",
    }


def test_adapter_fixture_export_drops_private_canaries(tmp_path):
    import json

    data = json.loads(FIXTURE.read_text())
    data["hero"]["private_ground_truth"] = "PRIVATE_TRUTH_CANARY"
    for row in data["routes"].values():
        row["recipient_ledger"] = "PRIVATE_TRUTH_CANARY"
    fixture = tmp_path / "synthetic.json"
    fixture.write_text(json.dumps(data))
    source = SyntheticEvents.from_fixture(fixture, datetime.now(UTC))
    assert "PRIVATE_TRUTH_CANARY" not in str(source.metrics)
    assert all("PRIVATE_TRUTH_CANARY" not in e.model_dump_json() for e in source.read_events())

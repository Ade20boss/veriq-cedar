"""Synthetic frozen G2 rule; thresholds are not production calibrated."""

from dataclasses import dataclass
from datetime import datetime, timedelta
from fractions import Fraction

from veriq_cedar.integration.operational import MetricEvent


@dataclass(frozen=True)
class DetectionRule:
    rule_id: str = "route-timeout-degradation"
    version: str = "g0-1"
    min_attempts: int = 20
    min_baseline_attempts: int = 100
    min_timeout_percent: int = 20
    max_baseline_percent: int = 5
    min_increase_points: int = 15
    max_lateness: timedelta = timedelta(minutes=10)

    def __post_init__(self):
        if self.min_attempts < 1 or self.min_baseline_attempts < 1:
            raise ValueError("Positive sample sizes required")
        if not all(
            0 <= x <= 100
            for x in (self.min_timeout_percent, self.max_baseline_percent, self.min_increase_points)
        ) or self.max_lateness < timedelta(0):
            raise ValueError("Invalid synthetic rule thresholds")

    def qualifies(self, event: MetricEvent, now: datetime) -> bool:
        if (
            not event.observed_at <= now
            or not timedelta(0) <= now - event.window_end <= self.max_lateness
        ):
            return False
        if (
            event.attempts < self.min_attempts
            or event.baseline_attempts < self.min_baseline_attempts
        ):
            return False
        rate = Fraction(100 * event.timeouts, event.attempts)
        baseline = Fraction(100 * event.baseline_timeouts, event.baseline_attempts)
        return (
            rate >= self.min_timeout_percent
            and baseline <= self.max_baseline_percent
            and rate - baseline >= self.min_increase_points
        )

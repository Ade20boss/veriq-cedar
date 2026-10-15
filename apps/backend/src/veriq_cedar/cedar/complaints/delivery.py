"""At-least-once complaint handoff using the same bounded leased-job principles as G0."""

import logging
from datetime import timedelta

from sqlalchemy import and_, or_, select
from sqlalchemy.exc import SQLAlchemyError

from veriq_cedar.cedar.complaints.models import ComplaintOutbox
from veriq_cedar.cedar.transfers.service import now
from veriq_cedar.integration.cases import CaseEvent

logger = logging.getLogger("veriq_cedar.cedar.complaints.delivery")


def failure_code(error):
    # Only fixed codes leave this boundary; driver/adapter text may contain secrets.
    if isinstance(error, SQLAlchemyError):
        return "DELIVERY_DATABASE_ERROR"
    if isinstance(error, TimeoutError):
        return "DELIVERY_TIMEOUT"
    if isinstance(error, ConnectionError):
        return "DELIVERY_UNAVAILABLE"
    if isinstance(error, PermissionError):
        return "DELIVERY_FORBIDDEN"
    if isinstance(error, (ValueError, TypeError)):
        return "DELIVERY_REJECTED"
    return "DELIVERY_UNEXPECTED_ERROR"


def log_delivery(identifier, generation, attempts, state, error_code=None):
    level = logging.INFO if state == "SUCCEEDED" else logging.WARNING
    if state == "DEAD_LETTER":
        level = logging.ERROR
    logger.log(
        level,
        "complaint_delivery.completed",
        extra={
            "delivery_id": identifier,
            "generation": generation,
            "attempts": attempts,
            "delivery_state": state,
            "error_code": error_code,
        },
    )


class ComplaintDelivery:
    def __init__(self, sessions, receiver, bank="CED"):
        self.sessions, self.receiver, self.bank = sessions, receiver, bank

    def run_once(self):
        with self.sessions.begin() as session:
            time = now(session)
            query = (
                select(ComplaintOutbox)
                .where(
                    ComplaintOutbox.bank_id == self.bank,
                    or_(
                        and_(
                            ComplaintOutbox.state.in_(("QUEUED", "RETRY_WAIT")),
                            ComplaintOutbox.available_at <= time,
                        ),
                        and_(
                            ComplaintOutbox.state == "LEASED", ComplaintOutbox.lease_until <= time
                        ),
                    ),
                )
                .order_by(ComplaintOutbox.available_at)
                .with_for_update(skip_locked=True)
                .limit(1)
            )
            row = session.scalar(query)
            if row is None:
                return False
            if row.attempts >= 5:
                row.state = "DEAD_LETTER"
                row.lease_until = None
                exhausted = True
            else:
                row.attempts += 1
                row.generation += 1
                row.state = "LEASED"
                row.lease_until = time + timedelta(seconds=60)
                exhausted = False
            identifier, generation, attempts, payload = (
                row.id,
                row.generation,
                row.attempts,
                row.payload,
            )
        if exhausted:
            log_delivery(identifier, generation, attempts, "DEAD_LETTER", "ATTEMPTS_EXHAUSTED")
            return True
        error_code = None
        try:
            self.receiver.accept(CaseEvent.model_validate(payload))
        except Exception as error:
            error_code = failure_code(error)
        success = error_code is None
        state = "STALE_ACK"
        with self.sessions.begin() as session:
            row = session.scalar(
                select(ComplaintOutbox)
                .where(ComplaintOutbox.bank_id == self.bank, ComplaintOutbox.id == identifier)
                .with_for_update()
            )
            if (
                row is not None
                and row.state == "LEASED"
                and row.generation == generation
                and row.lease_until > now(session)
            ):
                row.state = (
                    "SUCCEEDED"
                    if success
                    else ("DEAD_LETTER" if row.attempts >= 5 else "RETRY_WAIT")
                )
                state = row.state
                row.available_at = now(session) + timedelta(
                    seconds=min(180, 5 * 3 ** (row.attempts - 1))
                )
                row.lease_until = None
        # Log after commit: a stale worker must never claim a persisted success/retry.
        log_delivery(identifier, generation, attempts, state, error_code)
        return True

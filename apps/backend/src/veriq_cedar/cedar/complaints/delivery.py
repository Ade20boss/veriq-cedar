"""At-least-once complaint handoff using the same bounded leased-job principles as G0."""

from datetime import timedelta

from sqlalchemy import and_, or_, select

from veriq_cedar.cedar.complaints.models import ComplaintOutbox
from veriq_cedar.cedar.transfers.service import now
from veriq_cedar.integration.cases import CaseEvent


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
                return True
            row.attempts += 1
            row.generation += 1
            row.state = "LEASED"
            row.lease_until = time + timedelta(seconds=60)
            identifier, generation, event = (
                row.id,
                row.generation,
                CaseEvent.model_validate(row.payload),
            )
        success = False
        try:
            self.receiver.accept(event)
            success = True
        except Exception:
            pass
        with self.sessions.begin() as session:
            row = session.scalar(
                select(ComplaintOutbox)
                .where(ComplaintOutbox.bank_id == self.bank, ComplaintOutbox.id == identifier)
                .with_for_update()
            )
            if (
                row.state == "LEASED"
                and row.generation == generation
                and row.lease_until > now(session)
            ):
                row.state = (
                    "SUCCEEDED"
                    if success
                    else ("DEAD_LETTER" if row.attempts >= 5 else "RETRY_WAIT")
                )
                row.available_at = now(session) + timedelta(
                    seconds=min(180, 5 * 3 ** (row.attempts - 1))
                )
                row.lease_until = None
        return True

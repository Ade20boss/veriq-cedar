"""Fenced durable sender dispatch. Network calls happen outside Cedar transactions."""

from dataclasses import dataclass
from datetime import timedelta

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, sessionmaker

from veriq_cedar.cedar.transfers.contracts import NetworkObservation, PaymentNetwork, PaymentRequest
from veriq_cedar.cedar.transfers.models import (
    PaymentEvidence,
    PaymentInstruction,
    Transfer,
    TransferAttempt,
)
from veriq_cedar.cedar.transfers.service import now, stage, uid


@dataclass(frozen=True)
class DispatchClaim:
    bank_id: str
    instruction_id: str
    generation: int
    request: PaymentRequest


class Dispatcher:
    def __init__(
        self, sessions: sessionmaker[Session], network: PaymentNetwork, bank_id: str = "CED"
    ):
        self.sessions, self.network, self.bank_id = sessions, network, bank_id

    def claim(self, transfer_id: str | None = None) -> DispatchClaim | None:
        with self.sessions.begin() as session:
            time = now(session)
            query = select(PaymentInstruction).where(
                PaymentInstruction.bank_id == self.bank_id,
                or_(
                    and_(
                        PaymentInstruction.state.in_(("QUEUED", "RETRY_WAIT")),
                        PaymentInstruction.available_at <= time,
                    ),
                    and_(
                        PaymentInstruction.state == "LEASED", PaymentInstruction.lease_until <= time
                    ),
                ),
            )
            if transfer_id is not None:
                query = query.where(PaymentInstruction.transfer_id == transfer_id)
            query = (
                query.order_by(PaymentInstruction.available_at, PaymentInstruction.id)
                .with_for_update(skip_locked=True)
                .limit(1)
            )
            while (job := session.scalar(query)) is not None:
                job.generation += 1
                if job.attempts >= 5:
                    job.state = "DEAD_LETTER"
                    job.lease_until = None
                    session.flush()
                    continue
                job.attempts += 1
                job.state = "LEASED"
                job.lease_until = time + timedelta(seconds=60)
                transfer = session.get(Transfer, (self.bank_id, job.transfer_id))
                if transfer.processing_stage == "DEBIT_POSTED":
                    stage(session, transfer, "SUBMITTED")
                session.add(
                    TransferAttempt(
                        bank_id=self.bank_id,
                        id=uid(),
                        transfer_id=transfer.id,
                        attempt_number=job.attempts,
                        created_at=time,
                    )
                )
                return DispatchClaim(
                    self.bank_id,
                    job.id,
                    job.generation,
                    PaymentRequest(
                        bank_id=self.bank_id,
                        transfer_id=transfer.id,
                        instruction_id=job.id,
                        amount_kobo=transfer.amount_kobo,
                        beneficiary_bank_id=transfer.beneficiary_bank_id,
                        beneficiary_account_id=transfer.beneficiary_account_id,
                    ),
                )
        return None

    def _fenced(self, session, claim):
        if claim.bank_id != self.bank_id:
            return None
        job = session.scalar(
            select(PaymentInstruction)
            .where(
                PaymentInstruction.bank_id == self.bank_id,
                PaymentInstruction.id == claim.instruction_id,
            )
            .with_for_update()
        )
        if (
            job is None
            or job.state != "LEASED"
            or job.generation != claim.generation
            or job.lease_until <= now(session)
        ):
            return None
        return job

    def complete(self, claim: DispatchClaim, observation: NetworkObservation) -> bool:
        observation = NetworkObservation.model_validate(observation.model_dump())
        request = claim.request
        if (
            observation.instruction_id,
            observation.transfer_id,
            observation.amount_kobo,
            observation.beneficiary_bank_id,
            observation.beneficiary_account_id,
        ) != (
            request.instruction_id,
            request.transfer_id,
            request.amount_kobo,
            request.beneficiary_bank_id,
            request.beneficiary_account_id,
        ):
            raise ValueError("Network evidence identity mismatch")
        with self.sessions.begin() as session:
            job = self._fenced(session, claim)
            if job is None:
                return False
            transfer = session.scalar(
                select(Transfer)
                .where(Transfer.bank_id == self.bank_id, Transfer.id == job.transfer_id)
                .with_for_update()
            )
            if transfer.processing_stage != "SUBMITTED":
                raise ValueError("Invalid network response stage")
            session.add(
                PaymentEvidence(
                    bank_id=self.bank_id,
                    id=observation.evidence_id,
                    transfer_id=transfer.id,
                    kind=observation.kind,
                    source=observation.source,
                    amount_kobo=observation.amount_kobo,
                    beneficiary_bank_id=observation.beneficiary_bank_id,
                    beneficiary_account_id=observation.beneficiary_account_id,
                    observed_at=now(session),
                )
            )
            session.flush()
            transfer.last_evidence_id = observation.evidence_id
            if observation.kind == "CREDIT_RESPONSE":
                transfer.financial_outcome = "CREDIT_CONFIRMED"
                stage(session, transfer, "ACKNOWLEDGED")
                stage(session, transfer, "COMPLETED")
            else:
                stage(session, transfer, "RESPONSE_TIMEOUT")
            job.state = "SUCCEEDED"
            job.lease_until = None
        return True

    def run_once(self, transfer_id: str | None = None) -> bool:
        claim = self.claim(transfer_id)
        if claim is None:
            return False
        try:
            observation = self.network.submit(claim.request)
            self.complete(claim, observation)
        except Exception:
            # Raw private/provider/driver exceptions never become messages or logs.
            with self.sessions.begin() as session:
                job = self._fenced(session, claim)
                if job:
                    job.state = "DEAD_LETTER" if job.attempts >= 5 else "RETRY_WAIT"
                    job.available_at = now(session) + timedelta(
                        seconds=min(180, 5 * 3 ** (job.attempts - 1))
                    )
                    job.lease_until = None
        return True

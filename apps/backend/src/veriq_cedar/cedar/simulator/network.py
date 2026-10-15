"""Restricted network capability: one durable private credit per stable instruction.

Only a permitted credit response or observed timeout crosses this boundary.
"""

from hashlib import sha256

from sqlalchemy import text
from sqlalchemy.orm import Session, sessionmaker

from veriq_cedar.cedar.simulator.models import NetworkPolicy, RecipientCredit
from veriq_cedar.cedar.transfers.contracts import NetworkObservation, PaymentRequest


class SyntheticNetwork:
    def __init__(self, sessions: sessionmaker[Session], bank_id: str):
        self.sessions, self.bank_id = sessions, bank_id

    def submit(self, instruction: PaymentRequest) -> NetworkObservation:
        instruction = PaymentRequest.model_validate(instruction.model_dump())
        if instruction.bank_id != self.bank_id:
            raise PermissionError("Network bank scope denied")
        digest = sha256(instruction.model_dump_json().encode()).hexdigest()
        with self.sessions.begin() as session:
            session.execute(
                text("SELECT pg_advisory_xact_lock(hashtextextended(:key,0))"),
                {"key": f"network/{instruction.bank_id}/{instruction.transfer_id}"},
            )
            credit = session.get(RecipientCredit, (instruction.bank_id, instruction.transfer_id))
            if credit:
                if credit.digest != digest:
                    raise ValueError("Conflicting payment instruction")
            else:
                policy = session.get(NetworkPolicy, instruction.bank_id)
                if policy is None:
                    raise RuntimeError("Synthetic operator policy not configured")
                credit = RecipientCredit(
                    bank_id=instruction.bank_id,
                    transfer_id=instruction.transfer_id,
                    instruction_id=instruction.instruction_id,
                    digest=digest,
                    recipient_bank_id=instruction.beneficiary_bank_id,
                    recipient_account_id=instruction.beneficiary_account_id,
                    credited_kobo=instruction.amount_kobo,
                    scenario=policy.scenario if instruction.beneficiary_bank_id == "ELM" else "S0",
                )
                session.add(credit)
                session.flush()
            kind = "OBSERVED_TIMEOUT" if credit.scenario == "S2" else "CREDIT_RESPONSE"
        return NetworkObservation(
            transfer_id=instruction.transfer_id,
            instruction_id=instruction.instruction_id,
            kind=kind,
            evidence_id=f"gateway/{instruction.instruction_id}/{kind}",
            amount_kobo=instruction.amount_kobo,
            beneficiary_bank_id=instruction.beneficiary_bank_id,
            beneficiary_account_id=instruction.beneficiary_account_id,
        )

"""Atomic customer command service; no private simulator access or scenario controls."""

import json
from hashlib import sha256
from uuid import uuid4

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session, sessionmaker

from veriq_cedar.cedar.accounts.auth import CustomerIdentity
from veriq_cedar.cedar.accounts.models import Account, Beneficiary, Customer
from veriq_cedar.cedar.transfers.contracts import (
    AccountView,
    Bank,
    NameEnquiryInput,
    NameEnquiryResult,
    TransferInput,
    TransferView,
)
from veriq_cedar.cedar.transfers.models import (
    BankingEvent,
    Idempotency,
    PaymentInstruction,
    Transfer,
)
from veriq_cedar.platform.errors import InfrastructureError

MAX_KOBO = 9_000_000_000_000_000


def uid():
    return str(uuid4())


def now(session):
    return session.scalar(select(func.clock_timestamp()))


def reject(code, message, status=422):
    raise InfrastructureError(code, message, status)


def stage(session: Session, transfer: Transfer, value: str):
    transfer.processing_stage = value
    transfer.updated_at = now(session)
    session.flush()
    session.add(
        BankingEvent(
            bank_id=transfer.bank_id,
            id=uid(),
            transfer_id=transfer.id,
            stage=value,
            occurred_at=transfer.updated_at,
            observed_at=transfer.updated_at,
            payload={
                "contract_version": "g1.internal.1",
                "source_system": "cedar.transfer_orchestrator",
                "route_id": transfer.route_id,
                "service_id": transfer.service_id,
                "stage": value,
                "financial_outcome": transfer.financial_outcome,
                "transfer_id": transfer.id,
            },
        )
    )
    session.flush()


class Banking:
    def __init__(self, sessions: sessionmaker[Session]):
        self.sessions = sessions

    def account(self, identity: CustomerIdentity) -> AccountView:
        with self.sessions() as session:
            account = session.scalar(
                select(Account).where(
                    Account.bank_id == identity.bank_id, Account.customer_id == identity.customer_id
                )
            )
            if account is None:
                reject("NOT_FOUND", "Resource not found.", 404)
            customer = session.get(Customer, (identity.bank_id, identity.customer_id))
            return AccountView(
                id=account.id,
                display_account_id=account.id,
                available_balance_kobo=account.available_balance_kobo,
                owner_display_name=customer.display_name,
            )

    def banks(self) -> list[Bank]:
        with self.sessions() as session:
            rows = session.execute(
                select(Beneficiary.bank_id, Beneficiary.bank_name)
                .distinct()
                .order_by(Beneficiary.bank_id)
            ).all()
            return [Bank(bank_id=i, name=n) for i, n in rows]

    def name_enquiry(self, request: NameEnquiryInput) -> NameEnquiryResult:
        request = NameEnquiryInput.model_validate(request.model_dump())
        with self.sessions() as session:
            recipient = session.get(Beneficiary, (request.bank_id, request.account_id))
            if recipient is None:
                reject("BENEFICIARY_NOT_FOUND", "Fictional beneficiary not found.")
            return NameEnquiryResult(
                bank_id=recipient.bank_id, account_id=recipient.id, beneficiary_name=recipient.name
            )

    def create(self, identity: CustomerIdentity, key: str, request: TransferInput) -> str:
        request = TransferInput.model_validate(request.model_dump())
        if not isinstance(key, str) or len(key) < 8:
            reject(
                "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must contain at least eight characters."
            )
        if request.amount_kobo > MAX_KOBO:
            reject("AMOUNT_LIMIT", "Synthetic amount exceeds supported limit.")
        key_hash = sha256(key.encode()).hexdigest()
        digest = sha256(json.dumps(request.model_dump(), sort_keys=True).encode()).hexdigest()
        with self.sessions.begin() as session:
            session.execute(
                text("SELECT pg_advisory_xact_lock(hashtextextended(:key,0))"),
                {"key": json.dumps([identity.bank_id, identity.customer_id, key_hash])},
            )
            existing = session.get(Idempotency, (identity.bank_id, identity.customer_id, key_hash))
            if existing:
                if existing.digest != digest:
                    reject(
                        "IDEMPOTENCY_CONFLICT",
                        "Idempotency key was used for different transfer details.",
                        409,
                    )
                return existing.transfer_id
            session.execute(
                text("SELECT cedar.g1_lock_account(:bank,:customer)"),
                {"bank": identity.bank_id, "customer": identity.customer_id},
            )
            account = session.scalar(
                select(Account).where(
                    Account.bank_id == identity.bank_id, Account.customer_id == identity.customer_id
                )
            )
            if account is None:
                reject("NOT_FOUND", "Resource not found.", 404)
            if account.status != "ACTIVE":
                reject("ACCOUNT_UNAVAILABLE", "Account is not active.", 409)
            if account.available_balance_kobo < request.amount_kobo:
                reject("INSUFFICIENT_FUNDS", "Insufficient available funds.")
            if (
                session.get(
                    Beneficiary, (request.beneficiary_bank_id, request.beneficiary_account_id)
                )
                is None
            ):
                reject("BENEFICIARY_NOT_FOUND", "Fictional beneficiary not found.")
            transfer = Transfer(
                bank_id=identity.bank_id,
                id=uid(),
                customer_id=identity.customer_id,
                account_id=account.id,
                reference="CED-" + uid(),
                amount_kobo=request.amount_kobo,
                beneficiary_bank_id=request.beneficiary_bank_id,
                beneficiary_account_id=request.beneficiary_account_id,
                narration=request.narration,
                route_id="ROUTE-CED-ELM-G2"
                if request.beneficiary_bank_id == "ELM"
                else "ROUTE-CED-BIRCH-G3",
                service_id="G2" if request.beneficiary_bank_id == "ELM" else "G3",
                processing_stage="CREATED",
                financial_outcome="UNKNOWN",
                last_evidence_id=None,
                created_at=now(session),
                updated_at=now(session),
            )
            session.add(transfer)
            session.flush()
            stage(session, transfer, "CREATED")
            stage(session, transfer, "VALIDATED")
            session.execute(
                text("SELECT cedar.g1_post_debit(:bank,:transfer)"),
                {"bank": identity.bank_id, "transfer": transfer.id},
            )
            stage(session, transfer, "DEBIT_POSTED")
            session.add(
                Idempotency(
                    bank_id=identity.bank_id,
                    customer_id=identity.customer_id,
                    key=key_hash,
                    digest=digest,
                    transfer_id=transfer.id,
                )
            )
            session.add(
                PaymentInstruction(
                    bank_id=identity.bank_id,
                    id=uid(),
                    transfer_id=transfer.id,
                    state="QUEUED",
                    attempts=0,
                    generation=0,
                    lease_until=None,
                    available_at=now(session),
                )
            )
            return transfer.id

    def get(self, identity: CustomerIdentity, transfer_id: str) -> TransferView:
        with self.sessions() as session:
            transfer = session.get(Transfer, (identity.bank_id, transfer_id))
            if transfer is None or transfer.customer_id != identity.customer_id:
                reject("NOT_FOUND", "Resource not found.", 404)
            return TransferView(
                **{field: getattr(transfer, field) for field in TransferView.model_fields}
            )

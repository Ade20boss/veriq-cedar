"""Administrator-only synthetic seed/session helpers; never called by customer routes."""

import secrets
from datetime import timedelta
from hashlib import sha256

from sqlalchemy import text
from sqlalchemy.orm import Session

from veriq_cedar.cedar.accounts.models import Account, Beneficiary, Customer, DemoSession
from veriq_cedar.cedar.ledger.models import Entry, Journal, LedgerAccount
from veriq_cedar.cedar.simulator.models import NetworkPolicy
from veriq_cedar.cedar.transfers.service import now

OPENING_KOBO = 10_000_000


def seed_customer(
    session: Session, customer_id="CED-CUST-001", account_id="CED-ACC-001", name="Ada (fictional)"
):
    session.execute(text("SELECT pg_advisory_xact_lock(hashtextextended('seed/cedar/g1',0))"))
    existing = session.get(Account, ("CED", account_id))
    if existing:
        opening = session.get(Journal, ("CED", "opening/" + account_id))
        if (
            existing.customer_id != customer_id
            or opening is None
            or opening.amount_kobo != OPENING_KOBO
        ):
            raise ValueError("Seed conflicts with existing state; refusing mutation")
        return
    if session.get(Customer, ("CED", customer_id)) is not None:
        raise ValueError("Existing customer without expected account; refusing mutation")
    session.add(Customer(bank_id="CED", id=customer_id, display_name=name))
    session.flush()
    session.add(
        Account(
            bank_id="CED",
            id=account_id,
            customer_id=customer_id,
            status="ACTIVE",
            currency="NGN",
            available_balance_kobo=OPENING_KOBO,
        )
    )
    session.flush()
    for identifier, kind in [
        ("CED-CASH", "DEMO_CASH_ASSET"),
        ("CED-CLEARING", "OUTGOING_TRANSFER_CLEARING"),
        (account_id, "DEPOSIT_LIABILITY"),
    ]:
        if session.get(LedgerAccount, ("CED", identifier)) is None:
            session.add(
                LedgerAccount(
                    bank_id="CED",
                    id=identifier,
                    kind=kind,
                    account_id=account_id if kind == "DEPOSIT_LIABILITY" else None,
                )
            )
    session.flush()
    journal = "opening/" + account_id
    session.add(
        Journal(
            bank_id="CED",
            id=journal,
            account_id=account_id,
            transfer_id=None,
            kind="OPENING",
            amount_kobo=OPENING_KOBO,
        )
    )
    session.flush()
    session.add_all(
        [
            Entry(
                bank_id="CED",
                id=journal + "/dr",
                journal_id=journal,
                ledger_account_id="CED-CASH",
                debit_kobo=OPENING_KOBO,
                credit_kobo=0,
            ),
            Entry(
                bank_id="CED",
                id=journal + "/cr",
                journal_id=journal,
                ledger_account_id=account_id,
                debit_kobo=0,
                credit_kobo=OPENING_KOBO,
            ),
        ]
    )
    session.flush()


def seed(session: Session, scenario: str = "S2"):
    if scenario not in ("S0", "S2"):
        raise ValueError("Unsupported scenario")
    seed_customer(session)
    for bank, account, name, bank_name in [
        ("ELM", "ELM-ACC-009", "Elm beneficiary (fictional)", "Elm Bank"),
        ("BIR", "BIR-ACC-001", "Birch beneficiary (fictional)", "Birch Bank"),
    ]:
        row = session.get(Beneficiary, (bank, account))
        if row:
            if (row.name, row.bank_name) != (name, bank_name):
                raise ValueError("Seed reference conflict")
        else:
            session.add(Beneficiary(bank_id=bank, id=account, name=name, bank_name=bank_name))
    policy = session.get(NetworkPolicy, "CED")
    if policy and policy.scenario != scenario:
        raise ValueError("Existing scenario differs; use explicit operator arm command")
    if policy is None:
        session.add(NetworkPolicy(bank_id="CED", scenario=scenario))


def mint_session(session: Session, customer_id: str) -> tuple[str, object]:
    if session.get(Customer, ("CED", customer_id)) is None:
        raise ValueError("Unknown fictional customer")
    token = secrets.token_urlsafe(32)
    expires = now(session) + timedelta(hours=1)
    session.add(
        DemoSession(
            token_hash=sha256(token.encode()).hexdigest(),
            bank_id="CED",
            customer_id=customer_id,
            expires_at=expires,
        )
    )
    return token, expires

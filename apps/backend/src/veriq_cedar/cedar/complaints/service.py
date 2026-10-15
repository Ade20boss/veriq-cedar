"""AI/Veriq-independent complaint registration and allowlisted bank adapter."""

import json
from hashlib import sha256

from pydantic import Field
from sqlalchemy import select

from veriq_cedar.cedar.complaints.models import Complaint, ComplaintOutbox
from veriq_cedar.cedar.transfers.contracts import WireModel
from veriq_cedar.cedar.transfers.models import BankingEvent, Transfer
from veriq_cedar.cedar.transfers.service import now, reject, uid
from veriq_cedar.integration.cases import CaseEvent, CaseEvidence


class ComplaintInput(WireModel):
    transfer_id: str
    description: str = Field(min_length=5, max_length=2000)


class Complaints:
    def __init__(self, sessions):
        self.sessions = sessions

    def _view(self, row):
        return {
            "id": row.id,
            "reference": row.reference,
            "transfer_id": row.transfer_id,
            "customer_report": row.customer_report,
            "status": "OPEN",
            "customer_safe_updates": [],
            "created_at": row.created_at,
        }

    def get(self, actor, case):
        with self.sessions() as session:
            row = session.get(Complaint, (actor.bank_id, case))
            if row is None or row.customer_id != actor.customer_id:
                reject("NOT_FOUND", "Complaint not found.", 404)
            return self._view(row)

    @staticmethod
    def export(session, row):
        t = session.get(Transfer, (row.bank_id, row.transfer_id))
        evidence = [
            CaseEvidence(
                id="transfer/" + t.id + "/" + t.updated_at.isoformat(),
                source_system="cedar.transfer_orchestrator",
                kind="TRANSFER_STATE",
                observed_at=t.updated_at,
                occurred_at=t.created_at,
                citation="cedar.transfers/" + t.id,
                data={
                    "transfer_id": t.id,
                    "route_id": t.route_id,
                    "service_id": t.service_id,
                    "stage": t.processing_stage,
                    "financial_outcome": t.financial_outcome,
                    "amount_kobo": t.amount_kobo,
                    "beneficiary_bank_id": t.beneficiary_bank_id,
                    "beneficiary_account_id": t.beneficiary_account_id,
                },
            )
        ]
        for e in session.scalars(
            select(BankingEvent)
            .where(BankingEvent.bank_id == row.bank_id, BankingEvent.transfer_id == t.id)
            .order_by(BankingEvent.observed_at)
        ):
            evidence.append(
                CaseEvidence(
                    id=e.id,
                    source_system="cedar.transfer_orchestrator",
                    kind="TRANSFER_STAGE",
                    observed_at=e.observed_at,
                    occurred_at=e.occurred_at,
                    citation="cedar.banking_events/" + e.id,
                    data={
                        k: v
                        for k, v in e.payload.items()
                        if k
                        in ("stage", "financial_outcome", "transfer_id", "route_id", "service_id")
                    },
                )
            )
        digest = sha256(
            json.dumps([e.model_dump(mode="json") for e in evidence], sort_keys=True).encode()
        ).hexdigest()
        return CaseEvent(
            bank_id=row.bank_id,
            event_id=row.id + "/" + digest,
            case_id=row.id,
            customer_report=row.customer_report,
            transfer_id=t.id,
            route_id=t.route_id,
            service_id=t.service_id,
            transfer_at=t.created_at,
            observed_at=max(row.created_at, t.updated_at),
            financial_outcome=t.financial_outcome,
            evidence=tuple(evidence),
        )

    def create(self, actor, request):
        with self.sessions.begin() as session:
            t = session.get(Transfer, (actor.bank_id, request.transfer_id))
            if t is None or t.customer_id != actor.customer_id:
                reject("NOT_FOUND", "Transfer not found.", 404)
            row = Complaint(
                bank_id=actor.bank_id,
                id=uid(),
                customer_id=actor.customer_id,
                transfer_id=t.id,
                reference="CED-CASE-" + uid(),
                customer_report=request.description,
                created_at=now(session),
            )
            session.add(row)
            session.flush()
            event = self.export(session, row)
            session.add(
                ComplaintOutbox(
                    bank_id=row.bank_id,
                    id=uid(),
                    case_id=row.id,
                    payload=event.model_dump(mode="json"),
                    state="QUEUED",
                    attempts=0,
                    generation=0,
                    available_at=now(session),
                    lease_until=None,
                )
            )
            return self._view(row)

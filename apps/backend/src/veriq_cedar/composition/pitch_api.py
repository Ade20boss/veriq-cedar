"""Composition of bank-scoped Veriq API; core read services hold only Veriq sessions."""

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select

from veriq_cedar.composition.investigator import InvestigatorDependency
from veriq_cedar.platform.database.session import DatabaseDependency, DatabaseDomain
from veriq_cedar.platform.errors import InfrastructureError
from veriq_cedar.veriq.knowledge.models import Source
from veriq_cedar.veriq.knowledge.service import FILES, MAX_BYTES, Knowledge
from veriq_cedar.veriq.operations.read import OperationalRead
from veriq_cedar.veriq.persistence.pitch import CaseInvestigation


def no_store(request: Request, response: Response):
    response.headers["Cache-Control"] = "no-store"
    origin = request.headers.get("origin")
    if request.method == "POST" and origin and origin != str(request.base_url).rstrip("/"):
        raise InfrastructureError("FORBIDDEN", "Origin denied.", 403)


router = APIRouter(prefix="/v1/veriq/banks/{bankId}", dependencies=[Depends(no_store)])


@router.get("/operations", operation_id="get_v1_veriq_banks_bankId_operations")
def operations(bankId: str, actor: InvestigatorDependency, databases: DatabaseDependency):
    return OperationalRead(databases.sessions[DatabaseDomain.VERIQ]).operations(bankId)


@router.get("/incidents", operation_id="get_v1_veriq_banks_bankId_incidents")
def incidents(bankId: str, actor: InvestigatorDependency, databases: DatabaseDependency):
    return OperationalRead(databases.sessions[DatabaseDomain.VERIQ]).incidents(bankId)


@router.get(
    "/incidents/{incidentId}", operation_id="get_v1_veriq_banks_bankId_incidents_incidentId"
)
def incident(
    bankId: str, incidentId: str, actor: InvestigatorDependency, databases: DatabaseDependency
):
    rows = OperationalRead(databases.sessions[DatabaseDomain.VERIQ]).incidents(bankId, incidentId)
    if not rows:
        raise InfrastructureError("NOT_FOUND", "Incident not found.", 404)
    return rows[0]


@router.get("/cases/{caseId}", operation_id="get_v1_veriq_banks_bankId_cases_caseId")
def case(bankId: str, caseId: str, actor: InvestigatorDependency, databases: DatabaseDependency):
    with databases.sessions[DatabaseDomain.VERIQ]() as session:
        inv = session.scalar(
            select(CaseInvestigation).where(
                CaseInvestigation.bank_id == bankId, CaseInvestigation.case_id == caseId
            )
        )
        if inv is None:
            raise InfrastructureError("NOT_FOUND", "Case investigation not found.", 404)
        if inv.bundle:
            return inv.bundle
        event = inv.event
        return {
            "case_id": caseId,
            "status": inv.state,
            "financial_outcome": event["financial_outcome"],
            "evidence": event["evidence"],
            "incident_ids": [],
            "ai_result": None,
        }


@router.post(
    "/cases/{caseId}/investigate",
    status_code=202,
    operation_id="post_v1_veriq_banks_bankId_cases_caseId_investigate",
)
def investigate(
    bankId: str, caseId: str, actor: InvestigatorDependency, databases: DatabaseDependency
):
    # Refresh via the bank adapter at composition, never via Veriq SQL.
    from veriq_cedar.cedar.complaints.models import Complaint
    from veriq_cedar.cedar.complaints.service import Complaints
    from veriq_cedar.veriq.investigations.cases import CaseReceiver

    with databases.sessions[DatabaseDomain.CEDAR]() as session:
        row = session.get(Complaint, (bankId, caseId))
        if row is None:
            raise InfrastructureError("NOT_FOUND", "Case not found.", 404)
        event = Complaints.export(session, row)
    receipt = CaseReceiver(databases.sessions[DatabaseDomain.VERIQ], bankId).accept(event)
    return {"id": receipt, "status": "ACCEPTED"}


@router.get("/sources", operation_id="get_v1_veriq_banks_bankId_sources")
def sources(bankId: str, actor: InvestigatorDependency, databases: DatabaseDependency):
    return Knowledge(databases.sessions[DatabaseDomain.VERIQ]).sources(bankId)


@router.post(
    "/sources",
    status_code=202,
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "file": {"type": "string", "format": "binary"},
                            "source_kind": {"type": "string"},
                        },
                        "required": ["file", "source_kind"],
                    }
                }
            },
        }
    },
    operation_id="post_v1_veriq_banks_bankId_sources",
)
async def upload(
    bankId: str, actor: InvestigatorDependency, databases: DatabaseDependency, request: Request
):
    async with request.form(max_files=1, max_fields=1, max_part_size=MAX_BYTES) as form:
        if set(form) != {"file", "source_kind"}:
            raise InfrastructureError("VALIDATION_ERROR", "file and source_kind required.", 422)
        file, kind = form["file"], form["source_kind"]
        if not hasattr(file, "read") or file.filename not in FILES or not isinstance(kind, str):
            raise InfrastructureError("VALIDATION_ERROR", "Unsupported source.", 422)
        content = await file.read(MAX_BYTES + 1)
        try:
            return Knowledge(databases.sessions[DatabaseDomain.VERIQ]).register(
                bankId, file.filename, kind, content
            )
        except (ValueError, UnicodeError):
            raise InfrastructureError(
                "VALIDATION_ERROR", "Unsupported or oversized UTF-8 source.", 422
            ) from None


@router.get("/context", operation_id="get_v1_veriq_banks_bankId_context")
def context(bankId: str, actor: InvestigatorDependency, databases: DatabaseDependency):
    return Knowledge(databases.sessions[DatabaseDomain.VERIQ]).context(bankId)


@router.get("/relationships", operation_id="get_v1_veriq_banks_bankId_relationships")
def relationships(bankId: str, actor: InvestigatorDependency, databases: DatabaseDependency):
    return Knowledge(databases.sessions[DatabaseDomain.VERIQ]).relationships(bankId)


@router.get(
    "/sources/{sourceId}/claims", operation_id="get_v1_veriq_banks_bankId_sources_sourceId_claims"
)
def claims(
    bankId: str, sourceId: str, actor: InvestigatorDependency, databases: DatabaseDependency
):
    with databases.sessions[DatabaseDomain.VERIQ]() as session:
        if session.get(Source, (bankId, sourceId)) is None:
            raise InfrastructureError("NOT_FOUND", "Source not found.", 404)
    return []  # No AI provider was called; documents remain pending, not fake claims.

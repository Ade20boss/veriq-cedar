"""Only the five approved Cedar customer operations; no operator/session routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request, Response

from veriq_cedar.cedar.accounts.auth import CustomerDependency
from veriq_cedar.cedar.complaints.service import ComplaintInput, Complaints
from veriq_cedar.cedar.transfers.contracts import (
    AccountView,
    Bank,
    NameEnquiryInput,
    NameEnquiryResult,
    TransferInput,
    TransferView,
)
from veriq_cedar.cedar.transfers.dispatcher import Dispatcher
from veriq_cedar.cedar.transfers.service import Banking
from veriq_cedar.composition.financial import get_dispatcher
from veriq_cedar.platform.database.session import DatabaseDependency, DatabaseDomain


def customer_transport(request: Request, response: Response):
    from veriq_cedar.platform.errors import InfrastructureError

    response.headers["Cache-Control"] = "no-store"
    if request.method == "POST":
        origin = request.headers.get("origin")
        if origin and origin != str(request.base_url).rstrip("/"):
            raise InfrastructureError("FORBIDDEN", "Access denied.", 403)
        if request.headers.get("content-type", "").split(";", 1)[0].lower() != "application/json":
            raise InfrastructureError("UNSUPPORTED_MEDIA_TYPE", "JSON request required.", 415)


router = APIRouter(
    prefix="/v1/cedar", tags=["CedarCustomer"], dependencies=[Depends(customer_transport)]
)


def banking(databases: DatabaseDependency) -> Banking:
    return Banking(databases.sessions[DatabaseDomain.CEDAR])


BankingDependency = Annotated[Banking, Depends(banking)]
DispatchDependency = Annotated[Dispatcher, Depends(get_dispatcher)]


@router.get("/accounts/me", response_model=AccountView, operation_id="get_v1_cedar_accounts_me")
def account(customer: CustomerDependency, bank: BankingDependency):
    return bank.account(customer)


@router.get("/banks", response_model=list[Bank], operation_id="get_v1_cedar_banks")
def banks(customer: CustomerDependency, bank: BankingDependency):
    return bank.banks()


@router.post(
    "/name-enquiries", response_model=NameEnquiryResult, operation_id="post_v1_cedar_name-enquiries"
)
def name_enquiry(request: NameEnquiryInput, customer: CustomerDependency, bank: BankingDependency):
    return bank.name_enquiry(request)


@router.post(
    "/transfers",
    response_model=TransferView,
    status_code=201,
    operation_id="post_v1_cedar_transfers",
)
def transfer(
    request: TransferInput,
    customer: CustomerDependency,
    bank: BankingDependency,
    dispatcher: DispatchDependency,
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key", min_length=8)],
):
    transfer_id = bank.create(customer, idempotency_key, request)
    dispatcher.run_once(transfer_id)
    return bank.get(customer, transfer_id)


@router.get(
    "/transfers/{transferId}",
    response_model=TransferView,
    operation_id="get_v1_cedar_transfers_transferId",
)
def get_transfer(transferId: str, customer: CustomerDependency, bank: BankingDependency):
    return bank.get(customer, transferId)


@router.post("/complaints", status_code=201, operation_id="post_v1_cedar_complaints")
def create_complaint(
    request: ComplaintInput, customer: CustomerDependency, databases: DatabaseDependency
):
    return Complaints(databases.sessions[DatabaseDomain.CEDAR]).create(customer, request)


@router.get("/complaints/{caseId}", operation_id="get_v1_cedar_complaints_caseId")
def get_complaint(caseId: str, customer: CustomerDependency, databases: DatabaseDependency):
    return Complaints(databases.sessions[DatabaseDomain.CEDAR]).get(customer, caseId)

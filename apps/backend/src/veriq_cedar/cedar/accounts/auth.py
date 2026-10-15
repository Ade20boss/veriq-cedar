"""Private CLI-provisioned opaque sessions. No login/minting HTTP endpoint."""

from dataclasses import dataclass
from hashlib import sha256
from typing import Annotated

from fastapi import Depends, Security
from fastapi.security import APIKeyCookie
from sqlalchemy import func, select

from veriq_cedar.cedar.accounts.models import DemoSession
from veriq_cedar.platform.database.session import DatabaseDependency, DatabaseDomain
from veriq_cedar.platform.errors import InfrastructureError


@dataclass(frozen=True)
class CustomerIdentity:
    bank_id: str
    customer_id: str


session_cookie = APIKeyCookie(
    name="cedar_demo_session", scheme_name="sessionAuth", auto_error=False
)


def authenticate(
    databases: DatabaseDependency,
    cedar_demo_session: Annotated[str | None, Security(session_cookie)],
) -> CustomerIdentity:
    if not cedar_demo_session or len(cedar_demo_session) > 256:
        raise InfrastructureError("UNAUTHENTICATED", "Authentication required.", 401)
    digest = sha256(cedar_demo_session.encode()).hexdigest()
    with databases.sessions[DatabaseDomain.CEDAR]() as session:
        record = session.scalar(
            select(DemoSession).where(
                DemoSession.token_hash == digest, DemoSession.expires_at > func.clock_timestamp()
            )
        )
        if record is None:
            raise InfrastructureError("UNAUTHENTICATED", "Authentication required.", 401)
        return CustomerIdentity(record.bank_id, record.customer_id)


CustomerDependency = Annotated[CustomerIdentity, Depends(authenticate)]

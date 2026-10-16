"""Bank-scoped staff authentication: customer tokens never grant investigator access."""

from dataclasses import dataclass
from hashlib import sha256
from typing import Annotated

from fastapi import Depends, Security
from sqlalchemy import func, select

from veriq_cedar.cedar.accounts.auth import session_cookie
from veriq_cedar.platform.database.session import DatabaseDependency, DatabaseDomain
from veriq_cedar.platform.errors import InfrastructureError
from veriq_cedar.veriq.persistence.pitch import StaffSession


@dataclass(frozen=True)
class Investigator:
    bank_id: str


def investigator(
    bankId: str,
    databases: DatabaseDependency,
    token: Annotated[str | None, Security(session_cookie)],
) -> Investigator:
    if not token or len(token) > 256:
        raise InfrastructureError("UNAUTHENTICATED", "Investigator session required.", 401)
    with databases.sessions[DatabaseDomain.VERIQ]() as session:
        actor = session.scalar(
            select(StaffSession).where(
                StaffSession.token_hash == sha256(token.encode()).hexdigest(),
                StaffSession.expires_at > func.clock_timestamp(),
            )
        )
        if actor is None or actor.role != "INVESTIGATOR":
            raise InfrastructureError("FORBIDDEN", "Investigator access denied.", 403)
        if actor.bank_id != bankId:
            raise InfrastructureError("FORBIDDEN", "Bank scope denied.", 403)
    return Investigator(bankId)


InvestigatorDependency = Annotated[Investigator, Depends(investigator)]

"""Structural extension points, not v1.1 wire-schema implementations.

Task 003 concrete internal event/result models and narrow methods live in operational.py.
Other request/result types and adapter methods remain subject to contract review.
The generic operation accepts no Cedar ORM/session dependency.
These generic future ports have no concrete implementation.
"""

from typing import Protocol, TypeVar

RequestT = TypeVar("RequestT", contravariant=True)
ResultT = TypeVar("ResultT", covariant=True)


class BankOperation(Protocol[RequestT, ResultT]):
    def __call__(self, request: RequestT, /) -> ResultT: ...


class KnowledgeSourcePort(BankOperation[RequestT, ResultT], Protocol):
    """Authorized institutional sources/chunks."""


class OperationalEventPort(BankOperation[RequestT, ResultT], Protocol):
    """Normalized events independent of staff sessions and complaints."""


class TransactionEvidencePort(BankOperation[RequestT, ResultT], Protocol):
    """Permitted banking evidence, never private simulator truth."""


class RouteMetricsPort(BankOperation[RequestT, ResultT], Protocol):
    """Source-backed service/route metrics."""


class StatusVerificationPort(BankOperation[RequestT, ResultT], Protocol):
    """Authorized verification requests, never financial outcome setters."""


class BankCasePort(BankOperation[RequestT, ResultT], Protocol):
    """Bank-owned case facts and permitted correlation."""


class InvestigationResultPort(BankOperation[RequestT, ResultT], Protocol):
    """Return permitted investigation progress/results to a bank."""

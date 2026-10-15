"""Stable public errors never echo request bodies, DSNs or database exceptions."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy.exc import InterfaceError, OperationalError, TimeoutError
from starlette.exceptions import HTTPException

logger = logging.getLogger("veriq_cedar.errors")


class ErrorDetail(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str
    message: str


class ErrorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    error: ErrorDetail


class InfrastructureError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 503):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(code)


def response(request: Request, status: int, code: str, message: str) -> JSONResponse:
    result = JSONResponse(
        status_code=status,
        content=ErrorResponse(error=ErrorDetail(code=code, message=message)).model_dump(),
    )
    result.headers["X-Request-ID"] = getattr(request.state, "request_id", "unavailable")
    result.headers["Cache-Control"] = "no-store"
    return result


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(InfrastructureError)
    async def infrastructure_error(request: Request, exc: InfrastructureError) -> JSONResponse:
        return response(request, exc.status_code, exc.code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def invalid_request(request: Request, exc: RequestValidationError) -> JSONResponse:
        return response(request, 422, "VALIDATION_ERROR", "Request validation failed.")

    @app.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException) -> JSONResponse:
        messages = {
            401: ("UNAUTHENTICATED", "Authentication required."),
            403: ("FORBIDDEN", "Access denied."),
            404: ("NOT_FOUND", "Resource not found."),
            405: ("METHOD_NOT_ALLOWED", "Method not allowed."),
        }
        code, message = messages.get(exc.status_code, ("HTTP_ERROR", "Request failed."))
        result = response(request, exc.status_code, code, message)
        if exc.headers:
            result.headers.update(exc.headers)
        return result

    async def database_error(request: Request, exc: Exception) -> JSONResponse:
        logger.warning("database.unavailable", extra={"request_id": request.state.request_id})
        return response(request, 503, "DATABASE_UNAVAILABLE", "Database is unavailable.")

    for error_type in (OperationalError, InterfaceError, TimeoutError):
        app.add_exception_handler(error_type, database_error)

    @app.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.error("request.error", extra={"request_id": request.state.request_id})
        return response(request, 500, "INTERNAL_ERROR", "An internal error occurred.")

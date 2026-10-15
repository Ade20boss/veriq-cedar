"""Private JSON HTTP API; intended caller is Daniel's backend, never a browser UI."""
import os
import secrets

from fastapi import Depends, FastAPI, Header, Request, Response
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from .config import settings  # loads .env from apps/ai regardless of working directory
from .errors import AIServiceError
from .schemas import AIExtractInput, AIExtractOutput, AIInvestigationInput, AIInvestigationOutput
from .service import extract_knowledge, analyze_case

app = FastAPI(title="Veriq Internal AI", version="1.0.0")


@app.exception_handler(RequestValidationError)
async def invalid_payload_handler(request: Request, exc: RequestValidationError):
    # Do not echo arbitrary user-provided input in validation errors.
    return JSONResponse(status_code=422, content={
        "error": {"code": "CONTRACT_VALIDATION_ERROR", "message": "Request does not match v1.0 JSON schema."}
    })


@app.exception_handler(AIServiceError)
async def ai_error_handler(request: Request, exc: AIServiceError):
    return JSONResponse(status_code=exc.status_code,
                        content={"error": {"code": exc.code, "message": exc.message}})


def check_service_key(x_internal_service_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("INTERNAL_SERVICE_KEY", "")
    if not expected or expected == "replace-with-a-long-random-service-secret":
        raise AIServiceError("SERVICE_NOT_CONFIGURED", "Internal service authentication is not configured.", 503)
    if not x_internal_service_key or not secrets.compare_digest(x_internal_service_key, expected):
        raise AIServiceError("UNAUTHORIZED", "Invalid internal service key.", 401)


@app.get("/health")
def health():
    # Runtime health only; this does not assert that a configured model is accessible.
    return {"status": "ok", "service": "veriq-ai", "mode": settings().provider}


@app.post("/internal/ai/extract-knowledge", response_model=AIExtractOutput,
          dependencies=[Depends(check_service_key)])
async def extract_route(request: AIExtractInput, response: Response):
    response.headers["X-Veriq-AI-Mode"] = settings().provider
    return await extract_knowledge(request)


@app.post("/internal/ai/analyze-case", response_model=AIInvestigationOutput,
          dependencies=[Depends(check_service_key)])
async def case_route(request: AIInvestigationInput, response: Response):
    response.headers["X-Veriq-AI-Mode"] = settings().provider
    return await analyze_case(request)

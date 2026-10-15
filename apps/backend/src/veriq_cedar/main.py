"""App factory: infrastructure and the authorized v1.0 Cedar customer slice."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Response
from pydantic import BaseModel, ConfigDict

from veriq_cedar.cedar.transfers.api import router as customer_router
from veriq_cedar.platform.database.session import DatabaseDependency, DatabaseRegistry
from veriq_cedar.platform.errors import ErrorResponse, install_exception_handlers
from veriq_cedar.platform.logging import RequestLoggingMiddleware, configure_logging
from veriq_cedar.platform.settings import Settings


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str


def create_app(settings: Settings | None = None) -> FastAPI:
    configuration = settings if settings is not None else Settings()
    configure_logging(configuration.log_level)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.databases = DatabaseRegistry(configuration)
        try:
            yield
        finally:
            app.state.databases.dispose()

    app = FastAPI(
        title="Veriq + Cedar backend foundation",
        version="0.1.0",
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
        openapi_url="/infra/openapi.json",
    )
    app.state.settings = configuration
    install_exception_handlers(app)
    app.add_middleware(RequestLoggingMiddleware)

    @app.get("/health", response_model=HealthResponse, tags=["Infrastructure"])
    def health(response: Response) -> HealthResponse:
        response.headers["Cache-Control"] = "no-store"
        return HealthResponse(status="ok")

    @app.get(
        "/ready",
        response_model=HealthResponse,
        responses={503: {"model": ErrorResponse}},
        tags=["Infrastructure"],
    )
    def ready(databases: DatabaseDependency, response: Response) -> HealthResponse:
        databases.check_ready()
        response.headers["Cache-Control"] = "no-store"
        return HealthResponse(status="ready")

    app.include_router(customer_router)
    return app

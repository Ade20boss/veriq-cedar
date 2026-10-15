"""JSON logs with generated request IDs, no query strings/bodies/DSNs."""

import json
import logging
import sys
import time
from datetime import UTC, datetime
from uuid import uuid4

from starlette.types import ASGIApp, Message, Receive, Scope, Send


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "event": record.getMessage(),
        }
        for key in ("request_id", "method", "route", "status_code", "duration_ms"):
            value = getattr(record, key, None)
            if value is not None:
                data[key] = value
        # Exception text/traceback and arbitrary extras may contain credentials.
        return json.dumps(data, ensure_ascii=True)


def configure_logging(level: str) -> None:
    logger = logging.getLogger("veriq_cedar")
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    logger.handlers = [handler]
    logger.setLevel(level)
    logger.propagate = False


class RequestLoggingMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request_id = uuid4().hex
        scope.setdefault("state", {})["request_id"] = request_id
        started = time.monotonic()
        status_code = 500

        async def send_with_id(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                headers = list(message.get("headers", []))
                headers = [(k, v) for k, v in headers if k.lower() != b"x-request-id"]
                headers.append((b"x-request-id", request_id.encode("ascii")))
                message = {**message, "headers": headers}
            await send(message)

        try:
            await self.app(scope, receive, send_with_id)
        finally:
            route = scope.get("route")
            logging.getLogger("veriq_cedar.http").info(
                "request.completed",
                extra={
                    "request_id": request_id,
                    "method": scope["method"],
                    "route": getattr(route, "path", "<unmatched>"),
                    "status_code": status_code,
                    "duration_ms": round((time.monotonic() - started) * 1000, 2),
                },
            )

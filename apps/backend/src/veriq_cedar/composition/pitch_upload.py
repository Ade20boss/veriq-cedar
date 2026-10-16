"""Bound total multipart wire bytes before parsing, including chunked requests."""

from starlette.responses import JSONResponse


class UploadLimit:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if (
            scope["type"] != "http"
            or scope["method"] != "POST"
            or not scope["path"].endswith("/sources")
        ):
            return await self.app(scope, receive, send)
        total = 0
        started = False

        async def bounded():
            nonlocal total
            message = await receive()
            total += len(message.get("body", b""))
            if total > 280000:
                raise Oversized()
            return message

        async def tracked(message):
            nonlocal started
            if message["type"] == "http.response.start":
                started = True
            await send(message)

        try:
            await self.app(scope, bounded, tracked)
        except Oversized:
            if started:
                raise
            await JSONResponse(
                {"error": {"code": "SOURCE_TOO_LARGE", "message": "Source exceeds upload limit."}},
                status_code=413,
                headers={"Cache-Control": "no-store"},
            )(scope, receive, send)


class Oversized(Exception):
    pass

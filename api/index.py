import os
import sys

# Vercel automatically sets VERCEL="1" in production; keep local development default
if "NOW_REGION" in os.environ:
    os.environ["VERCEL"] = "1"

# Resolve absolute path to project root and backend
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

for p in [PROJECT_ROOT, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.main import app as fastapi_app

class VercelPathFixMiddleware:
    """
    ASGI middleware ensuring that requests rewritten by Vercel to /api/index.py
    or /api have their real request path restored via Vercel's x-matched-path
    or x-forwarded-uri headers.
    """
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            headers = dict(scope.get("headers", []))
            current_path = scope.get("path", "")
            if current_path in ("/api/index.py", "/api/index", "/api", "/api/"):
                matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
                if matched_path and matched_path.startswith("/api"):
                    scope["path"] = matched_path
                else:
                    forwarded_uri = headers.get(b"x-forwarded-uri", b"").decode("utf-8")
                    if forwarded_uri and forwarded_uri.startswith("/api"):
                        scope["path"] = forwarded_uri.split("?")[0]
        await self.asgi_app(scope, receive, send)

app = VercelPathFixMiddleware(fastapi_app)

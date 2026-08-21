"""
Enterprise Middleware Stack
===========================
Production-hardened middleware for security, observability, and performance.

Middleware included:
  1. SecurityHeadersMiddleware — Adds OWASP-recommended HTTP security headers
  2. RequestLoggingMiddleware  — Structured per-request logging with timing
  3. RequestIDMiddleware       — Injects X-Request-ID for distributed tracing
"""
import time
import uuid
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


# ─── Security Headers ─────────────────────────────────────────────────────────

SECURITY_HEADERS = {
    # Prevent clickjacking
    "X-Frame-Options": "DENY",
    # Prevent MIME sniffing
    "X-Content-Type-Options": "nosniff",
    # Force HTTPS in browsers (1 year)
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    # Limit referrer information
    "Referrer-Policy": "strict-origin-when-cross-origin",
    # Restrict browser features
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    # Basic XSS protection (for older browsers)
    "X-XSS-Protection": "1; mode=block",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds OWASP-recommended HTTP security headers to every response.
    These are the same headers used by Zara, ASOS, and other major
    fashion e-commerce platforms.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        for header, value in SECURITY_HEADERS.items():
            response.headers[header] = value
        return response


# ─── Request ID ───────────────────────────────────────────────────────────────

class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Generates or passes through a unique X-Request-ID header.
    Used for distributed tracing — correlate frontend errors with backend logs.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        # Make available to downstream handlers
        request.state.request_id = request_id

        # Bind to structlog context so all log lines in this request include it
        try:
            import structlog
            structlog.contextvars.clear_contextvars()
            structlog.contextvars.bind_contextvars(request_id=request_id)
        except ImportError:
            pass

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


# ─── Request Logging ──────────────────────────────────────────────────────────

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Logs every HTTP request with:
      - method, path, status code
      - response time in milliseconds
      - request_id (from RequestIDMiddleware)
    
    Skips health check endpoints to reduce noise.
    """
    SKIP_PATHS = {"/", "/health", "/favicon.ico"}

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        start = time.perf_counter()
        request_id = getattr(request.state, "request_id", "-")

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        status = response.status_code

        log_fn = logger.warning if status >= 400 else logger.info
        log_fn(
            "http_request",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status": status,
                "duration_ms": duration_ms,
                "request_id": request_id,
            }
        )

        # Expose timing to frontend (useful for debugging)
        response.headers["X-Response-Time"] = f"{duration_ms}ms"
        return response

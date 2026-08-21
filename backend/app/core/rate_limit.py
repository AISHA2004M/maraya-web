"""
Rate Limiting — SlowAPI (enterprise-grade)
==========================================
Protects the API from abuse, brute-force attacks, and scraping.

Limits:
  - Auth endpoints (login/register):  5 requests/minute per IP
  - Try-on endpoints:                10 requests/minute per IP  
  - General API endpoints:          100 requests/minute per IP

Uses Redis as the backend store (falls back to in-memory in dev).
"""
import logging
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# ─── SlowAPI Setup ────────────────────────────────────────────────────────────

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded

    limiter = Limiter(
        key_func=get_remote_address,
        # Global default: 200 requests/minute
        default_limits=["200/minute"],
        storage_uri=None,  # Will be set in main.py from settings.REDIS_URL
    )
    HAS_SLOWAPI = True

except ImportError:
    logger.warning(
        "slowapi not installed — rate limiting disabled. "
        "Run: pip install slowapi"
    )
    HAS_SLOWAPI = False
    limiter = None
    RateLimitExceeded = Exception
    _rate_limit_exceeded_handler = None


def get_limiter():
    """Return the configured limiter (or None if slowapi unavailable)."""
    return limiter


# ─── Rate limit decorators ────────────────────────────────────────────────────

def auth_limit(f: Callable) -> Callable:
    """5 requests/minute — for login, register, password reset."""
    if HAS_SLOWAPI and limiter:
        return limiter.limit("5/minute")(f)
    return f


def tryon_limit(f: Callable) -> Callable:
    """10 requests/minute — for AI try-on (expensive compute)."""
    if HAS_SLOWAPI and limiter:
        return limiter.limit("10/minute")(f)
    return f


def upload_limit(f: Callable) -> Callable:
    """20 requests/minute — for file uploads."""
    if HAS_SLOWAPI and limiter:
        return limiter.limit("20/minute")(f)
    return f


def search_limit(f: Callable) -> Callable:
    """60 requests/minute — for search endpoints."""
    if HAS_SLOWAPI and limiter:
        return limiter.limit("60/minute")(f)
    return f

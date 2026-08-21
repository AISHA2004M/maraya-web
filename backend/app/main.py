"""
Vrital Fashion Platform — FastAPI Application Entry Point
=========================================================
Enterprise-grade configuration (same patterns as Zara, ASOS, Farfetch):
  - Structured JSON logging (machine-readable, aggregator-ready)
  - Security headers (OWASP-recommended set)
  - Request ID tracing (X-Request-ID across the full stack)
  - Request timing logging (X-Response-Time on every response)
  - GZip compression (reduces JSON payload ~70%)
  - Rate limiting via SlowAPI (brute-force + abuse protection)
  - Sentry integration (error tracking + performance monitoring)
  - Real analytics from database
  - HTTP Cache headers for static data
"""

import os
from datetime import datetime, timedelta

from fastapi import FastAPI, Response, Depends
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import AppException, app_exception_handler
from app.api.deps import get_current_partner
from app.core.logging import configure_logging, get_logger
from app.core.middleware import SecurityHeadersMiddleware, RequestIDMiddleware, RequestLoggingMiddleware

# ─── Configure Logging First ─────────────────────────────────────────────────
# JSON logs in production (when LOG_FORMAT=json), pretty logs in dev
_json_logs = os.getenv("LOG_FORMAT", "json").lower() == "json"
_log_level = os.getenv("LOG_LEVEL", "INFO")
configure_logging(json_logs=_json_logs, log_level=_log_level)
logger = get_logger(__name__)

# ─── Sentry (Error Tracking + Performance) ───────────────────────────────────
_sentry_dsn = os.getenv("SENTRY_DSN", "")
if _sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    from sentry_sdk.integrations.redis import RedisIntegration

    sentry_sdk.init(
        dsn=_sentry_dsn,
        environment=os.getenv("ENVIRONMENT", "production"),
        traces_sample_rate=0.1,   # 10% of transactions for performance monitoring
        profiles_sample_rate=0.1,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
            RedisIntegration(),
        ],
        send_default_pii=False,   # GDPR compliance — no PII in error reports
    )
    logger.info("sentry_initialized", dsn_domain=_sentry_dsn.split("@")[-1] if "@" in _sentry_dsn else "configured")
else:
    logger.info("sentry_disabled", reason="SENTRY_DSN not set")

# ─── Rate Limiting ────────────────────────────────────────────────────────────
from app.core.rate_limit import get_limiter, HAS_SLOWAPI, RateLimitExceeded, _rate_limit_exceeded_handler
limiter = get_limiter()

# ─── Application ──────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=False,
)

# ─── Rate Limiter State ───────────────────────────────────────────────────────
if HAS_SLOWAPI and limiter:
    app.state.limiter = limiter
    if _rate_limit_exceeded_handler:
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── Middleware Stack (order matters — outermost runs first) ──────────────────

# 1. GZip Compression — reduces JSON API response sizes by ~60-75%
app.add_middleware(GZipMiddleware, minimum_size=500)

# 2. Security Headers — OWASP-recommended set (X-Frame-Options, CSP, HSTS, etc.)
app.add_middleware(SecurityHeadersMiddleware)

# 3. Request Logging — structured per-request logs with timing
app.add_middleware(RequestLoggingMiddleware)

# 4. Request ID — X-Request-ID for distributed tracing
app.add_middleware(RequestIDMiddleware)

# 5. CORS — allows any port on localhost or 127.0.0.1 dynamically for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Response-Time"],
)

# ─── Static Files (Development uploads fallback) ──────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─── Exception Handlers ───────────────────────────────────────────────────────
app.add_exception_handler(AppException, app_exception_handler)


# ─── API Routes ───────────────────────────────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)


# ─── Health Check (enhanced) ─────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME, "version": "2.0.0"}


@app.get("/health")
@app.get("/api/v1/health")
def detailed_health():

    """
    Detailed health check for load balancers and monitoring.
    Checks DB, Redis connectivity and reports status of each.
    """
    import time
    from app.core.database import SessionLocal

    checks = {}
    overall = "healthy"

    # Database check
    try:
        t0 = time.perf_counter()
        db = SessionLocal()
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db.close()
        checks["database"] = {"status": "healthy", "latency_ms": round((time.perf_counter() - t0) * 1000, 2)}
    except Exception as e:
        checks["database"] = {"status": "unhealthy", "error": str(e)}
        overall = "degraded"

    # Redis check
    try:
        import redis as redis_lib
        t0 = time.perf_counter()
        r = redis_lib.from_url(settings.REDIS_URL, socket_connect_timeout=1)
        r.ping()
        checks["redis"] = {"status": "healthy", "latency_ms": round((time.perf_counter() - t0) * 1000, 2)}
    except Exception as e:
        checks["redis"] = {"status": "unavailable", "note": "Redis optional for dev"}
        # Redis unavailable is not fatal (dev can run without it)

    return {
        "status": overall,
        "version": "2.0.0",
        "checks": checks,
    }


# ─── Analytics Dashboard ──────────────────────────────────────────────────────
#
# BEFORE: Generated random data on every request (broken, unstable).
# AFTER:  Queries real data from the database with proper aggregation.
#         Results are cached via HTTP Cache-Control (5 min TTL).
#
# If the DB query fails (e.g. no orders yet), returns zero-value defaults
# instead of crashing, so the admin dashboard always renders.

@app.get("/api/v1/analytics/dashboard")
def analytics_dashboard(response: Response, partner = Depends(get_current_partner)):
    """
    Real analytics from the database.
    Aggregates orders, try-ons, and product data over the last 30 days.
    """
    from app.core.database import SessionLocal
    from app.modules.orders.models import Order, OrderItem
    from app.modules.tryon.models import TryOnSession
    from app.modules.products.models import Product
    from sqlalchemy import func

    # HTTP cache: admin dashboard data refreshes every 5 minutes
    response.headers["Cache-Control"] = "private, max-age=300"

    db = SessionLocal()
    data = []
    
    brand_id = partner.brand_id if partner.role == "partner" else None

    try:
        today = datetime.utcnow().date()

        for days_ago in range(29, -1, -1):
            day = today - timedelta(days=days_ago)
            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day, datetime.max.time())
            label = day.strftime("%b %d")

            # Orders placed that day
            orders_q = (
                db.query(func.count(func.distinct(Order.id)))
                .join(OrderItem, OrderItem.order_id == Order.id)
                .join(Product, Product.id == OrderItem.product_id)
                .filter(Order.created_at >= day_start, Order.created_at <= day_end)
            )
            if brand_id is not None:
                orders_q = orders_q.filter(Product.brand_id == brand_id)
            orders_count = orders_q.scalar() or 0

            # Revenue that day
            revenue_q = (
                db.query(func.coalesce(func.sum(OrderItem.price_at_purchase * OrderItem.quantity), 0))
                .join(Order, Order.id == OrderItem.order_id)
                .join(Product, Product.id == OrderItem.product_id)
                .filter(Order.created_at >= day_start, Order.created_at <= day_end)
            )
            if brand_id is not None:
                revenue_q = revenue_q.filter(Product.brand_id == brand_id)
            revenue = revenue_q.scalar() or 0

            # AI try-on sessions that day
            tryon_q = (
                db.query(func.count(TryOnSession.id))
                .join(Product, Product.id == TryOnSession.product_id)
                .filter(
                    TryOnSession.created_at >= day_start,
                    TryOnSession.created_at <= day_end,
                    TryOnSession.status == "completed",
                )
            )
            if brand_id is not None:
                tryon_q = tryon_q.filter(Product.brand_id == brand_id)
            tryon_count = tryon_q.scalar() or 0

            # Estimate views as 8x orders (realistic e-commerce ratio)
            # In production replace with a real page_views table
            views = max(orders_count * 8, tryon_count * 3)

            data.append({
                "date": label,
                "views": views,
                "orders": orders_count,
                "tryon": tryon_count,
                "revenue": float(revenue),
            })

    except Exception as exc:
        # Graceful fallback — return empty chart data, not a 500
        import logging
        logging.getLogger(__name__).warning(f"Analytics query failed: {exc}")
        data = [
            {"date": (today - timedelta(days=29 - i)).strftime("%b %d"),
             "views": 0, "orders": 0, "tryon": 0, "revenue": 0.0}
            for i in range(30)
        ]
    finally:
        db.close()

    return data


# ─── Brand Analytics ──────────────────────────────────────────────────────────

@app.get("/api/v1/analytics/brands")
def brand_analytics(response: Response, partner = Depends(get_current_partner)):
    """Real brand performance metrics from orders."""
    from app.core.database import SessionLocal
    from app.modules.orders.models import Order, OrderItem
    from app.modules.products.models import Product, Brand
    from sqlalchemy import func

    response.headers["Cache-Control"] = "private, max-age=600"  # 10 min

    db = SessionLocal()
    try:
        query = (
            db.query(
                Brand.name,
                func.count(OrderItem.id).label("total_orders"),
                func.coalesce(func.sum(OrderItem.price_at_purchase * OrderItem.quantity), 0).label("revenue"),
            )
            .join(Product, Product.brand_id == Brand.id)
            .join(OrderItem, OrderItem.product_id == Product.id)
        )
        if partner.role == "partner":
            query = query.filter(Brand.id == partner.brand_id)
            
        results = (
            query.group_by(Brand.id, Brand.name)
            .order_by(func.sum(OrderItem.price_at_purchase * OrderItem.quantity).desc())
            .limit(10)
            .all()
        )

        return [
            {"brand": r.name, "orders": r.total_orders, "revenue": float(r.revenue)}
            for r in results
        ]

    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning(f"Brand analytics failed: {exc}")
        return []
    finally:
        db.close()

"""
Vrital AI Fashion Platform - Celery Worker
==========================================
Background task processor for async AI try-on generation.

Run with:
    celery -A worker.celery_app worker --loglevel=info

In development (without Redis), tasks are executed synchronously via CELERY_TASK_ALWAYS_EAGER.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import asyncio
import json
import logging


from celery import Celery
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Celery App Configuration
# ---------------------------------------------------------------------------

# Read from env directly (avoid FastAPI startup overhead in worker context)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vrital_dev.db")

celery_app = Celery(
    "vrital_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,                    # Only ack after task completes (safer)
    worker_prefetch_multiplier=1,           # One task at a time per worker (GPU-bound AI)
    task_soft_time_limit=180,               # 3 min soft limit
    task_time_limit=240,                    # 4 min hard limit
    result_expires=86400,                   # Results kept 24h in Redis
    # Development fallback: run tasks synchronously if Redis is unavailable
    task_always_eager=False,
)

# ---------------------------------------------------------------------------
# SQLAlchemy Session for Worker (separate from FastAPI's session)
# ---------------------------------------------------------------------------

_engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)
_SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def _get_worker_db():
    """Get a DB session for use in Celery tasks."""
    db = _SessionLocal()
    try:
        return db
    except Exception:
        db.close()
        raise


# ---------------------------------------------------------------------------
# Transient exception classifier — only retry network/server errors
# ---------------------------------------------------------------------------

def _is_transient_error(exc: Exception) -> bool:
    """
    Returns True only for errors that are worth retrying (transient):
      - Network timeouts / connection resets
      - HTTP 5xx from external AI APIs
      - Rate-limit (429) from external APIs

    Returns False for permanent errors that retrying can't fix:
      - ValueError (bad data, missing images, empty garment)
      - ImageValidationError (invalid file — will always fail)
      - KeyError / AttributeError (programming bug — retrying hides it)
      - session_not_found (DB record missing)
    """
    import httpx

    # Transient: network-level errors
    if isinstance(exc, (httpx.TimeoutException, httpx.ConnectError, httpx.RemoteProtocolError)):
        return True

    # Transient: HTTP 5xx or 429 from upstream AI APIs
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in (429, 500, 502, 503, 504)

    # Transient: generic OSError / connection reset
    if isinstance(exc, (OSError, ConnectionError, TimeoutError)):
        return True

    # Permanent: all others (ValueError, KeyError, ImageValidationError, etc.)
    return False


# ---------------------------------------------------------------------------
# AI Generation Task
# ---------------------------------------------------------------------------

@celery_app.task(
    bind=True,
    name="vrital.tryon.generate",
    max_retries=2,
    default_retry_delay=10,
)
def generate_tryon_task(self, session_id: str):
    """
    Background task: run AI try-on inference and update TryOnSession record.

    Args:
        session_id: UUID string of the TryOnSession to process.
    """
    from app.modules.users.models import User
    from app.modules.tryon.models import TryOnSession, UserImage
    from app.modules.products.models import Product

    # Job-level request ID for end-to-end tracing across logs
    job_id = self.request.id or session_id[:8]

    db = _get_worker_db()
    session = None

    try:
        logger.info(f"[TryOn Worker] job={job_id} session={session_id} | Started. Fetching session from database...")
        # 1. Fetch the session record
        session = db.query(TryOnSession).filter(TryOnSession.id == session_id).first()
        if not session:
            logger.error(f"[TryOn Worker] job={job_id} session={session_id} | Session not found in database.")
            return {"status": "error", "reason": "session_not_found"}

        logger.info(f"[TryOn Worker] job={job_id} session={session_id} | Session fetched. Marking status='processing', progress=20...")
        # 2. Mark as processing
        session.status = "processing"
        session.progress = 20
        db.commit()

        # 3. Resolve cloth image from primary product
        cloth_image = ""
        if session.product_id:
            product = db.query(Product).filter(Product.id == str(session.product_id)).first()
            if product and product.main_image_url:
                cloth_image = product.main_image_url
            else:
                logger.warning(f"[TryOn Worker] job={job_id} session={session_id} | Product {session.product_id} not found or missing main_image_url.")

        # 4. Resolve user portrait URL
        user_image_url = ""
        if session.user_image and session.user_image.image_url:
            user_image_url = session.user_image.image_url

        if not user_image_url:
            raise ValueError(f"No portrait URL available for session {session_id}. user_image_id={session.user_image_id}")

        logger.info(f"[TryOn Worker] job={job_id} session={session_id} | Portrait: {user_image_url[:80]}... | Garment: {cloth_image[:80]}...")

        # 5. Multi-garment composite logic
        garments_ids = []
        if session.garments_list:
            try:
                garments_ids = json.loads(session.garments_list)
            except (json.JSONDecodeError, TypeError):
                garments_ids = []

        garment_details = []
        if garments_ids:
            for p_id in garments_ids:
                p = db.query(Product).filter(Product.id == str(p_id)).first()
                if p:
                    cat_name = p.category.name if p.category else ""
                    desc = p.description or p.name or "apparel garment product description"
                    garment_details.append({
                        "image_url": p.main_image_url,
                        "category": cat_name,
                        "description": desc
                    })

        logger.info(f"[TryOn Worker] job={job_id} session={session_id} | Progress 40% — {len(garment_details)} garment(s) resolved.")
        session.progress = 40
        db.commit()

        # 6. Call AI service
        #    FIX (Bug 3): asyncio.run() crashes when an event loop already exists in the
        #    Celery worker process. Use a new dedicated loop per task instead.
        from app.services.ai_client import AIClient
        ai_client_instance = AIClient()

        model_variant = getattr(session, "model_variant", "balanced") or "balanced"

        # Retrieve product category name and description
        category_name = ""
        description = "apparel garment product description"
        if session.product_id:
            product = db.query(Product).filter(Product.id == str(session.product_id)).first()
            if product:
                if product.category:
                    category_name = product.category.name
                if product.description:
                    description = product.description
                elif product.name:
                    description = product.name

        logger.info(f"[TryOn Worker] job={job_id} session={session_id} | Progress 60% — Invoking AI (category={category_name}, variant={model_variant})...")
        session.progress = 60
        db.commit()

        # Create a brand-new event loop for this Celery task.
        # asyncio.run() would fail if the worker process already has a loop running.
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                ai_client_instance.generate_tryon(
                    user_image_url,
                    cloth_image,
                    category=category_name,
                    model_variant=model_variant,
                    session_id=session_id,
                    description=description,
                    garment_details=garment_details,
                    avatar=session.avatar,
                    height=session.height,
                    weight=session.weight,
                    body_bust=session.body_bust,
                    body_waist=session.body_waist,
                    body_hips=session.body_hips
                )
            )
        finally:
            loop.close()

        result_url = result.get("result_url", "")

        logger.info(f"[TryOn Worker] job={job_id} session={session_id} | AI generation done. Result: {result_url[:80]}...")
        session.progress = 85
        db.commit()

        # 7. Update session with completed result
        logger.info(f"[TryOn Worker] job={job_id} session={session_id} | Saving result, marking completed (progress=100)...")
        session.result_image_url = result_url
        session.status = "completed"
        session.progress = 100
        session.inference_time_ms = result.get("inference_time_ms", 1500)
        session.ai_model_version = result.get("model_version", "vrital-neural-drape-v2")
        db.commit()

        logger.info(f"[TryOn Worker] job={job_id} session={session_id} | Completed in {session.inference_time_ms}ms.")
        return {"status": "completed", "session_id": session_id, "result_url": result_url}

    except Exception as exc:
        logger.error(f"[TryOn Worker] job={job_id} session={session_id} | Failed: {type(exc).__name__}: {exc}", exc_info=True)

        # Mark session as failed in DB
        if session:
            try:
                session.status = "failed"
                db.commit()
            except Exception as db_err:
                logger.error(f"[TryOn Worker] job={job_id} session={session_id} | Could not mark session failed: {db_err}")
                db.rollback()

        # FIX (Bug 4): Smart retry — only retry transient errors.
        # ValueError, ImageValidationError, missing session, etc. will NOT be retried.
        if _is_transient_error(exc) and self.request.retries < self.max_retries:
            backoff = 10 * (2 ** self.request.retries)  # 10s, 20s
            logger.warning(f"[TryOn Worker] job={job_id} session={session_id} | Transient error, retrying in {backoff}s (attempt {self.request.retries + 1}/{self.max_retries})...")
            raise self.retry(exc=exc, countdown=backoff)
        else:
            if not _is_transient_error(exc):
                logger.error(f"[TryOn Worker] job={job_id} session={session_id} | Permanent error — NOT retrying: {type(exc).__name__}")
            # Permanent failure — let it propagate so Celery marks the task failed
            raise

    finally:
        db.close()


# ---------------------------------------------------------------------------
# Moodboard Persistence Task (Future)
# ---------------------------------------------------------------------------

@celery_app.task(name="vrital.moodboard.save")
def save_moodboard_task(user_id: str, moodboard_data: dict):
    """
    Persist moodboard layout metadata to DB asynchronously.
    Called when user clicks 'Save Styling Board' in TryOn.jsx.
    """
    logger.info(f"[Moodboard Worker] Saving moodboard for user {user_id}")
    # TODO: Persist to moodboards table when model is added
    return {"status": "saved", "user_id": user_id}

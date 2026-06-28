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

    db = _get_worker_db()
    session = None

    try:
        logger.info(f"[TryOn Worker] Job {session_id} started. Fetching session from database...")
        # 1. Fetch the session record
        session = db.query(TryOnSession).filter(TryOnSession.id == session_id).first()
        if not session:
            logger.error(f"[TryOn Worker] Session {session_id} not found.")
            return {"status": "error", "reason": "session_not_found"}

        logger.info(f"[TryOn Worker] Session {session_id} fetched successfully. Marking status='processing', progress=20...")
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
                logger.warning(f"[TryOn Worker] Product {session.product_id} not found or main_image_url is missing.")

        user_image_url = session.user_image.image_url if session.user_image else ""
        
        # If user_image_url is not set but image override is there, use it (fallback for guests)
        if not user_image_url and hasattr(session, "_user_image_url_override") and session._user_image_url_override:
            user_image_url = session._user_image_url_override

        logger.info(f"[TryOn Worker] Resolved image URLs for session {session_id}. Portrait: {user_image_url}, Clothing Garment: {cloth_image}")

        # 4. Multi-garment composite logic
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

        logger.info(f"[TryOn Worker] Session {session_id} progress set to 40%...")
        session.progress = 40
        db.commit()

        # 5. Call AI service (async call bridged into sync Celery task)
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
                
        logger.info(f"[TryOn Worker] Session {session_id} progress set to 60%. Invoking AI generation (category={category_name}, variant={model_variant}, desc={description})...")
        logger.info(f"[TryOn Worker] AI generation started for session {session_id} with portrait: {user_image_url} and garment: {cloth_image}")
        session.progress = 60
        db.commit()

        result = asyncio.run(
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
        result_url = result.get("result_url", "")
        
        logger.info(f"[TryOn Worker] AI generation completed for session {session_id}. Result URL: {result_url}")
        session.progress = 85
        db.commit()

        # 7. Update session with completed result
        logger.info(f"[TryOn Worker] Saving result and marking session {session_id} as completed (progress=100)...")
        session.result_image_url = result_url
        session.status = "completed"
        session.progress = 100
        session.inference_time_ms = result.get("inference_time_ms", 1500)
        session.ai_model_version = result.get("model_version", "vrital-neural-drape-v2")
        db.commit()
        logger.info(f"[TryOn Worker] Result stored in database for session {session_id}.")

        logger.info(f"[TryOn Worker] Session {session_id} completed successfully in {session.inference_time_ms}ms.")
        return {"status": "completed", "session_id": session_id, "result_url": result_url}

    except Exception as exc:
        logger.error(f"[TryOn Worker] Session {session_id} failed: {exc}", exc_info=True)

        # Mark session as failed
        if session:
            try:
                session.status = "failed"
                db.commit()
            except Exception:
                db.rollback()

        # Retry on transient errors
        raise self.retry(exc=exc)

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

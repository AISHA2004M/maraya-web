"""
TryOn Service — Async Job Dispatch Architecture
================================================
Creates a TryOnSession record in DB and dispatches an async Celery task.
The AI inference runs in the background worker, not in the HTTP request.

Status lifecycle:  queued → processing → completed | failed
"""

import json
import logging
from sqlalchemy.orm import Session
from app.modules.tryon.models import TryOnSession, UserImage
from app.modules.tryon.schemas import TryOnRequest

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Celery task import — graceful fallback if Celery/Redis not available
# ---------------------------------------------------------------------------

def _dispatch_tryon_task(session_id: str) -> bool:
    """
    Dispatch the async Celery task.
    Falls back to synchronous execution if Celery/Redis is unavailable (dev mode).
    Returns True if async dispatch succeeded, False if sync fallback was used.
    """
    try:
        from worker import generate_tryon_task
        # Check if Celery broker is reachable
        result = generate_tryon_task.delay(session_id)
        logger.info(f"[TryOn] Dispatched async task {result.id} for session {session_id}")
        return True
    except Exception as e:
        logger.warning(
            f"[TryOn] Celery unavailable ({type(e).__name__}), falling back to sync execution. "
            f"To enable async processing: start Redis + run 'celery -A worker.celery_app worker'"
        )
        return False


async def _run_sync_fallback(db: Session, session: TryOnSession) -> TryOnSession:
    """
    Synchronous AI call fallback when Celery/Redis is not available.
    Used in development without Redis running.
    """
    from app.services.ai_client import ai_client
    from app.modules.products.service import get_product_by_id

    session.status = "processing"
    session.progress = 20
    db.commit()

    # Resolve user image URL from relationship or direct UserImage query
    user_image_url = ""
    if session.user_image and session.user_image.image_url:
        user_image_url = session.user_image.image_url
    elif session.user_image_id:
        user_img_record = db.query(UserImage).filter(UserImage.id == session.user_image_id).first()
        if user_img_record and user_img_record.image_url:
            user_image_url = user_img_record.image_url

    cloth_image = user_image_url
    category_name = ""
    description = "apparel garment product description"
    if session.product_id:
        product = get_product_by_id(db, str(session.product_id))
        if product and product.main_image_url:
            cloth_image = product.main_image_url
            if product.category:
                category_name = product.category.name
            if product.description:
                description = product.description
            elif product.name:
                description = product.name

    # Multi-garment composite
    garments_ids = []
    if session.garments_list:
        try:
            garments_ids = json.loads(session.garments_list)
        except (json.JSONDecodeError, TypeError):
            garments_ids = []

    garment_details = []
    if garments_ids:
        for p_id in garments_ids:
            p = get_product_by_id(db, str(p_id))
            if p:
                cat_name = p.category.name if p.category else ""
                desc = p.description or p.name or "apparel garment product description"
                garment_details.append({
                    "image_url": p.main_image_url,
                    "category": cat_name,
                    "description": desc
                })

    session.progress = 60
    db.commit()

    model_variant = getattr(session, "model_variant", "balanced") or "balanced"

    logger.info(f"[TryOn API] AI generation started (sync fallback) for session {session.id} with portrait: {user_image_url} and garment: {cloth_image}")
    try:
        ai_result = await ai_client.generate_tryon(
            user_image_url, 
            cloth_image, 
            category=category_name,
            model_variant=model_variant,
            session_id=session.id,
            description=description,
            garment_details=garment_details,
            avatar=session.avatar,
            height=session.height,
            weight=session.weight,
            body_bust=session.body_bust,
            body_waist=session.body_waist,
            body_hips=session.body_hips
        )
        result_url = ai_result.get("result_url", "")
        logger.info(f"[TryOn API] AI generation completed (sync fallback) for session {session.id}. Result: {result_url}")

        session.progress = 85
        db.commit()

        session.result_image_url = result_url
        session.status = "completed"
        session.progress = 100
        session.inference_time_ms = ai_result.get("inference_time_ms", 1500)
        session.ai_model_version = ai_result.get("model_version", "vrital-neural-drape-v2")
        db.commit()
        db.refresh(session)
        logger.info(f"[TryOn API] Result stored in database (sync fallback) for session {session.id}.")
    except Exception as exc:
        logger.error(f"[TryOn API] Sync fallback execution failed for session {session.id}: {exc}", exc_info=True)
        session.status = "failed"
        session.progress = 0
        db.commit()
        db.refresh(session)

    return session



# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def create_tryon_session_async(
    db: Session, user_id: str | None, data: TryOnRequest
) -> TryOnSession:
    """
    Creates a TryOnSession and dispatches the AI job to Celery.
    Returns the session immediately with status='queued'.
    If Celery is unavailable, runs synchronously and returns with status='completed'.

    Args:
        user_id: Authenticated user ID, or None for guest sessions.
    """
    from datetime import datetime, timedelta, timezone

    # 1. Save user image reference (use user_id=None for guests to satisfy FK constraints while preserving URL)
    effective_db_user_id = user_id if (user_id and not user_id.startswith("guest-")) else None
    user_image = UserImage(user_id=effective_db_user_id, image_url=data.user_image_url)
    db.add(user_image)
    db.flush()

    # 2. Determine primary product
    primary_prod_id = data.product_id
    if not primary_prod_id and data.product_ids:
        primary_prod_id = data.product_ids[0]

    # 3. Dedup guard: if the same image+garments already has an active job (queued/processing
    #    within the last 5 minutes), return it to avoid spawning duplicate Celery tasks.
    garments_json = json.dumps(data.product_ids) if data.product_ids else None
    if data.user_image_url and garments_json:
        dedup_cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
        existing_active = (
            db.query(TryOnSession)
            .filter(
                TryOnSession.garments_list == garments_json,
                TryOnSession.status.in_(["queued", "processing"]),
                TryOnSession.created_at >= dedup_cutoff,
                TryOnSession.user_image_id == user_image.id,
            )
            .first()
        )
        if existing_active:
            logger.info(f"[TryOn Service] Dedup HIT: returning existing active session {existing_active.id} (status={existing_active.status})")
            # Clean up the just-flushed UserImage since we're reusing the existing session
            db.expunge(user_image)
            db.rollback()
            return existing_active

    # 4. Create session record with queued status
    session = TryOnSession(
        user_id=user_id if (user_id and not user_id.startswith("guest-")) else None,
        product_id=primary_prod_id,
        user_image_id=user_image.id if user_image else None,
        result_image_url=None,
        status="queued",
        garments_list=garments_json,
        avatar=data.avatar,
        height=data.height,
        weight=data.weight,
        body_bust=data.body_bust,
        body_waist=data.body_waist,
        body_hips=data.body_hips,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # 5. Dispatch to Celery (or sync fallback)
    dispatched = _dispatch_tryon_task(session.id)

    if not dispatched:
        # Sync fallback: run inline and return completed session
        session = await _run_sync_fallback(db, session)

    return session



def get_all_sessions(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(TryOnSession)
        .order_by(TryOnSession.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_user_sessions(db: Session, user_id: str):
    return (
        db.query(TryOnSession)
        .filter(TryOnSession.user_id == user_id)
        .order_by(TryOnSession.created_at.desc())
        .all()
    )

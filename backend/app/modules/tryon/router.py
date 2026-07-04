"""
TryOn Router
============
Endpoints:
  POST /tryon/generate         — JSON body (existing, requires auth)
  POST /tryon/ai               — Multipart form (new unified endpoint, guest-friendly)
  GET  /tryon/status/{id}      — Poll session status
  GET  /tryon/my-sessions      — Authenticated user history
  GET  /tryon/all              — Admin: all sessions
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_admin, security
from app.modules.tryon import service
from app.modules.tryon.schemas import (
    TryOnRequest,
    TryOnSessionOut,
    TryOnDispatchOut,
    TryOnStatusOut,
    TryOnResponse,
    TryOnResultResponse,
)
from app.modules.tryon.models import TryOnSession, UserImage
from app.modules.users.models import User
import json
import logging

logger = logging.getLogger(__name__)


router = APIRouter()


# ---------------------------------------------------------------------------
# Unified multipart endpoint — POST /tryon/ai
# ---------------------------------------------------------------------------

@router.post("/ai", response_model=TryOnDispatchOut, status_code=202)
async def ai_try_on(
    user_image: UploadFile = File(..., description="Front-facing portrait photo (JPEG/PNG/WebP, max 10 MB)"),
    product_id: str = Form(..., description="ID of the clothing product to try on"),
    db: Session = Depends(get_db),
    credentials=Depends(security),
):
    """
    Unified AI Virtual Try-On endpoint.

    Accepts multipart/form-data with:
      - user_image: portrait photo upload
      - product_id: product UUID

    Steps:
      1. Validate image (format, size, authenticity)
      2. Save image via upload service
      3. Resolve product → get clothing image URL
      4. Create TryOnSession and dispatch AI job
      5. Return session_id + status immediately (202 Accepted)

    Works for both authenticated users and guests (guest sessions are ephemeral).
    """
    from app.services.ai_client import validate_image_bytes, ImageValidationError
    from app.services.upload_service import save_file_from_bytes
    from app.modules.products.service import get_product_by_id
    from app.core.security import decode_token

    # ── Resolve user (optional auth — guest-friendly) ─────────────────────
    user_id = "guest"
    if credentials:
        try:
            payload = decode_token(credentials.credentials)
            if payload:
                sub = payload.get("sub")
                if sub:
                    user = db.query(User).filter(User.id == sub).first()
                    if user:
                        user_id = user.id
        except Exception:
            pass

    # ── Read & validate image ──────────────────────────────────────────────
    contents = await user_image.read()
    try:
        validate_image_bytes(contents, user_image.filename or "upload.jpg")
    except ImageValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # ── Save uploaded portrait ─────────────────────────────────────────────
    try:
        portrait_url = await save_file_from_bytes(
            contents,
            original_filename=user_image.filename or "portrait.jpg",
            folder="portraits",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save portrait image: {exc}",
        )

    # ── Resolve product ────────────────────────────────────────────────────
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if not product.main_image_url:
        raise HTTPException(
            status_code=422,
            detail="This product does not have a qualifying image for try-on.",
        )

    # ── Create TryOn payload and dispatch ─────────────────────────────────
    payload = TryOnRequest(
        product_id=product_id,
        user_image_url=portrait_url,
        product_ids=[product_id],
    )

    # Guest users get a temporary user_id; sessions are still tracked in DB
    effective_user_id = user_id if user_id != "guest" else f"guest-{db.bind.url}"
    # Create a minimal guest user record if needed
    if user_id == "guest":
        import uuid as _uuid
        effective_user_id = f"guest-{str(_uuid.uuid4())[:8]}"

    session = await service.create_tryon_session_async(
        db,
        effective_user_id,
        payload,
    )

    return TryOnDispatchOut(
        session_id=session.id,
        status=session.status,
        message=(
            "Your virtual fitting is being crafted. "
            f"Poll GET /tryon/status/{session.id} for updates."
            if session.status != "completed"
            else "Try-on completed successfully."
        ),
    )


# ---------------------------------------------------------------------------
# Existing endpoints (preserved)
# ---------------------------------------------------------------------------

@router.post("/generate", response_model=TryOnDispatchOut, status_code=202)
async def generate_tryon(
    payload: TryOnRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a try-on job via JSON body. Returns immediately with session_id.
    Use GET /tryon/status/{session_id} to poll for the result.
    Status flow: queued → processing → completed | failed
    """
    logger.info(f"[TryOn API] Received legacy JSON try-on request for product: {payload.product_id} by user: {current_user.id}")
    session = await service.create_tryon_session_async(db, current_user.id, payload)
    logger.info(f"[TryOn API] Legacy job {session.id} created successfully (status: {session.status}). Returning response.")
    return TryOnDispatchOut(
        session_id=session.id,
        status=session.status,
        message="Your look is being crafted by our AI stylist. Poll /tryon/status/{session_id} for updates.",
    )


@router.get("/status/{session_id}", response_model=TryOnStatusOut)
def get_tryon_status(
    session_id: str,
    db: Session = Depends(get_db),
):
    """
    Poll the status of a try-on session.
    Returns status and result_image_url once completed.
    Made public (no auth) so guest try-ons can be polled.
    """
    session = (
        db.query(TryOnSession)
        .filter(TryOnSession.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Try-on session not found.")

    return TryOnStatusOut(
        session_id=session.id,
        status=session.status,
        result_image_url=session.result_image_url,
        inference_time_ms=session.inference_time_ms,
        ai_model_version=session.ai_model_version,
        created_at=session.created_at,
    )


@router.get("/my-sessions", response_model=List[TryOnSessionOut])
def my_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_user_sessions(db, current_user.id)


@router.get("/all", response_model=List[TryOnSessionOut])
def all_sessions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    return service.get_all_sessions(db, skip=skip, limit=limit)


# ---------------------------------------------------------------------------
# Optimised AI Try-On Router Prefix (/ai)
# ---------------------------------------------------------------------------

ai_router = APIRouter()


@ai_router.post("/try-on", response_model=TryOnResponse, status_code=202)
async def create_ai_try_on(
    user_image: UploadFile = File(..., description="Front-facing portrait photo (JPEG/PNG/WebP, max 10 MB)"),
    product_id: str = Form(..., description="ID of the clothing product to try on"),
    product_ids: Optional[str] = Form(None, description="JSON array of product IDs to try on"),
    model_variant: Optional[str] = Form("balanced", description="Model variant: fast | balanced | quality"),
    avatar: Optional[str] = Form(None, description="Selected avatar profile name"),
    height: Optional[int] = Form(None, description="Height in cm"),
    weight: Optional[int] = Form(None, description="Weight in kg"),
    body_bust: Optional[int] = Form(None, description="Bust size in cm"),
    body_waist: Optional[int] = Form(None, description="Waist size in cm"),
    body_hips: Optional[int] = Form(None, description="Hips size in cm"),
    return_mode: Optional[str] = Form("async", description="Return mode: async | sync"),
    db: Session = Depends(get_db),
    credentials=Depends(security),
):
    logger.info(f"[TryOn API] Received try-on upload request. Product ID: {product_id}, Variant: {model_variant}")
    from app.services.ai_client import validate_image_bytes, ImageValidationError
    from app.services.upload_service import save_file_from_bytes
    from app.services.image_optimizer import calculate_image_hash, compress_and_resize_image
    from app.modules.products.service import get_product_by_id
    from app.core.security import decode_token

    # ── Resolve user (optional auth — guest-friendly) ─────────────────────
    user_id = "guest"
    if credentials:
        try:
            payload = decode_token(credentials.credentials)
            if payload:
                sub = payload.get("sub")
                if sub:
                    user = db.query(User).filter(User.id == sub).first()
                    if user:
                        user_id = user.id
        except Exception:
            pass

    # Read original image bytes
    contents = await user_image.read()
    
    # ── Parse product IDs list ───────────────────────────────────────────
    parsed_ids = [product_id]
    if product_ids:
        try:
            temp_ids = json.loads(product_ids)
            if isinstance(temp_ids, list) and len(temp_ids) > 0:
                parsed_ids = [str(pid) for pid in temp_ids]
        except Exception:
            pass

    # ── Hashing & Caching Check ──────────────────────────────────────────
    image_hash = calculate_image_hash(contents)
    logger.info(f"[TryOn API] Image hash computed: {image_hash}. Checking cache...")
    
    # Check if a completed try-on session already exists for this image + exact garments list
    cached_session = (
        db.query(TryOnSession)
        .filter(
            TryOnSession.image_hash == image_hash,
            TryOnSession.garments_list == json.dumps(parsed_ids),
            TryOnSession.avatar == avatar,
            TryOnSession.height == height,
            TryOnSession.weight == weight,
            TryOnSession.body_bust == body_bust,
            TryOnSession.body_waist == body_waist,
            TryOnSession.body_hips == body_hips,
            TryOnSession.status == "completed",
            # Only reuse real AI results — never cache local pipeline fallback
            TryOnSession.ai_model_version.like("%banana%")
            | TryOnSession.ai_model_version.like("%idm%")
            | TryOnSession.ai_model_version.like("%replicate%")
        )
        .order_by(TryOnSession.created_at.desc())
        .first()
    )
    
    if cached_session:
        logger.info(f"[TryOn API] Cache HIT for image {image_hash} + garments {parsed_ids}. Reusing result session {cached_session.id} immediately.")
        
        # Create a new TryOnSession record for the user's history but mark it completed immediately
        import uuid as _uuid
        effective_user_id = user_id if user_id != "guest" else f"guest-{str(_uuid.uuid4())[:8]}"
        
        # Resolve UserImage mapping
        user_image_obj = None
        if user_id != "guest" and not user_id.startswith("guest-"):
            user_image_obj = db.query(UserImage).filter(UserImage.image_hash == image_hash, UserImage.user_id == user_id).first()
            if not user_image_obj:
                user_image_obj = UserImage(
                    user_id=user_id, 
                    image_url=cached_session.user_image.image_url if cached_session.user_image else cached_session.result_image_url, 
                    image_hash=image_hash
                )
                db.add(user_image_obj)
                db.flush()
        
        new_session = TryOnSession(
            id=str(_uuid.uuid4()),
            user_id=user_id if (user_id and user_id != "guest" and not user_id.startswith("guest-")) else None,
            product_id=product_id,
            user_image_id=user_image_obj.id if user_image_obj else (cached_session.user_image_id if cached_session.user_image_id else None),
            result_image_url=cached_session.result_image_url,
            status="completed",
            progress=100,
            image_hash=image_hash,
            model_variant=model_variant,
            ai_model_version=cached_session.ai_model_version,
            inference_time_ms=0, # Cache hit is instantaneous!
            garments_list=json.dumps(parsed_ids),
            avatar=avatar,
            height=height,
            weight=weight,
            body_bust=body_bust,
            body_waist=body_waist,
            body_hips=body_hips,
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        return TryOnResponse(
            job_id=new_session.id,
            status=new_session.status,
            progress=100
        )

    logger.info(f"[TryOn API] Cache MISS for image {image_hash} + garments {parsed_ids}. Validating image...")
    # ── Image Validation ─────────────────────────────────────────────────
    try:
        validate_image_bytes(contents, user_image.filename or "upload.jpg")
    except ImageValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # ── Compress and resize image ────────────────────────────────────────
    logger.info(f"[TryOn API] Image validation passed. Optimizing & compressing portrait...")
    optimized_contents = compress_and_resize_image(contents, max_dim=1024, quality=80)

    # ── Save optimized portrait ──────────────────────────────────────────
    try:
        logger.info(f"[TryOn API] Saving portrait to storage...")
        portrait_url = await save_file_from_bytes(
            optimized_contents,
            original_filename=user_image.filename or "portrait.jpg",
            folder="portraits",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save portrait image: {exc}",
        )

    # ── Resolve product ──────────────────────────────────────────────────
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if not product.main_image_url:
        raise HTTPException(
            status_code=422,
            detail="This product does not have a qualifying image for try-on.",
        )

    # ── Create and Dispatch Session ──────────────────────────────────────
    logger.info(f"[TryOn API] Portrait saved at {portrait_url}. Preparing TryOnSession database record...")
    effective_user_id = user_id if user_id != "guest" else f"guest-{db.bind.url}"
    if user_id == "guest":
        import uuid as _uuid
        effective_user_id = f"guest-{str(_uuid.uuid4())[:8]}"

    # Save to TryOnSession (use user_id=None for guests to satisfy FK constraints while preserving URL)
    effective_db_user_id = user_id if (user_id != "guest" and not user_id.startswith("guest-")) else None
    user_image_obj = UserImage(user_id=effective_db_user_id, image_url=portrait_url, image_hash=image_hash)
    db.add(user_image_obj)
    db.flush()

    import uuid as _uuid
    session = TryOnSession(
        id=str(_uuid.uuid4()),
        user_id=user_id if (user_id and user_id != "guest" and not user_id.startswith("guest-")) else None,
        product_id=product_id,
        user_image_id=user_image_obj.id if user_image_obj else None,
        result_image_url=None,
        status="queued",
        progress=0,
        image_hash=image_hash,
        model_variant=model_variant,
        garments_list=json.dumps(parsed_ids),
        avatar=avatar,
        height=height,
        weight=weight,
        body_bust=body_bust,
        body_waist=body_waist,
        body_hips=body_hips,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Store temporary portrait URL on session object for sync fallback
    session._user_image_url_override = portrait_url

    # Dispatch Celery task
    logger.info(f"[TryOn API] Dispatching Celery background task for session ID: {session.id}...")
    dispatched = service._dispatch_tryon_task(session.id)
    if not dispatched:
        logger.warning(f"[TryOn API] Celery worker unavailable. Executing sync fallback inline.")
        # Sync fallback: run inline
        session = await service._run_sync_fallback(db, session)

    logger.info(f"[TryOn API] Dispatch result: {'Async Celery' if dispatched else 'Sync Fallback'}. Session status: {session.status}. Returning job ID {session.id}.")
    return TryOnResponse(
        job_id=session.id,
        status=session.status,
        progress=session.progress or (100 if session.status == "completed" else 0)
    )


@ai_router.get("/try-on/status/{job_id}", response_model=TryOnResponse)
def get_ai_try_on_status(job_id: str, db: Session = Depends(get_db)):
    logger.info(f"[TryOn API] Polling status for job ID: {job_id}")
    session = db.query(TryOnSession).filter(TryOnSession.id == job_id).first()
    if not session:
        logger.warning(f"[TryOn API] Job ID not found: {job_id}")
        raise HTTPException(status_code=404, detail="Try-on job not found.")
    
    logger.info(f"[TryOn API] Job ID: {job_id} current status: {session.status}, progress: {session.progress}%")
    return TryOnResponse(
        job_id=session.id,
        status=session.status,
        progress=session.progress or (100 if session.status == "completed" else 0)
    )


@ai_router.get("/try-on/result/{job_id}", response_model=TryOnResultResponse)
def get_ai_try_on_result(job_id: str, db: Session = Depends(get_db)):
    logger.info(f"[TryOn API] Requesting final result for job ID: {job_id}")
    session = db.query(TryOnSession).filter(TryOnSession.id == job_id).first()
    if not session:
        logger.warning(f"[TryOn API] Job ID not found: {job_id}")
        raise HTTPException(status_code=404, detail="Try-on job not found.")
    
    logger.info(f"[TryOn API] Result returned for job ID: {job_id}. Status: {session.status}, URL: {session.result_image_url}")
    return TryOnResultResponse(
        job_id=session.id,
        status=session.status,
        result_image_url=session.result_image_url,
        inference_time_ms=session.inference_time_ms
    )




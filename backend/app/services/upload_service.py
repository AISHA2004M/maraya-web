"""
Upload Service — Smart Storage Router
=======================================
Routes uploads to S3 (production) or local disk (development)
based on the USE_S3 config flag. Zero code changes needed to switch.

Production: Set USE_S3=true, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY in .env
Development: Leave USE_S3=false (default) — files saved to ./uploads/
"""

import io
import logging
import mimetypes
import os
import shutil
import uuid

from fastapi import UploadFile

from app.core.config import settings

logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"


async def save_file(file: UploadFile, folder: str = "") -> str:
    """
    Save an uploaded file to S3 or local disk.

    Args:
        file: The uploaded file from FastAPI.
        folder: Optional sub-folder/prefix within the bucket or uploads dir.

    Returns:
        Public URL string of the saved file.
    """
    # Build unique filename
    ext = os.path.splitext(file.filename or "upload")[1].lower() or ".bin"
    filename = f"{uuid.uuid4()}{ext}"
    key = f"{folder}/{filename}" if folder else filename

    # Read file content once (avoid double-seek issues)
    contents = await file.read()

    if settings.USE_S3:
        return _upload_to_s3(contents, key, ext)
    else:
        return _save_locally(contents, filename)


def _upload_to_s3(contents: bytes, key: str, ext: str) -> str:
    """Upload bytes to S3 and return public URL."""
    from app.services.s3 import s3_service

    content_type, _ = mimetypes.guess_type(f"file{ext}")
    try:
        file_obj = io.BytesIO(contents)
        url = s3_service.upload_file(
            file_obj,
            key=key,
            public=True,
            content_type=content_type or "application/octet-stream",
        )
        logger.info(f"[Upload] S3 upload succeeded: {url}")
        return url
    except Exception as e:
        logger.error(f"[Upload] S3 upload failed ({e}), falling back to local.")
        # Graceful fallback even in production
        filename = key.split("/")[-1]
        return _save_locally(contents, filename)


def _save_locally(contents: bytes, filename: str) -> str:
    """Save bytes to local uploads/ folder and return serving URL."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    local_path = os.path.join(UPLOAD_DIR, filename)
    with open(local_path, "wb") as f:
        f.write(contents)
    url = f"{settings.API_BASE_URL.rstrip('/')}/uploads/{filename}"
    logger.debug(f"[Upload] Saved locally: {url}")
    return url



async def save_file_from_bytes(
    contents: bytes,
    original_filename: str = "upload.bin",
    folder: str = "",
) -> str:
    """
    Save pre-read bytes directly. Useful for worker/pipeline contexts.
    """
    ext = os.path.splitext(original_filename)[1].lower() or ".bin"
    filename = f"{uuid.uuid4()}{ext}"
    key = f"{folder}/{filename}" if folder else filename

    if settings.USE_S3:
        return _upload_to_s3(contents, key, ext)
    return _save_locally(contents, filename)

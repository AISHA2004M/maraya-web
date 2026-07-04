"""
Upload Service — Smart Storage Router
=======================================
Routes uploads to:
  1. Cloudinary (production) — if CLOUDINARY_CLOUD_NAME is configured
  2. S3 (production)         — if USE_S3=true
  3. Local disk (development) — fallback

Zero code changes needed to switch.

Production: Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in Render env vars
Development: Leave unset — files saved to ./uploads/
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
    Save an uploaded file to Cloudinary, S3, or local disk.
    Returns: Public URL string of the saved file.
    """
    ext = os.path.splitext(file.filename or "upload")[1].lower() or ".bin"
    filename = f"{uuid.uuid4()}{ext}"
    key = f"{folder}/{filename}" if folder else filename
    contents = await file.read()

    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
        return _upload_to_cloudinary(contents, key, ext, folder)
    if settings.USE_S3:
        return _upload_to_s3(contents, key, ext)
    return _save_locally(contents, filename)


def _upload_to_cloudinary(contents: bytes, key: str, ext: str, folder: str = "") -> str:
    """Upload bytes to Cloudinary and return the secure public URL."""
    try:
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )

        # Use the folder as a Cloudinary folder prefix
        public_id = f"vrital/{folder}/{uuid.uuid4()}" if folder else f"vrital/{uuid.uuid4()}"

        # Determine resource type
        resource_type = "image" if ext in (".jpg", ".jpeg", ".png", ".webp", ".gif") else "raw"

        result = cloudinary.uploader.upload(
            io.BytesIO(contents),
            public_id=public_id,
            resource_type=resource_type,
            overwrite=True,
        )
        url = result.get("secure_url", "")
        logger.info(f"[Upload] Cloudinary upload succeeded: {url}")
        return url
    except Exception as e:
        logger.error(f"[Upload] Cloudinary upload failed ({e}), falling back to local.")
        filename = key.split("/")[-1]
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
        filename = key.split("/")[-1]
        return _save_locally(contents, filename)


def _save_locally(contents: bytes, filename: str) -> str:
    """
    When no cloud storage is configured, encode the image as a base64 data URL.
    This avoids dependency on Render's ephemeral filesystem and invalid localhost URLs.
    The data URL is stored directly in the database and rendered by the browser without
    any server-side file serving.
    """
    import base64
    ext = os.path.splitext(filename)[1].lower().lstrip(".") or "jpg"
    mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
    mime = mime_map.get(ext, "image/jpeg")
    b64 = base64.b64encode(contents).decode("utf-8")
    data_url = f"data:{mime};base64,{b64}"
    logger.debug(f"[Upload] Encoded as base64 data URL (len={len(data_url)})")
    return data_url



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

    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
        return _upload_to_cloudinary(contents, key, ext, folder)
    if settings.USE_S3:
        return _upload_to_s3(contents, key, ext)
    return _save_locally(contents, filename)

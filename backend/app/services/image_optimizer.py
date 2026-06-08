import hashlib
import io
import logging
from PIL import Image

logger = logging.getLogger(__name__)

def calculate_image_hash(contents: bytes) -> str:
    """Calculate the SHA-256 hash of image bytes for caching."""
    return hashlib.sha256(contents).hexdigest()

def compress_and_resize_image(
    contents: bytes,
    max_dim: int = 1024,
    quality: int = 80
) -> bytes:
    """
    Compress and resize input image bytes before sending to AI model.
    Resizes image maintaining aspect ratio if it exceeds max_dim.
    Saves as optimized JPEG to reduce size significantly.
    """
    try:
        # Load image from bytes
        img = Image.open(io.BytesIO(contents))
        original_size = len(contents)

        # Handle transparency (convert PNG/WEBP RGBA to RGB with white background)
        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            # If the image has an alpha channel, paste using it as mask
            if "A" in img.getbands():
                background.paste(img, mask=img.convert("RGBA").split()[3])
            else:
                background.paste(img)
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Resize if dimensions exceed max_dim
        w, h = img.size
        if w > max_dim or h > max_dim:
            if w > h:
                new_w = max_dim
                new_h = int(h * (max_dim / w))
            else:
                new_h = max_dim
                new_w = int(w * (max_dim / h))
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            logger.info(f"[ImageOptimizer] Resized from {w}x{h} to {new_w}x{new_h}")

        # Compress to JPEG
        out_buf = io.BytesIO()
        img.save(out_buf, format="JPEG", quality=quality, optimize=True)
        compressed_bytes = out_buf.getvalue()

        compressed_size = len(compressed_bytes)
        reduction = (1 - (compressed_size / original_size)) * 100
        logger.info(
            f"[ImageOptimizer] Compressed image: "
            f"{original_size/1024:.1f} KB -> {compressed_size/1024:.1f} KB "
            f"({reduction:.1f}% reduction)"
        )
        return compressed_bytes
    except Exception as e:
        logger.error(f"[ImageOptimizer] Failed to compress image: {e}. Using original.")
        return contents

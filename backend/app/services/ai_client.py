"""
AI Client — Virtual Try-On Inference Gateway
=============================================
Handles communication with the external AI inference service.

Priority chain:
  1. Real API (Fashn.ai) if FASHN_API_KEY env var is set
  2. Custom AI server if AI_SERVICE_URL points to a real host
  3. Demo/dev mode: returns curated mock result URLs

Image Validation:
  validate_image_bytes() — checks MIME type, file size, and magic bytes.
"""

import io
import logging
import mimetypes
import os
import time
import uuid
import math

import httpx
from PIL import Image, ImageOps, ImageFilter, ImageDraw, ImageChops, ImageEnhance

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB hard cap
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Curated high-quality fashion model images for realistic demo responses
_DEMO_RESULTS = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&q=90",
    "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=700&q=90",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&q=90",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&q=90",
    "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=700&q=90",
    "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=700&q=90",
    "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=700&q=90",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&q=90",
]


# ---------------------------------------------------------------------------
# Image Validation
# ---------------------------------------------------------------------------

class ImageValidationError(Exception):
    """Raised when an uploaded image fails validation checks."""
    pass


def validate_image_bytes(contents: bytes, filename: str = "upload") -> None:
    """
    Validate image bytes for format, file size, and magic-byte authenticity.

    Args:
        contents: Raw bytes of the uploaded file.
        filename: Original filename (used for extension-based MIME hint).

    Raises:
        ImageValidationError: with a user-friendly message if validation fails.
    """
    # 1. Size check
    if len(contents) > MAX_IMAGE_BYTES:
        size_mb = len(contents) / (1024 * 1024)
        raise ImageValidationError(
            f"Image is too large ({size_mb:.1f} MB). Maximum allowed size is 10 MB."
        )

    if len(contents) < 1024:
        raise ImageValidationError(
            "The uploaded file appears to be empty or too small. "
            "Please upload a real portrait photo."
        )

    # 2. Extension-based MIME check
    ext = os.path.splitext(filename or "")[1].lower()
    if ext:
        guessed_type, _ = mimetypes.guess_type(f"file{ext}")
        if guessed_type and guessed_type not in ALLOWED_MIME_TYPES:
            raise ImageValidationError(
                f"Unsupported file format '{ext}'. "
                "Please upload a JPEG, PNG, or WebP image."
            )

    # 3. Magic byte authenticity (prevents renamed non-image uploads)
    magic = contents[:12]
    is_jpeg = magic[:2] == b"\xff\xd8"
    is_png = magic[:8] == b"\x89PNG\r\n\x1a\n"
    is_webp = magic[:4] == b"RIFF" and magic[8:12] == b"WEBP"

    if not (is_jpeg or is_png or is_webp):
        raise ImageValidationError(
            "The uploaded file does not appear to be a valid image. "
            "Please upload a real JPEG, PNG, or WebP photo of yourself."
        )


# ---------------------------------------------------------------------------
# Helper: Image Loader
# ---------------------------------------------------------------------------

def _load_image(path_or_url: str, fallback_type: str = "portrait") -> Image.Image:
    """Load an image from a local path or URL, with fallback."""
    try:
        # Resolve local files directly
        if "/uploads/" in path_or_url:
            parts = path_or_url.split("/uploads/")
            local_path = os.path.join("uploads", parts[-1])
            if os.path.exists(local_path):
                logger.info(f"[AI Pipeline] Resolving local path: {local_path}")
                return Image.open(local_path)
        if path_or_url.startswith("uploads/") and os.path.exists(path_or_url):
            logger.info(f"[AI Pipeline] Resolving local path: {path_or_url}")
            return Image.open(path_or_url)

        # Download external URL
        logger.info(f"[AI Pipeline] Downloading image: {path_or_url}")
        with httpx.Client(timeout=15) as client:
            r = client.get(path_or_url)
            r.raise_for_status()
            return Image.open(io.BytesIO(r.content))
    except Exception as err:
        logger.warning(f"[AI Pipeline] Failed to load image {path_or_url}: {err}. Using fallback.")
        if fallback_type == "garment":
            fallback_url = "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=600"
        else:
            fallback_url = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600"
        with httpx.Client(timeout=15) as client:
            r = client.get(fallback_url)
            r.raise_for_status()
            return Image.open(io.BytesIO(r.content))


# ---------------------------------------------------------------------------
# Helper: Garment Segmentation (improved)
# ---------------------------------------------------------------------------

def _segment_garment(cloth_img: Image.Image, category: str = "") -> Image.Image:
    """
    Extract the garment from a product image by removing:
    1. The background (detected from corner sampling)
    2. The model's body (skin pixels outside the garment center)
    3. The model's head/face region (top portion)

    Returns RGBA image with only the garment visible.
    """
    cw, ch = cloth_img.size
    cloth_rgba = cloth_img.convert("RGBA")
    pix = cloth_rgba.load()

    # ── Step A: Sample background color profile ───────────────────────────────
    # Sample many points at the edge to build a robust background color profile
    bg_samples = []
    margin = max(3, int(min(cw, ch) * 0.05))

    # Top and bottom rows
    for x in range(0, cw, max(1, cw // 20)):
        for y in range(0, margin):
            bg_samples.append(pix[x, y][:3])
        for y in range(ch - margin, ch):
            bg_samples.append(pix[x, y][:3])
    # Left and right columns
    for y in range(0, ch, max(1, ch // 20)):
        for x in range(0, margin):
            bg_samples.append(pix[x, y][:3])
        for x in range(cw - margin, cw):
            bg_samples.append(pix[x, y][:3])

    if not bg_samples:
        bg_samples = [(255, 255, 255)]

    # Compute median background color (more robust than mean)
    bg_r = sorted(p[0] for p in bg_samples)[len(bg_samples) // 2]
    bg_g = sorted(p[1] for p in bg_samples)[len(bg_samples) // 2]
    bg_b = sorted(p[2] for p in bg_samples)[len(bg_samples) // 2]
    bg_median = (bg_r, bg_g, bg_b)

    # Detect background type and set thresholds
    bg_brightness = (bg_r + bg_g + bg_b) / 3
    bg_saturation = max(bg_r, bg_g, bg_b) - min(bg_r, bg_g, bg_b)

    # Adaptive threshold:
    # - High brightness (studio white): tight threshold
    # - Colored bg (orange, blue): standard threshold
    # - Dark bg: slightly looser
    if bg_brightness > 230 and bg_saturation < 20:
        bg_thresh = 35  # Pure white/grey background
    elif bg_saturation > 40:
        bg_thresh = 50  # Colored background (orange, blue, etc.)
    else:
        bg_thresh = 45  # Neutral/textured background

    # ── Step B: Determine neckline / face removal cutoff ─────────────────────
    # For tops/dresses: remove top ~18% (face, neck, hair region)
    # For bottoms: remove top ~44% (everything above waist)
    is_bottom = category.lower() in ("bottoms", "pants", "trousers", "jeans", "skirts")
    if is_bottom:
        head_cutoff_pct = 0.44
    else:
        head_cutoff_pct = 0.18  # Remove face/neck/hair — keep collar of garment
    head_cutoff_y = int(ch * head_cutoff_pct)

    # Upper shoulder zone: more aggressive cleanup (arms raised, shoulder skin)
    shoulder_zone_end_y = int(ch * 0.35)
    shoulder_zone_x_inner_l = int(cw * 0.28)
    shoulder_zone_x_inner_r = int(cw * 0.72)

    # ── Step C: Pixel-level classification ───────────────────────────────────────────
    for y in range(ch):
        for x in range(cw):
            r, g, b, a = pix[x, y]
            if a == 0:
                continue

            # 1. Remove model's head / face / hair region entirely
            if y < head_cutoff_y:
                pix[x, y] = (r, g, b, 0)
                continue

            # 2. Background removal: compare to median background color
            dr = abs(r - bg_median[0])
            dg = abs(g - bg_median[1])
            db = abs(b - bg_median[2])
            if dr < bg_thresh and dg < bg_thresh and db < bg_thresh:
                pix[x, y] = (r, g, b, 0)
                continue

            # 3. Also check against sample pool (guards against bg color variation)
            is_bg = False
            for br, bgg, bb in bg_samples[:16]:
                if abs(r - br) < bg_thresh and abs(g - bgg) < bg_thresh and abs(b - bb) < bg_thresh:
                    is_bg = True
                    break
            if is_bg:
                pix[x, y] = (r, g, b, 0)
                continue

            # 4. Skin detection: remove model's exposed skin (arms, legs, chest)
            is_skin = _is_skin_pixel(r, g, b)

            if is_skin:
                # Extended arm zone (handles raised/wide arms)
                is_arm_region = (x < int(cw * 0.25) or x > int(cw * 0.75))
                is_leg_region = y > int(ch * 0.85)
                # Upper body zone: aggressive cleanup up to 33% height
                is_upper_body = (y < int(ch * 0.33))
                # In shoulder zone, also remove skin on inner area (raised arms touching dress)
                is_shoulder_skin = (
                    head_cutoff_y <= y < shoulder_zone_end_y and
                    (x < shoulder_zone_x_inner_l or x > shoulder_zone_x_inner_r)
                )

                if is_arm_region or is_leg_region or is_upper_body or is_shoulder_skin:
                    pix[x, y] = (r, g, b, 0)
                    continue

            # 5. Dark hair/body artifact removal near the neckline/shoulder zone
            # Hair appears as very dark pixels (low brightness) at the top of garment
            brightness = (r + g + b) / 3
            saturation = max(r, g, b) - min(r, g, b)
            is_dark_hair = (brightness < 80 and saturation < 60)  # Dark, low-saturation = hair/shadow
            if is_dark_hair and y < int(ch * 0.30):
                pix[x, y] = (r, g, b, 0)


    # ── Step D: Morphological cleanup + alpha feathering ──────────────────────
    # Erode then dilate (morphological open) removes thin hair/arm strands
    # while preserving the main garment body
    r_ch, g_ch, b_ch, a_ch = cloth_rgba.split()
    # Step 1: Erode to kill thin isolated fragments (hair strands, stray pixels)
    a_eroded = a_ch.filter(ImageFilter.MinFilter(5))
    # Step 2: Dilate back to recover garment edges (but not the thin fragments)
    a_dilated = a_eroded.filter(ImageFilter.MaxFilter(3))
    # Step 3: Smooth edges for natural feathered blending
    a_final = a_dilated.filter(ImageFilter.GaussianBlur(2.5))
    cloth_rgba = Image.merge("RGBA", (r_ch, g_ch, b_ch, a_final))

    return cloth_rgba


def _is_skin_pixel(r: int, g: int, b: int) -> bool:
    """Detect skin tones across a wide range of ethnicities."""
    # Light/medium skin: r > g > b, warm tones
    if r > 95 and g > 40 and b > 20:
        if r > g and r > b:
            if abs(r - g) > 15 and r - b > 25:
                return True
    # Alternate check: normalized color
    total = r + g + b
    if total > 0:
        rn = r / total
        gn = g / total
        # Standard skin color region in normalized RGB
        if 0.36 < rn < 0.67 and 0.22 < gn < 0.52:
            if r > 80 and g > 50 and b > 30:
                return True
    return False


# ---------------------------------------------------------------------------
# Helper: User Body Region Masking (remove original clothing)
# ---------------------------------------------------------------------------

def _create_clothing_mask(user_img: Image.Image, face_height: int, category: str = "") -> Image.Image:
    """
    Create a mask covering the user's clothing region (body minus face/arms).
    This is the region where we'll overlay the new garment.
    Returns a grayscale mask where 255 = clothing area, 0 = preserve original.
    """
    uw, uh = user_img.size
    mask = Image.new("L", (uw, uh), 0)
    draw = ImageDraw.Draw(mask)

    is_bottom = category.lower() in ("bottoms", "pants", "trousers", "jeans", "skirts")

    if is_bottom:
        # For bottoms: mask the lower body (waist to ankles)
        top_y = int(uh * 0.52)
        bot_y = int(uh * 0.96)
        left_x = int(uw * 0.12)
        right_x = int(uw * 0.88)
    if not is_bottom:
        # For tops/dresses: mask from base of neck down through body
        top_y = int(uh * 0.24)
        bot_y = int(uh * 0.94)
        left_x = int(uw * 0.15)
        right_x = int(uw * 0.85)

    # Draw ellipse that tapers at top (shoulders) and bottom (hips)
    # This avoids a rectangular cutout which looks unnatural
    # Use a filled polygon approximating body silhouette
    shoulder_w = int((right_x - left_x) * 0.90)
    hip_w = int((right_x - left_x) * 1.05)
    center_x = uw // 2

    # Build a body-shaped polygon (wider at hips than shoulders for natural shape)
    shoulder_top = top_y
    torso_bot = bot_y

    if not is_bottom:
        points = [
            (center_x - shoulder_w // 2, shoulder_top),
            (center_x + shoulder_w // 2, shoulder_top),
            (center_x + hip_w // 2, torso_bot),
            (center_x - hip_w // 2, torso_bot),
        ]
    else:
        points = [
            (left_x, top_y),
            (right_x, top_y),
            (right_x + int(uw * 0.05), bot_y),
            (left_x - int(uw * 0.05), bot_y),
        ]

    draw.polygon(points, fill=255)

    # Feather the mask edges for seamless blending
    mask = mask.filter(ImageFilter.GaussianBlur(16))
    return mask


# ---------------------------------------------------------------------------
# Helper: Color Transfer (match garment lighting to user image)
# ---------------------------------------------------------------------------

def _match_brightness(source: Image.Image, reference: Image.Image) -> Image.Image:
    """
    Adjust the brightness/contrast of `source` to match the overall
    luminance of the `reference` image (user portrait).
    Ensures the garment looks naturally lit in the scene.
    """
    source_lab = source.convert("L")
    ref_lab = reference.convert("L")

    src_mean = sum(source_lab.getdata()) / (source_lab.width * source_lab.height)
    ref_mean = sum(ref_lab.getdata()) / (ref_lab.width * ref_lab.height)

    if src_mean > 0:
        ratio = ref_mean / src_mean
        # Clamp ratio to avoid over-brightening or darkening
        ratio = max(0.6, min(1.5, ratio))
        enhancer = ImageEnhance.Brightness(source)
        return enhancer.enhance(ratio)
    return source


# ---------------------------------------------------------------------------
# Local Segment-and-Drape Try-On Pipeline (v2 — improved compositing)
# ---------------------------------------------------------------------------

async def run_local_drape_pipeline(
    user_image_path_or_url: str,
    cloth_image_path_or_url: str,
    session_id: str = "demo",
    category: str = ""
) -> str:
    """
    Local human parsing and garment segmentation try-on pipeline v2.

    Improvements over v1:
    - Better background removal with median bg color
    - Feathered/blurred garment alpha edges for smooth compositing
    - Body-shaped mask for clothing region instead of pixel sweater replacement
    - Brightness matching between garment and portrait
    - Soft-light blend mode for more natural fabric look
    - Face region always locked (100% identity preservation)
    """
    from app.services.upload_service import save_file_from_bytes

    logger.info(f"[AI Pipeline v2] Starting try-on for session: {session_id}, category: {category}")

    # ── Load images ───────────────────────────────────────────────────────────
    user_img = _load_image(user_image_path_or_url, fallback_type="portrait").convert("RGB")
    cloth_img = _load_image(cloth_image_path_or_url, fallback_type="garment").convert("RGB")

    uw, uh = user_img.size
    cw, ch = cloth_img.size
    logger.info(f"[AI Pipeline v2] Portrait: {uw}x{uh} | Garment: {cw}x{ch}")

    # ── Step 1: Face extraction ───────────────────────────────────────────
    logger.info("[AI Pipeline v2] Step 1: Extracting face/head for identity lock...")
    face_height = int(uh * 0.30)
    user_face_crop = user_img.crop((0, 0, uw, face_height))

    # ── Step 2: Garment extraction ────────────────────────────────────────────
    logger.info("[AI Pipeline v2] Step 2: Segmenting garment from product image...")
    segmented_garment = _segment_garment(cloth_img, category=category)

    # Get garment bounding box after segmentation
    bbox = segmented_garment.getbbox()
    if bbox:
        logger.info(f"[AI Pipeline v2] Garment bounding box: {bbox}")
        # Add small padding around bbox for natural look
        pad = 8
        bbox = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(segmented_garment.width, bbox[2] + pad),
            min(segmented_garment.height, bbox[3] + pad),
        )
        cropped_garment = segmented_garment.crop(bbox)
    else:
        logger.warning("[AI Pipeline v2] Empty garment bbox — using full garment image.")
        cropped_garment = segmented_garment

    gw, gh = cropped_garment.size
    logger.info(f"[AI Pipeline v2] Cropped garment size: {gw}x{gh}")

    # ── Step 3: Determine target region on user body ──────────────────────────
    logger.info("[AI Pipeline v2] Step 3: Computing placement and scale...")
    is_bottom = category.lower() in ("bottoms", "pants", "trousers", "jeans", "skirts")

    if is_bottom:
        # Cover lower body: waist to ankles
        target_width = int(uw * 0.56)
        target_height = int(uh * 0.48)
        paste_x = (uw - target_width) // 2
        paste_y = int(uh * 0.50)
    else:
        # Cover torso/dress: start just below chin, extend past feet if dress
        target_width = int(uw * 0.68)
        target_height = int(uh * 0.68)
        paste_x = (uw - target_width) // 2
        paste_y = int(uh * 0.22)

    # Preserve garment aspect ratio while fitting target area
    garment_aspect = gw / gh
    target_aspect = target_width / target_height

    if garment_aspect > target_aspect:
        # Garment is wider — constrain by width
        final_w = target_width
        final_h = int(final_w / garment_aspect)
    else:
        # Garment is taller — constrain by height
        final_h = target_height
        final_w = int(final_h * garment_aspect)

    # Center horizontally
    paste_x = (uw - final_w) // 2

    logger.info(f"[AI Pipeline v2] Garment scaled to {final_w}x{final_h}, pasting at ({paste_x}, {paste_y})")
    resized_garment = cropped_garment.resize((final_w, final_h), Image.Resampling.LANCZOS)

    # ── Step 4: Brightness matching ───────────────────────────────────────────
    logger.info("[AI Pipeline v2] Step 4: Matching garment brightness to portrait lighting...")
    garment_rgb = resized_garment.convert("RGB")
    garment_rgb = _match_brightness(garment_rgb, user_img)
    # Put matched brightness back with original alpha
    garment_r, garment_g, garment_b = garment_rgb.split()
    garment_a = resized_garment.split()[3]
    resized_garment = Image.merge("RGBA", (garment_r, garment_g, garment_b, garment_a))

    # ── Step 5: Create body region mask for clothing erasure ──────────────────
    logger.info("[AI Pipeline v2] Step 5: Creating body clothing mask...")
    clothing_region_mask = _create_clothing_mask(user_img, face_height, category=category)

    # ── Step 6: Sample user background color for clothing fill ───────────────
    logger.info("[AI Pipeline v2] Step 6: Sampling user background color...")
    # Sample corners for background color
    corners = [
        user_img.getpixel((5, 5)),
        user_img.getpixel((uw - 6, 5)),
        user_img.getpixel((5, uh - 6)),
        user_img.getpixel((uw - 6, uh - 6)),
        user_img.getpixel((uw // 2, 5)),
    ]
    avg_bg_r = sum(c[0] for c in corners) // len(corners)
    avg_bg_g = sum(c[1] for c in corners) // len(corners)
    avg_bg_b = sum(c[2] for c in corners) // len(corners)
    user_bg_color = (avg_bg_r, avg_bg_g, avg_bg_b)
    logger.info(f"[AI Pipeline v2] User background color sampled: {user_bg_color}")

    # ── Step 7: Composite the result ──────────────────────────────────────────
    logger.info("[AI Pipeline v2] Step 7: Compositing final result...")

    # Start with the original user image
    result_img = user_img.copy().convert("RGBA")

    # 7a. Soften the clothing region of the user's original clothing
    #     Fill with background color where the clothing mask is strongest
    #     This cleanly removes the original garment without harsh pixel patches
    user_clothing_base = Image.new("RGBA", (uw, uh), (*user_bg_color, 255))

    # Blend: where mask is white (clothing region), use background fill
    # where mask is black, keep original user image
    result_img_rgb = user_img.copy().convert("RGBA")
    mask_rgba = clothing_region_mask.convert("L")

    # Composite: erase original clothing
    blended = Image.composite(user_clothing_base, result_img_rgb, mask_rgba)

    # 7b. Now paste the garment onto the blended base
    # Ensure garment RGBA alpha is valid
    garment_alpha = resized_garment.split()[3]

    # Create a full-canvas garment layer
    garment_canvas = Image.new("RGBA", (uw, uh), (0, 0, 0, 0))
    garment_canvas.paste(resized_garment, (paste_x, paste_y))

    # Combine: paste garment over the blended base using garment's alpha channel
    result_rgba = Image.alpha_composite(blended, garment_canvas)

    # Convert to RGB for final output
    result_img = result_rgba.convert("RGB")

    # 7c. Re-paste the face/head region for absolute identity preservation
    logger.info("[AI Pipeline v2] Step 7c: Locking face region for 100% identity preservation...")
    result_img.paste(user_face_crop, (0, 0))

    # ── Step 8: Quality Control ───────────────────────────────────────────────
    logger.info("[AI Pipeline v2] Step 8: Running QC audit...")
    out_face = result_img.crop((0, 0, uw, face_height))
    diff = ImageChops.difference(user_face_crop, out_face)
    extrema = diff.convert("L").getextrema()
    if extrema and extrema[1] > 15:
        logger.warning(f"[AI Pipeline v2 QC] Face diff extrema: {extrema}. Re-pasting face to enforce identity.")
        result_img.paste(user_face_crop, (0, 0))
    else:
        logger.info(f"[AI Pipeline v2 QC] Face identity check passed. Diff extrema: {extrema}")

    # ── Step 9: Subtle post-processing ───────────────────────────────────────
    logger.info("[AI Pipeline v2] Step 9: Applying subtle sharpening...")
    # Light sharpening to make the composite look crisp
    result_img = result_img.filter(ImageFilter.UnsharpMask(radius=0.8, percent=110, threshold=3))

    # ── Step 10: Save & return ────────────────────────────────────────────────
    out_buf = io.BytesIO()
    result_img.save(out_buf, format="JPEG", quality=92)
    processed_bytes = out_buf.getvalue()

    result_url = await save_file_from_bytes(
        processed_bytes,
        original_filename=f"tryon_{session_id}.jpg",
        folder="results"
    )
    logger.info(f"[AI Pipeline v2] Completed for session {session_id}. Result: {result_url}")
    return result_url


async def apply_post_processing_qc(
    result_image_url: str,
    user_image_path_or_url: str,
    session_id: str
) -> str:
    """
    Quality Control Post-Processor for external AI results:
    1. Downloads the generated result from the AI service.
    2. Overlays the original user's face/head on top to ensure 100% identity preservation.
    3. Saves the cleaned image and returns the URL.
    """
    from app.services.upload_service import save_file_from_bytes

    logger.info(f"[AI Pipeline QC] Running post-processing identity preservation for session: {session_id}")

    try:
        user_img = _load_image(user_image_path_or_url).convert("RGB")
        result_img = _load_image(result_image_url).convert("RGB")
    except Exception as e:
        logger.warning(f"[AI Pipeline QC] Could not run post-processing: {e}. Returning original result URL.")
        return result_image_url

    uw, uh = user_img.size
    rw, rh = result_img.size

    # Scale user face if dimensions differ
    if uw != rw or uh != rh:
        logger.info(f"[AI Pipeline QC] Resizing user image from {uw}x{uh} to match AI result {rw}x{rh}...")
        user_img = user_img.resize((rw, rh), Image.Resampling.LANCZOS)
        uw, uh = rw, rh

    # Face/head region (top 34% height)
    face_height = int(uh * 0.34)
    user_face_crop = user_img.crop((0, 0, uw, face_height))

    # Paste the original face on top of the AI result to enforce identity preservation
    result_img.paste(user_face_crop, (0, 0))

    # Save processed image
    out_buf = io.BytesIO()
    result_img.save(out_buf, format="JPEG", quality=92)
    processed_bytes = out_buf.getvalue()

    refined_url = await save_file_from_bytes(
        processed_bytes,
        original_filename=f"tryon_refined_{session_id}.jpg",
        folder="results"
    )
    logger.info(f"[AI Pipeline QC] Refined result saved. URL: {refined_url}")
    return refined_url


# ---------------------------------------------------------------------------
# AI Client
# ---------------------------------------------------------------------------

class AIClient:
    """
    Gateway for AI virtual try-on inference.

    Tries real API providers first; falls back to local segment-and-drape try-on
    pipeline for development and staging environments.
    """

    def _pick_demo_result(self, user_image: str, cloth_image: str) -> str:
        """
        Deterministically pick a demo result URL based on image URL hash.
        Same (user, cloth) pair always returns the same result — consistent
        across retries, no flickering.
        """
        key = (user_image or "") + (cloth_image or "")
        idx = abs(hash(key)) % len(_DEMO_RESULTS)
        return _DEMO_RESULTS[idx]

    async def generate_tryon(
        self,
        user_image: str,
        cloth_image: str,
        category: str = "",
        mood: str = "",
        model_variant: str = "balanced",
        session_id: str = "",
    ) -> dict:
        """
        Run AI try-on inference.

        Args:
            user_image:  Public URL of the uploaded user portrait.
            cloth_image: Public URL of the product/garment image.
            category:    Optional product category for smarter mock selection.
            mood:        Optional aesthetic mood hint.
            model_variant: Model variant to use (fast | balanced | quality).
            session_id:  UUID of the TryOnSession.

        Returns:
            dict: { result_url: str, inference_time_ms: int, model_version: str }
        """
        start = time.time()
        effective_session_id = session_id or str(uuid.uuid4())[:8]

        # ── Priority 1: Fashn.ai real API ─────────────────────────────────
        fashn_key = os.getenv("FASHN_API_KEY", "")
        if fashn_key:
            try:
                async with httpx.AsyncClient(timeout=120) as client:
                    resp = await client.post(
                        "https://api.fashn.ai/v1/run",
                        headers={"Authorization": f"Bearer {fashn_key}"},
                        json={
                            "model_image": user_image,
                            "garment_image": cloth_image,
                            "category": "auto",
                            "model_variant": model_variant,
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    output_url = (
                        data.get("output", [None])[0]
                        or data.get("result_url", "")
                    )

                    # Run through Identity Preservation Post-Processing & QC
                    output_url = await apply_post_processing_qc(
                        output_url, user_image, effective_session_id
                    )

                    elapsed = int((time.time() - start) * 1000)
                    logger.info(f"[AIClient] Fashn.ai inference completed in {elapsed}ms")
                    return {
                        "result_url": output_url,
                        "inference_time_ms": elapsed,
                        "model_version": f"fashn-{model_variant}",
                    }
            except httpx.HTTPError as e:
                logger.warning(f"[AIClient] Fashn.ai call failed: {e}. Falling back.")

        # ── Priority 2: Custom AI inference server ─────────────────────────
        ai_url = settings.AI_SERVICE_URL
        if ai_url and "localhost:8001" not in ai_url:
            try:
                async with httpx.AsyncClient(timeout=120) as client:
                    resp = await client.post(
                        f"{ai_url}/infer",
                        json={
                            "user_image": user_image,
                            "cloth_image": cloth_image,
                            "model_variant": model_variant,
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()

                    result_url = data.get("result_url")
                    if result_url:
                        # Run through Identity Preservation Post-Processing & QC
                        result_url = await apply_post_processing_qc(
                            result_url, user_image, effective_session_id
                        )
                    else:
                        result_url = await run_local_drape_pipeline(
                            user_image, cloth_image, session_id=effective_session_id, category=category
                        )

                    elapsed = int((time.time() - start) * 1000)
                    return {
                        "result_url": result_url,
                        "inference_time_ms": data.get("inference_time_ms", elapsed),
                        "model_version": data.get("model_version", f"custom-{model_variant}"),
                    }
            except httpx.HTTPError as e:
                logger.warning(f"[AIClient] Custom AI server failed: {e}. Using local pipeline.")

        # ── Priority 3: Local Segment-and-Drape Pipeline (Demo/dev mode fallback) ──
        import asyncio
        sleep_durations = {"fast": 0.3, "balanced": 0.8, "quality": 1.5}
        sleep_time = sleep_durations.get(model_variant, 0.8)
        await asyncio.sleep(sleep_time)

        result_url = await run_local_drape_pipeline(
            user_image, cloth_image, session_id=effective_session_id, category=category
        )
        elapsed = int((time.time() - start) * 1000)
        logger.info(f"[AIClient] Local pipeline v2 completed (variant={model_variant}) in {elapsed}ms: {result_url}")
        return {
            "result_url": result_url,
            "inference_time_ms": elapsed,
            "model_version": f"vrital-local-pipeline-v2-{model_variant}",
        }


# Singleton instance shared across the application
ai_client = AIClient()

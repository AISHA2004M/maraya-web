"""
AI Client — Virtual Try-On Inference Gateway
=============================================
Handles communication with the external AI inference service.

Priority chain:
  1. Nano Banana 2 (Gemini 3.1 Flash Image API) if GEMINI_API_KEY or NANO_BANANA_API_KEY is configured
  2. IDM-VTON (via Replicate API or local bridge server at AI_SERVICE_URL)
  3. Local Segment-and-Drape Pipeline v3 (fallback)

Image Validation:
  validate_image_bytes() — checks MIME type, file size, and magic bytes.
"""

import base64
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
    """Load an image from a local path, URL, or base64 data URI, with fallback."""
    try:
        # Resolve base64 data URI
        if path_or_url.startswith("data:image/"):
            header, encoded = path_or_url.split(",", 1)
            return Image.open(io.BytesIO(base64.b64decode(encoded)))

        # Resolve local files directly
        if os.path.exists(path_or_url):
            logger.info(f"[AI Pipeline] Resolving local path: {path_or_url}")
            return Image.open(path_or_url)

        # Build absolute paths relative to this file (backend/app/services/ai_client.py)
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

        if "/uploads/" in path_or_url:
            parts = path_or_url.split("/uploads/")
            local_path = os.path.join(base_dir, "uploads", parts[-1])
            if os.path.exists(local_path):
                logger.info(f"[AI Pipeline] Resolving local path: {local_path}")
                return Image.open(local_path)
                
        if "/outputs/" in path_or_url:
            parts = path_or_url.split("/outputs/")
            local_path = os.path.join(base_dir, "outputs", parts[-1])
            if os.path.exists(local_path):
                logger.info(f"[AI Pipeline] Resolving local path: {local_path}")
                return Image.open(local_path)

        if path_or_url.startswith("uploads/"):
            local_path = os.path.join(base_dir, path_or_url)
            if os.path.exists(local_path):
                logger.info(f"[AI Pipeline] Resolving local path: {local_path}")
                return Image.open(local_path)

        # Download external URL
        logger.info(f"[AI Pipeline] Downloading image: {path_or_url}")
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        with httpx.Client(timeout=15, headers=headers) as client:
            r = client.get(path_or_url)
            r.raise_for_status()
            return Image.open(io.BytesIO(r.content))
    except Exception as err:
        logger.error(f"[AI Pipeline] Failed to load image {path_or_url}: {err}")
        raise ValueError(f"Failed to load image ({fallback_type}) from path or URL {path_or_url}: {err}")


# ---------------------------------------------------------------------------
# Helper: Garment Classification
# ---------------------------------------------------------------------------

def _classify_garment_type(category: str, description: str, cloth_img: Image.Image) -> str:
    """
    Classifies the garment type into one of three classes:
    - 'top' (upper body garments: shirts, t-shirts, blouses, sweaters, hoodies, jackets, coats, etc.)
    - 'bottom' (lower body garments: pants, jeans, trousers, shorts, skirts, etc.)
    - 'dress' (full body garments: dresses, gowns, jumpsuits, rompers, two-piece sets, complete outfits, etc.)
    """
    cat = (category or "").lower()
    desc = (description or "").lower()
    
    # 0. Check for full body/complete outfits keywords first
    full_body_kws = ("dress", "gown", "jumpsuit", "romper", "two-piece", "set", "outfit", "suit", "co-ord", "tracksuit", "combo", "uniform", "robe")
    if any(k in cat for k in full_body_kws):
        return "dress"
    if any(k in desc for k in full_body_kws):
        return "dress"

    # 1. Check category first for bottom and top keywords
    bottom_kws = ("bottom", "pant", "trouser", "jeans", "jean", "skirt", "short", "legging")
    top_kws = ("top", "shirt", "t-shirt", "tee", "blouse", "sweater", "hoodie", "jacket", "coat", "blazer", "cardigan", "pullover", "outerwear")
    
    if any(k in cat for k in bottom_kws):
        return "bottom"
    if any(k in cat for k in top_kws):
        return "top"

    # 2. Check description / product name keywords
    if any(k in desc for k in bottom_kws):
        return "bottom"
    if any(k in desc for k in top_kws):
        return "top"

    # 3. Fallback to image aspect ratio
    w, h = cloth_img.size
    aspect = h / w
    if aspect > 1.35:
        # Tall and narrow indicates a full-body dress or outfit
        return "dress"
    
    return "top"


async def composite_garments(garment_details: list) -> str:
    """
    Composite multiple garments (e.g. a top and a bottom) into a single outfit image.
    garment_details: list of dict with keys: 'image_url', 'category', 'description'
    Returns the local URL of the composited outfit image.
    """
    from app.services.upload_service import save_file_from_bytes
    import io

    # 1. Load and segment all garments
    segmented_pieces = []
    for detail in garment_details:
        img_url = detail.get("image_url")
        cat = detail.get("category", "")
        desc = detail.get("description", "")
        if not img_url:
            continue
            
        img = _load_image(img_url, fallback_type="garment").convert("RGB")
        g_type = _classify_garment_type(cat, desc, img)
        seg_img = _segment_garment(img, category=cat, garment_type=g_type)
        
        # Crop to bounding box
        bbox = seg_img.getbbox()
        if bbox:
            cropped = seg_img.crop(bbox)
        else:
            cropped = seg_img
            
        segmented_pieces.append({
            "image": cropped,
            "type": g_type,
            "description": desc
        })

    if not segmented_pieces:
        raise ValueError("No valid garments to composite.")

    # 2. Sort pieces so top is processed first, then bottom (to overlay correctly)
    tops = [p for p in segmented_pieces if p["type"] == "top"]
    bottoms = [p for p in segmented_pieces if p["type"] == "bottom"]
    dresses = [p for p in segmented_pieces if p["type"] == "dress"]

    # Canvas size: 600x900
    canvas_w = 600
    canvas_h = 900
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))

    if tops and bottoms:
        # Standard outfit: Top + Bottom
        top_img = tops[0]["image"]
        bot_img = bottoms[0]["image"]

        # Scale Top: fit in width 420, max height 400
        tw, th = top_img.size
        top_scale = min(420 / tw, 400 / th)
        top_final_w = int(tw * top_scale)
        top_final_h = int(th * top_scale)
        top_resized = top_img.resize((top_final_w, top_final_h), Image.Resampling.LANCZOS)

        # Scale Bottom: fit in width 400, max height 520
        bw, bh = bot_img.size
        bot_scale = min(400 / bw, 520 / bh)
        bot_final_w = int(bw * bot_scale)
        bot_final_h = int(bh * bot_scale)
        bot_resized = bot_img.resize((bot_final_w, bot_final_h), Image.Resampling.LANCZOS)

        # Paste Top on upper part (center horizontally)
        top_x = (canvas_w - top_final_w) // 2
        top_y = 80  # Leave some space at the top

        # Paste Bottom on lower part (center horizontally)
        bot_x = (canvas_w - bot_final_w) // 2
        # Let bottom overlap slightly with the top at the waistline
        bot_y = (top_y + top_final_h) - 40
        # If it overflows bottom of canvas, shift up
        if bot_y + bot_final_h > canvas_h - 20:
            overflow = (bot_y + bot_final_h) - (canvas_h - 20)
            bot_y -= overflow
            top_y -= overflow // 2  # Shift top up slightly too
            if top_y < 20:
                top_y = 20

        # Paste bottom first, then top on top of it (tucked out style)
        canvas.paste(bot_resized, (bot_x, bot_y), mask=bot_resized.split()[3])
        canvas.paste(top_resized, (top_x, top_y), mask=top_resized.split()[3])

    elif dresses:
        # Just use the dress (scale to fit canvas)
        dress_img = dresses[0]["image"]
        dw, dh = dress_img.size
        scale = min(450 / dw, 750 / dh)
        final_w = int(dw * scale)
        final_h = int(dh * scale)
        resized = dress_img.resize((final_w, final_h), Image.Resampling.LANCZOS)
        dx = (canvas_w - final_w) // 2
        dy = (canvas_h - final_h) // 2
        canvas.paste(resized, (dx, dy), mask=resized.split()[3])
    else:
        # Fallback: paste whatever is there sequentially
        curr_y = 50
        for piece in segmented_pieces:
            p_img = piece["image"]
            pw, ph = p_img.size
            scale = min(400 / pw, 400 / ph)
            final_w = int(pw * scale)
            final_h = int(ph * scale)
            resized = p_img.resize((final_w, final_h), Image.Resampling.LANCZOS)
            px = (canvas_w - final_w) // 2
            canvas.paste(resized, (px, curr_y), mask=resized.split()[3])
            curr_y += final_h - 20

    # 3. Save composited canvas to bytes and upload as PNG to preserve transparency for local pipeline
    out_buf = io.BytesIO()
    canvas.save(out_buf, format="PNG")
    
    result_url = await save_file_from_bytes(
        out_buf.getvalue(),
        original_filename="outfit_composite.png",
        folder="outfits"
    )

    logger.info(f"[AIClient] Composited outfit saved at: {result_url}")
    return result_url


# ---------------------------------------------------------------------------
# Helper: Garment Segmentation (improved)
# ---------------------------------------------------------------------------

def _segment_garment(cloth_img: Image.Image, category: str = "", garment_type: str = "dress", is_composite: bool = False) -> Image.Image:
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
    is_bottom = (garment_type == "bottom")
    if is_composite:
        head_cutoff_pct = 0.0
    elif is_bottom:
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

            is_center = (int(cw * 0.28) <= x <= int(cw * 0.72))
            is_upper_leg_zone = (y < int(ch * 0.85))

            # For bottoms, the center region above the ankles is strictly pants fabric.
            # Skip background and skin checks to prevent khaki/tan clothing from being erased.
            if is_bottom and is_center and is_upper_leg_zone:
                continue

            # For tops/dresses, the center region has fabric, but may have neck skin.
            # We skip background check in the center, but we STILL perform skin detection.
            if (not is_bottom) and is_center and is_upper_leg_zone:
                is_skin = _is_skin_pixel(r, g, b)
                if is_skin:
                    # Remove skin in neck/chest cutout
                    pix[x, y] = (r, g, b, 0)
                continue

            # Otherwise (sides and bottom/shoes area), do full background and skin checks:
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

def _create_clothing_mask(user_img: Image.Image, face_height: int, garment_type: str = "dress") -> Image.Image:
    """
    Create a mask covering the user's clothing region (body minus face/arms).
    Uses a hybrid approach:
    1. Row-level pixel classification (detecting skin, hair, and clothing vs. desaturated background).
    2. Dynamic row-by-row mask construction to restrict inpainting tightly to body silhouette.
    3. Falling back to tighter standard bounding boxes if background is complex or detection fails.
    """
    uw, uh = user_img.size
    mask = Image.new("L", (uw, uh), 0)
    draw = ImageDraw.Draw(mask)

    if garment_type == "bottom":
        top_y = int(uh * 0.52)
        bot_y = int(uh * 0.96)
        fallback_left = int(uw * 0.20)
        fallback_right = int(uw * 0.80)
        padding = int(uw * 0.05)
    elif garment_type == "top":
        top_y = int(uh * 0.24)
        bot_y = int(uh * 0.58)
        fallback_left = int(uw * 0.24)
        fallback_right = int(uw * 0.76)
        padding = int(uw * 0.04)
    else:  # dress / full-body
        top_y = int(uh * 0.22)
        bot_y = int(uh * 0.82) # Preserves original lower legs and feet to prevent AI distortion
        fallback_left = int(uw * 0.24)
        fallback_right = int(uw * 0.76)
        padding = int(uw * 0.04)

    classified_rows = 0
    total_rows = bot_y - top_y

    for y in range(top_y, bot_y):
        # find left boundary of body (detecting skin, hair, or colored garment)
        left_x = None
        for x in range(uw):
            r, g, b = user_img.getpixel((x, y))
            max_diff = max(r, g, b) - min(r, g, b)
            max_val = max(r, g, b)
            if max_diff > 18 or max_val < 110:
                left_x = x
                break

        # find right boundary
        right_x = None
        for x in range(uw - 1, -1, -1):
            r, g, b = user_img.getpixel((x, y))
            max_diff = max(r, g, b) - min(r, g, b)
            max_val = max(r, g, b)
            if max_diff > 18 or max_val < 110:
                right_x = x
                break

        if left_x is not None and right_x is not None:
            width = right_x - left_x
            if 15 < width < int(uw * 0.92):
                classified_rows += 1
                lx = max(0, left_x - padding)
                rx = min(uw - 1, right_x + padding)
                for x in range(lx, rx + 1):
                    mask.putpixel((x, y), 255)
                continue

        # Fallback for this specific row if detection fails
        for x in range(fallback_left, fallback_right + 1):
            mask.putpixel((x, y), 255)

    # If too few rows were successfully classified, fallback to a standard clean rectangular mask
    if classified_rows < int(total_rows * 0.40):
        logger.info(f"[AI Inpainting Mask] Dynamic silhouette fallback triggered (classified: {classified_rows}/{total_rows})")
        # Clear mask and draw default rectangular box
        draw.rectangle([0, 0, uw, uh], fill=0)
        draw.rectangle([fallback_left, top_y, fallback_right, bot_y], fill=255)

    # Feather the mask slightly (8px) to cleanly slice off old sleeve boundaries
    mask = mask.filter(ImageFilter.GaussianBlur(8))
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


def _detect_neck_gap(user_face_crop: Image.Image, garment_canvas: Image.Image, uw: int, uh: int) -> bool:
    """
    Detects if there is a horizontal gap (where both face crop and garment are transparent)
    in the neck/torso transition zone.
    Returns True if a gap is detected, indicating that the clothing is detached from the body.
    """
    # Define transition zone: y from 31% to 38% of height
    y_start = int(uh * 0.31)
    y_end = int(uh * 0.38)
    
    # Center column range for checking: x from 45% to 55%
    x_start = int(uw * 0.45)
    x_end = int(uw * 0.55)
    width_check = x_end - x_start
    
    # Load alpha channels
    face_alpha = user_face_crop.split()[3].load()
    garment_alpha = garment_canvas.split()[3].load()
    
    for y in range(y_start, y_end):
        gap_count = 0
        for x in range(x_start, x_end):
            # Since user_face_crop only has height face_height (int(uh * 0.38)),
            # y is valid for face_alpha
            if y < user_face_crop.height:
                fa = face_alpha[x, y]
            else:
                fa = 0
                
            ga = garment_alpha[x, y]
            
            # If both are transparent (or near transparent)
            if fa < 50 and ga < 50:
                gap_count += 1
                
        # If more than 75% of the pixels in this row across the center neck are transparent in both layers,
        # it is a gap!
        if gap_count > int(width_check * 0.75):
            logger.warning(f"[AI Pipeline v2 QC] Neck gap detected at y={y} ({y/uh:.3f} height): row is {gap_count}/{width_check} transparent in both layers.")
            return True
            
    return False


# ---------------------------------------------------------------------------
# Helper: Edge Shadow & Fabric Depth Simulation
# ---------------------------------------------------------------------------

def _add_edge_shadows(result_img: Image.Image, garment_canvas: Image.Image) -> Image.Image:
    """
    Adds a realistic directional shadow around garment edges to create depth.
    Simulates light from upper-left, shadow falls lower-right.
    """
    uw, uh = result_img.size
    garment_alpha = garment_canvas.split()[3]

    # Dilate alpha to get shadow region (slightly larger than garment)
    shadow_spread = max(7, int(min(uw, uh) * 0.012))
    if shadow_spread % 2 == 0:
        shadow_spread += 1
    shadow_alpha = garment_alpha.filter(ImageFilter.MaxFilter(shadow_spread))
    # Offset shadow down-right (directional light from upper-left)
    offset_x, offset_y = int(uw * 0.006), int(uh * 0.008)
    shadow_canvas = Image.new("L", (uw, uh), 0)
    shadow_canvas.paste(shadow_alpha, (offset_x, offset_y))
    # Blur shadow for soft falloff
    shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(shadow_spread * 1.5))
    # Exclude pixels where garment itself exists (shadow only outside)
    garment_mask_inv = garment_alpha.point(lambda p: 255 - p)
    shadow_canvas = ImageChops.multiply(shadow_canvas, garment_mask_inv)
    # Apply 30% opacity shadow (darken result)
    shadow_layer = Image.new("RGBA", (uw, uh), (0, 0, 0, 0))
    shadow_layer.paste(Image.new("RGB", (uw, uh), (0, 0, 0)).convert("RGBA"),
                       (0, 0), shadow_canvas.point(lambda p: int(p * 0.30)))
    result_rgba = result_img.convert("RGBA")
    result_with_shadow = Image.alpha_composite(result_rgba, shadow_layer)
    return result_with_shadow.convert("RGB")


def _simulate_fabric_depth(garment_rgba: Image.Image) -> Image.Image:
    """
    Adds subtle fabric fold/wrinkle simulation by applying a gentle
    lightness variation to the garment, creating the illusion of 3D draping.
    """
    # Convert to LAB-like approach via RGB enhancement
    # Add slight vignette darkening toward edges (fabric drapes darker at sides)
    gw, gh = garment_rgba.size
    alpha = garment_rgba.split()[3]

    # Create edge vignette mask
    vignette = Image.new("L", (gw, gh), 255)
    v_draw = ImageDraw.Draw(vignette)
    # Darken edges with gradient (approximate vignette)
    edge_px = max(8, int(min(gw, gh) * 0.10))
    for i in range(edge_px):
        ratio = int(255 * (1.0 - (i / edge_px) ** 0.5) * 0.25)  # max 25% darkening
        shade = 255 - ratio
        v_draw.rectangle([i, i, gw - 1 - i, gh - 1 - i], outline=shade)
    vignette = vignette.filter(ImageFilter.GaussianBlur(edge_px // 2))

    # Apply vignette to garment RGB
    garment_rgb = garment_rgba.convert("RGB")
    vignette_rgb = Image.merge("RGB", [vignette, vignette, vignette])
    darkened = ImageChops.multiply(garment_rgb, vignette_rgb)

    # Blend original + darkened (50/50 for subtlety)
    blended = Image.blend(garment_rgb, darkened, 0.40)

    # Restore alpha
    r, g, b = blended.split()
    return Image.merge("RGBA", (r, g, b, alpha))


def _match_color_lab(source: Image.Image, reference: Image.Image) -> Image.Image:
    """
    Advanced color/lighting transfer using per-channel mean+std matching.
    More accurate than simple brightness ratio — matches shadows AND highlights.
    """
    src_arr = list(source.convert("RGB").getdata())
    ref_arr = list(reference.convert("RGB").getdata())
    if not src_arr or not ref_arr:
        return source

    result_pixels = []
    for ch in range(3):
        src_ch = [p[ch] for p in src_arr]
        ref_ch = [p[ch] for p in ref_arr]
        src_mean = sum(src_ch) / len(src_ch)
        ref_mean = sum(ref_ch) / len(ref_ch)
        src_std = (sum((p - src_mean) ** 2 for p in src_ch) / max(1, len(src_ch))) ** 0.5
        ref_std = (sum((p - ref_mean) ** 2 for p in ref_ch) / max(1, len(ref_ch))) ** 0.5
        scale = (ref_std / max(src_std, 1e-6))
        scale = max(0.7, min(1.4, scale))  # clamp
        shift = ref_mean - scale * src_mean
        result_pixels.append([max(0, min(255, int(p * scale + shift))) for p in src_ch])

    matched_data = [(result_pixels[0][i], result_pixels[1][i], result_pixels[2][i])
                    for i in range(len(src_arr))]
    matched = Image.new("RGB", source.size)
    matched.putdata(matched_data)
    return matched


# ---------------------------------------------------------------------------
# Replicate IDM-VTON API Integration (Real AI Try-On)
# ---------------------------------------------------------------------------

async def _call_replicate_idm_vton(
    user_image: str,
    cloth_image: str,
    garment_type: str,
    description: str,
    session_id: str
) -> str:
    """
    Calls Replicate's IDM-VTON model for photorealistic virtual try-on.
    Requires REPLICATE_API_TOKEN in environment variables.
    Model: yisol/idm-vton (SDXL-based, state-of-the-art garment fitting)
    """
    import asyncio
    token = os.getenv("REPLICATE_API_TOKEN", "")
    if not token:
        raise ValueError("REPLICATE_API_TOKEN not configured")

    category_map = {"top": "upper_body", "bottom": "lower_body", "dress": "dresses"}
    category = category_map.get(garment_type, "upper_body")

    quality_prompt = (
        f"{description}. Generate a realistic virtual try-on image. "
        "The person should be wearing the provided clothing naturally with a perfect tight fit, slim fit, "
        "hugging the body curves and contours, form-fitting, without looking loose or baggy. Maintain the identity, face, and "
        "body structure of the person unchanged. Ensure natural lighting, shadows, and "
        "realistic cloth draping including folds and wrinkles. "
        "The final output should look like a high-end fashion e-commerce product image."
    )

    logger.info(f"[Replicate IDM-VTON] Submitting prediction for session {session_id}...")

    async with httpx.AsyncClient(timeout=300) as client:
        # Submit prediction
        resp = await client.post(
            "https://api.replicate.com/v1/models/yisol/idm-vton/predictions",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Prefer": "wait",
            },
            json={
                "input": {
                    "human_img": user_image,
                    "garm_img": cloth_image,
                    "garment_des": quality_prompt,
                    "category": category,
                    "is_checked": True,
                    "is_checked_crop": False,
                    "denoise_steps": 30,
                    "seed": 42,
                }
            }
        )
        resp.raise_for_status()
        prediction = resp.json()

        # If synchronous result returned immediately
        if prediction.get("status") == "succeeded" and prediction.get("output"):
            output = prediction["output"]
            result_url = output[0] if isinstance(output, list) else output
            logger.info(f"[Replicate IDM-VTON] Immediate result: {result_url}")
            return result_url

        # Otherwise poll for result
        get_url = prediction["urls"]["get"]
        logger.info(f"[Replicate IDM-VTON] Polling prediction: {get_url}")

        for attempt in range(150):  # max 5 minutes
            await asyncio.sleep(2)
            result_resp = await client.get(
                get_url,
                headers={"Authorization": f"Bearer {token}"}
            )
            result = result_resp.json()
            status = result.get("status")

            if status == "succeeded":
                output = result.get("output", [])
                result_url = output[0] if isinstance(output, list) else output
                logger.info(f"[Replicate IDM-VTON] Completed in ~{attempt * 2}s: {result_url}")
                return result_url
            elif status in ("failed", "canceled"):
                error = result.get("error", "unknown error")
                raise ValueError(f"[Replicate IDM-VTON] Prediction {status}: {error}")
            elif attempt % 10 == 0:
                logger.info(f"[Replicate IDM-VTON] Still processing... ({attempt * 2}s elapsed)")

        raise TimeoutError("[Replicate IDM-VTON] Prediction timed out after 5 minutes")


# ---------------------------------------------------------------------------
# Local Segment-and-Drape Try-On Pipeline (v3 — photorealistic compositing)
# ---------------------------------------------------------------------------

async def run_local_drape_pipeline(
    user_image_path_or_url: str,
    cloth_image_path_or_url: str,
    session_id: str = "demo",
    category: str = "",
    description: str = "apparel garment product description"
) -> str:
    """
    Local human parsing and garment segmentation try-on pipeline v3.

    Improvements over v2:
    - Advanced LAB-space color/lighting transfer (mean+std matching)
    - Directional edge shadow simulation for garment depth/realism
    - Fabric fold/drape vignette on garment edges
    - Improved neck-to-shoulder transition with skin-fill blending
    - Better garment alpha feathering with multi-pass erosion/dilation
    - Face identity lock with QC diff enforcement
    """
    from app.services.upload_service import save_file_from_bytes

    logger.info(f"[AI Pipeline v2] Starting try-on for session: {session_id}, category: {category}")

    # ── Load images ───────────────────────────────────────────────────────────
    user_img = _load_image(user_image_path_or_url, fallback_type="portrait").convert("RGB")
    cloth_img = _load_image(cloth_image_path_or_url, fallback_type="garment").convert("RGBA")

    uw, uh = user_img.size
    cw, ch = cloth_img.size
    logger.info(f"[AI Pipeline v2] Portrait: {uw}x{uh} | Garment: {cw}x{ch}")

    # ── Garment Classification ────────────────────────────────────────────────
    garment_type = _classify_garment_type(category, description, cloth_img)
    logger.info(f"[AI Pipeline v2] Classified garment type: {garment_type}")

    # ── Step 1: Face extraction ───────────────────────────────────────────
    logger.info("[AI Pipeline v2] Step 1: Extracting face/head for identity lock...")
    face_height = int(uh * 0.42)  # Increased from 0.38 to capture more of the head
    user_face_crop = user_img.crop((0, 0, uw, face_height)).convert("RGBA")

    if garment_type in ("top", "dress"):
        # ── Step 1b: Neckline/collar cleanup on user_face_crop ────────────────
        logger.info("[AI Pipeline v2] Step 1b: Performing neckline and collar cleanup...")
        # Sample skin tone from the face region (y: 0.15 to 0.28, x: 0.42 to 0.58)
        skin_pixels = []
        face_y_start = int(uh * 0.15)
        face_y_end = int(uh * 0.28)
        face_x_start = int(uw * 0.42)
        face_x_end = int(uw * 0.58)
        for y in range(face_y_start, face_y_end):
            for x in range(face_x_start, face_x_end):
                if x < uw and y < uh:
                    r, g, b = user_img.getpixel((x, y))[:3]
                    if _is_skin_pixel(r, g, b):
                        skin_pixels.append((r, g, b))
                        
        if skin_pixels:
            avg_skin_r = sum(p[0] for p in skin_pixels) // len(skin_pixels)
            avg_skin_g = sum(p[1] for p in skin_pixels) // len(skin_pixels)
            avg_skin_b = sum(p[2] for p in skin_pixels) // len(skin_pixels)
            avg_skin = (avg_skin_r, avg_skin_g, avg_skin_b, 255)
        else:
            avg_skin = (210, 160, 140, 255) # default skin tone fallback
        logger.info(f"[AI Pipeline v2] Sampled face skin tone: {avg_skin}")

        # Sample corners of user image for background reference
        corners = [
            user_img.getpixel((5, 5))[:3],
            user_img.getpixel((uw - 6, 5))[:3],
            user_img.getpixel((5, uh - 6 if uh - 6 > 0 else 5))[:3],
            user_img.getpixel((uw - 6, uh - 6 if uh - 6 > 0 else 5))[:3],
            user_img.getpixel((uw // 2, 5))[:3],
        ]
        
        face_crop_pix = user_face_crop.load()
        neck_y_start = int(uh * 0.31)
        # Narrow down the neck area to be centered
        neck_x_start = int(uw * 0.38)
        neck_x_end = int(uw * 0.62)
        
        cleaned_pixels_count = 0
        transparent_pixels_count = 0
        
        for y in range(neck_y_start, face_height):
            for x in range(uw):
                r, g, b, a = face_crop_pix[x, y]
                # Check if it's skin
                if _is_skin_pixel(r, g, b):
                    continue
                # Check if it's background
                is_bg = False
                for cr, cg, cb in corners:
                    if abs(r - cr) < 40 and abs(g - cg) < 40 and abs(b - cb) < 40:
                        is_bg = True
                        break
                if is_bg:
                    continue
                
                # Make all collar/sweater pixels transparent
                face_crop_pix[x, y] = (r, g, b, 0)
                transparent_pixels_count += 1
                    
        logger.info(f"[AI Pipeline v2] Neckline cleanup completed: made {transparent_pixels_count} collar/sweater pixels transparent.")

        # Feather the alpha channel of user_face_crop for smooth transition
        alpha = user_face_crop.split()[3]
        alpha_blurred = alpha.filter(ImageFilter.GaussianBlur(3))
        user_face_crop.putalpha(alpha_blurred)

    # ── Step 2: Garment extraction ────────────────────────────────────────────
    logger.info("[AI Pipeline v2] Step 2: Segmenting garment from product image...")
    # If the garment image already has transparent pixels, it is already segmented (e.g. PNG composite)
    has_alpha = False
    if cloth_img.mode == "RGBA":
        extrema = cloth_img.split()[3].getextrema()
        if extrema and extrema[0] < 255:
            has_alpha = True
            
    if has_alpha:
        logger.info("[AI Pipeline v2] Garment already has transparent alpha channel. Skipping segmentation.")
        segmented_garment = cloth_img
    else:
        is_composite = ("outfit" in (description or "").lower() or "composite" in (cloth_image_path_or_url or "").lower())
        segmented_garment = _segment_garment(cloth_img, category=category, garment_type=garment_type, is_composite=is_composite)

    # Get garment bounding box after segmentation
    bbox = segmented_garment.getbbox()
    if bbox:
        logger.info(f"[AI Pipeline v2] Garment bounding box: {bbox}")
        
        # Validation: check bounding box size is not empty or too small
        gw_box = bbox[2] - bbox[0]
        gh_box = bbox[3] - bbox[1]
        if gw_box < 50 or gh_box < 50:
            logger.error(f"[AI Pipeline v2 QC] Garment bounding box too small: {gw_box}x{gh_box}")
            raise ValueError("Try-on output rejected: segmented garment is too small or incomplete.")
            
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
        logger.warning("[AI Pipeline v2] Empty garment bbox — rejecting.")
        raise ValueError("Try-on output rejected: failed to segment the garment correctly (empty bounding box).")

    gw, gh = cropped_garment.size
    logger.info(f"[AI Pipeline v2] Cropped garment size: {gw}x{gh}")

    # ── Step 3: Determine target region on user body ──────────────────────────
    logger.info("[AI Pipeline v2] Step 3: Computing placement and scale...")

    if garment_type == "bottom":
        # Cover lower body: waist to ankles
        target_width = int(uw * 0.50)
        target_height = int(uh * 0.48)
        paste_x = (uw - target_width) // 2
        paste_y = int(uh * 0.50)
    elif garment_type == "top":
        # Cover upper body (torso only)
        target_width = int(uw * 0.58)
        target_height = int(uh * 0.45)
        paste_x = (uw - target_width) // 2
        paste_y = int(uh * 0.22)
    else:  # dress / full body
        # Cover torso/dress: start just below chin, extend past feet if dress
        target_width = int(uw * 0.58)
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

    # Slim the garment slightly to simulate body wrap-around (prevents the 'fat/short' effect)
    final_w = int(final_w * 0.82)

    # Center horizontally
    paste_x = (uw - final_w) // 2

    # Validation: reject if the scaled garment is too small or incomplete coverage
    min_h_ratio = 0.12 if garment_type == "bottom" else 0.2
    if final_w < int(uw * 0.2) or final_h < int(uh * min_h_ratio):
        logger.error(f"[AI Pipeline v2 QC] Scaled garment too small: {final_w}x{final_h} relative to canvas {uw}x{uh}")
        raise ValueError("Try-on output rejected: scaled garment does not cover the body adequately.")

    logger.info(f"[AI Pipeline v2] Garment scaled to {final_w}x{final_h}, pasting at ({paste_x}, {paste_y})")
    resized_garment = cropped_garment.resize((final_w, final_h), Image.Resampling.LANCZOS)

    # ── Step 4: Advanced color/lighting transfer ──────────────────────────────
    logger.info("[AI Pipeline v3] Step 4: Advanced LAB-space color matching...")
    garment_rgb = resized_garment.convert("RGB")
    # Use advanced per-channel mean+std matching for better lighting consistency
    garment_rgb = _match_color_lab(garment_rgb, user_img)
    # Also apply basic brightness pass for extra safety
    garment_rgb = _match_brightness(garment_rgb, user_img)
    # Fabric depth simulation — realistic fold/drape darkening at edges
    garment_a = resized_garment.split()[3]
    garment_rgba_temp = Image.merge("RGBA", (*garment_rgb.split(), garment_a))
    garment_rgba_temp = _simulate_fabric_depth(garment_rgba_temp)
    garment_r, garment_g, garment_b = garment_rgba_temp.convert("RGB").split()
    garment_a = garment_rgba_temp.split()[3]
    resized_garment = Image.merge("RGBA", (garment_r, garment_g, garment_b, garment_a))

    # ── Step 5: Create body region mask for clothing erasure ──────────────────
    logger.info("[AI Pipeline v2] Step 5: Creating body clothing mask...")
    clothing_region_mask = _create_clothing_mask(user_img, face_height, garment_type=garment_type)

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

    paste_y_offset = 0
    max_attempts = 2
    result_img = None

    for attempt in range(max_attempts):
        current_paste_y = max(0, paste_y - paste_y_offset)
        logger.info(f"[AI Pipeline v2] Compositing attempt {attempt + 1}: current_paste_y={current_paste_y}")

        # Start with the original user image
        result_img_rgba = user_img.copy().convert("RGBA")

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
        garment_canvas.paste(resized_garment, (paste_x, current_paste_y))

        # Combine: paste garment over the blended base using garment's alpha channel
        result_rgba = Image.alpha_composite(blended, garment_canvas)

        # Convert to RGB for final output
        result_img = result_rgba.convert("RGB")

        # ── Step 8: Post-processing — sharpening + edge shadows ─────────────────
        logger.info("[AI Pipeline v3] Step 8: Sharpening + directional shadow...")
        # Light sharpening to make the composite look crisp
        result_img = result_img.filter(ImageFilter.UnsharpMask(radius=0.8, percent=115, threshold=2))
        # Add directional garment edge shadow for depth (realism boost)
        if garment_type in ("top", "dress"):
            result_img = _add_edge_shadows(result_img, garment_canvas)

        # ── Step 9: Region Restoration (Identity & Body Preservation Lock) ───────
        logger.info(f"[AI Pipeline v3] Step 9: Restoring regions based on garment type: {garment_type}...")
        if garment_type == "bottom":
            # For bottoms, restore the entire upper body (face, chest, arms down to waist)
            restore_y = int(uh * 0.50)
            upper_body_crop = user_img.crop((0, 0, uw, restore_y))
            result_img.paste(upper_body_crop, (0, 0))
        elif garment_type == "top":
            # For tops, restore the face/head/neck and the entire lower body (pants/legs)
            # 1. Restore face using mask because user_face_crop is now RGBA
            result_img.paste(user_face_crop, (0, 0), mask=user_face_crop)
            # 2. Restore lower body
            restore_y = int(uh * 0.58)
            lower_body_crop = user_img.crop((0, restore_y, uw, uh))
            result_img.paste(lower_body_crop, (0, restore_y))
        else: # dress / full body
            # For dresses, restore face/head/neck only using mask
            result_img.paste(user_face_crop, (0, 0), mask=user_face_crop)

        # ── Step 9b: Quality Control ───────────────────────────────────────────────
        logger.info("[AI Pipeline v3] Step 9b: Running QC audit...")
        qc_height = int(uh * 0.30)
        out_face = result_img.crop((0, 0, uw, qc_height))
        diff = ImageChops.difference(user_face_crop.convert("RGB").crop((0, 0, uw, qc_height)), out_face)
        extrema = diff.convert("L").getextrema()
        if extrema and extrema[1] > 15:
            logger.warning(f"[AI Pipeline v2 QC] Face diff extrema: {extrema}. Re-pasting face to enforce identity.")
            result_img.paste(user_face_crop, (0, 0), mask=user_face_crop)
        else:
            logger.info(f"[AI Pipeline v2 QC] Face identity check passed. Diff extrema: {extrema}")

        # Gap detection and self-healing / rejection
        if garment_type in ("top", "dress"):
            if _detect_neck_gap(user_face_crop, garment_canvas, uw, uh):
                if attempt < max_attempts - 1:
                    paste_y_offset += 15
                    logger.warning(f"[AI Pipeline v2 QC] Neck gap detected in attempt {attempt + 1}. Retrying with shifted paste_y.")
                    continue
                else:
                    logger.warning("[AI Pipeline v2 QC] Neck gap detected on final attempt. Proceeding with best-effort fallback output.")
                    break
            else:
                logger.info("[AI Pipeline v2 QC] No neck gap detected. Attempt successful.")
                break
        else:
            break

    # ── Step 10: Save & return (high quality JPEG) ───────────────────────────
    out_buf = io.BytesIO()
    result_img.save(out_buf, format="JPEG", quality=95, optimize=True)
    processed_bytes = out_buf.getvalue()

    result_url = await save_file_from_bytes(
        processed_bytes,
        original_filename=f"tryon_{session_id}.jpg",
        folder="results"
    )
    logger.info(f"[AI Pipeline v3] Completed for session {session_id}. Result: {result_url}")
    return result_url


async def apply_post_processing_qc(
    result_image_url: str,
    user_image_path_or_url: str,
    session_id: str
) -> str:
    """
    Quality Control Post-Processor for external AI results:
    1. Downloads the generated result from the AI service.
    2. Aligns and crops the result to match the original user image's aspect ratio and dimensions.
    3. Saves the cleaned image and returns the URL.
    """
    from app.services.upload_service import save_file_from_bytes

    logger.info(f"[AI Pipeline QC] Running post-processing alignment for session: {session_id}")

    try:
        user_img = _load_image(user_image_path_or_url).convert("RGB")
        result_img = _load_image(result_image_url).convert("RGB")
    except Exception as e:
        logger.warning(f"[AI Pipeline QC] Could not run post-processing: {e}. Returning original result URL.")
        return result_image_url

    uw, uh = user_img.size
    rw, rh = result_img.size

    # Calculate padding offsets added by the AI pipeline (letterboxing)
    scale = min(rw / uw, rh / uh)
    sw = int(uw * scale)
    sh = int(uh * scale)
    
    pad_x = (rw - sw) // 2
    pad_y = (rh - sh) // 2

    def crop_to_ratio(img: Image.Image, target_ratio: float = 0.75) -> Image.Image:
        w, h = img.size
        current_ratio = w / h
        if abs(current_ratio - target_ratio) < 1e-3:
            return img
        if current_ratio < target_ratio:
            # Too narrow (tall): crop height from the BOTTOM to preserve the face/head at the top
            new_h = int(w / target_ratio)
            # Keep the top of the image (face/head) — crop from the bottom
            return img.crop((0, 0, w, new_h))
        else:
            # Too wide: crop width from center
            new_w = int(h * target_ratio)
            dx = (w - new_w) // 2
            return img.crop((dx, 0, dx + new_w, h))

    # Crop and resize the AI result to standard 768x1024 resolution (3:4 aspect ratio)
    cropped_result = result_img.crop((pad_x, pad_y, pad_x + sw, pad_y + sh))
    cropped_34 = crop_to_ratio(cropped_result, 0.75)
    aligned_result = cropped_34.resize((768, 1024), Image.Resampling.LANCZOS)

    # Save processed image
    out_buf = io.BytesIO()
    aligned_result.save(out_buf, format="JPEG", quality=95)
    processed_bytes = out_buf.getvalue()

    refined_url = await save_file_from_bytes(
        processed_bytes,
        original_filename=f"tryon_refined_{session_id}.jpg",
        folder="results"
    )
    logger.info(f"[AI Pipeline QC] Aligned result saved. URL: {refined_url}")
    return refined_url

# ---------------------------------------------------------------------------
# Google Gemini / Nano Banana 2 API Integration (Priority 1)
# ---------------------------------------------------------------------------

async def _call_nano_banana_2(
    user_image: str,
    cloth_image: str,
    category: str,
    description: str,
    model_variant: str,
    session_id: str,
    avatar: str = None,
    height: int = None,
    weight: int = None,
    body_bust: int = None,
    body_waist: int = None,
    body_hips: int = None
) -> str:
    """
    Calls Google's Gemini 3.1 Flash Image model (Nano Banana 2) for inpainting-based virtual try-on.
    Encodes the portrait, a generated clothing mask, and the reference garment,
    then requests the model to render the garment in the masked area.
    """
    import base64
    import io
    import httpx
    import asyncio
    from PIL import Image
    from app.core.config import settings
    from app.services.upload_service import save_file_from_bytes

    openrouter_key = (
        getattr(settings, "OPENROUTER_API_KEY", "")
        or os.getenv("OPENROUTER_API_KEY", "")
    )
    api_key = (
        settings.GEMINI_API_KEY 
        or settings.NANO_BANANA_API_KEY 
        or os.getenv("GEMINI_API_KEY") 
        or os.getenv("NANO_BANANA_API_KEY", "")
    )
    has_gemini = api_key and "your-gemini-api-key" not in api_key and "your_gemini_api_key" not in api_key
    has_openrouter = openrouter_key and "your_openrouter_api_key" not in openrouter_key and "your-openrouter-key" not in openrouter_key

    if not has_gemini and not has_openrouter:
        raise ValueError("Google Gemini / Nano Banana 2 API Key or OpenRouter API Key not configured")

    model_name = settings.NANO_BANANA_MODEL or os.getenv("NANO_BANANA_MODEL", "gemini-3.1-flash-image-preview")
    if has_openrouter:
        if not model_name.startswith("google/"):
            model_name = f"google/{model_name}"

    logger.info(f"[Nano Banana 2] Preparing try-on inpainting request for session {session_id} using model {model_name}...")

    # Load images
    user_img = _load_image(user_image, fallback_type="portrait").convert("RGB")
    cloth_img = _load_image(cloth_image, fallback_type="garment").convert("RGBA")

    uw, uh = user_img.size

    # Classify garment type and create mask
    garment_type = _classify_garment_type(category, description, cloth_img)
    face_height = int(uh * 0.38)
    clothing_region_mask = _create_clothing_mask(user_img, face_height, garment_type=garment_type)

    # Convert user image to base64
    user_buffer = io.BytesIO()
    user_img.save(user_buffer, format="JPEG", quality=95)
    user_b64 = base64.b64encode(user_buffer.getvalue()).decode("utf-8")

    # Convert mask to base64 (using PNG to preserve binary mask structure)
    mask_buffer = io.BytesIO()
    clothing_region_mask.save(mask_buffer, format="PNG")
    mask_b64 = base64.b64encode(mask_buffer.getvalue()).decode("utf-8")

    # Convert garment image to base64
    garment_buffer = io.BytesIO()
    if cloth_img.mode == "RGBA":
        g_bg = Image.new("RGBA", cloth_img.size, (255, 255, 255, 255))
        g_composite = Image.alpha_composite(g_bg, cloth_img).convert("RGB")
        g_composite.save(garment_buffer, format="JPEG", quality=95)
    else:
        cloth_img.convert("RGB").save(garment_buffer, format="JPEG", quality=95)
    garment_b64 = base64.b64encode(garment_buffer.getvalue()).decode("utf-8")

    # Construct the multimodal prompt
    prompt = (
        f"Inpainting photo of the same person from the input image, maintaining their exact facial features, skin tone, hair, identical body pose, body shape, body width, proportions, and slim silhouette. The shoulders, neck, waist, arms, and body width must remain extremely thin, slender, and identical to the original image. Do not make the person look heavier, wider, bulkier, or chubbier than the original image. "
    )
    if avatar or height or weight or body_bust or body_waist or body_hips:
        profile_desc = []
        if avatar:
            profile_desc.append(f"a {avatar} body type")
        if height:
            profile_desc.append(f"height {height} cm")
        if weight:
            profile_desc.append(f"weight {weight} kg")
        if body_bust:
            profile_desc.append(f"bust/chest size {body_bust} cm")
        if body_waist:
            profile_desc.append(f"waist size {body_waist} cm")
        if body_hips:
            profile_desc.append(f"hips size {body_hips} cm")
        prompt += f"The person has {', '.join(profile_desc)}. "

    prompt += (
        f"In the masked area (defined by the mask image), render a high-fidelity, highly detailed {description} matching the reference garment image. "
        f"The clothing must be styled with a perfect tight fit, slim fit, form-fitting, hugging the body curves and waist naturally, without adding bulk or thickness to the body shape. Crisp studio lighting, clean solid light-grey background, photorealistic texture of the fabric, 8k resolution, commercial fashion photography style."
    )

    if has_openrouter:
        logger.info(f"[Nano Banana 2] Routing request via OpenRouter API using model {model_name}...")
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://vrital.com",
            "X-Title": "Vrital Virtual Try-On",
        }
        payload = {
            "model": model_name,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{user_b64}"
                            }
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{mask_b64}"
                            }
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{garment_b64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            "modalities": ["image", "text"]
        }
    else:
        logger.info(f"[Nano Banana 2] Sending request to Gemini API generateContent endpoint...")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "inlineData": {
                                "mimeType": "image/jpeg",
                                "data": user_b64
                            }
                        },
                        {
                            "inlineData": {
                                "mimeType": "image/png",
                                "data": mask_b64
                            }
                        },
                        {
                            "inlineData": {
                                "mimeType": "image/jpeg",
                                "data": garment_b64
                            }
                        },
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseModalities": ["IMAGE"]
            }
        }

    max_retries = 3
    backoff = 2.0

    async with httpx.AsyncClient(timeout=180) as client:
        for attempt in range(max_retries):
            try:
                resp = await client.post(url, json=payload, headers=headers)
                
                if resp.status_code == 429:
                    logger.warning(f"[Nano Banana 2] Rate limited (429). Retrying in {backoff}s...")
                    await asyncio.sleep(backoff)
                    backoff *= 2
                    continue

                resp.raise_for_status()
                data = resp.json()
                
                if has_openrouter:
                    choices = data.get("choices", [])
                    if not choices:
                        raise ValueError(f"OpenRouter API returned no choices: {data}")
                    
                    message = choices[0].get("message", {})
                    images = message.get("images", [])
                    image_url = None
                    
                    if images and isinstance(images, list):
                        img_item = images[0]
                        if isinstance(img_item, dict):
                            image_url = img_item.get("image_url", {}).get("url") or img_item.get("url")
                    
                    if not image_url:
                        content = message.get("content", "")
                        if "data:image/" in content:
                            import re
                            match = re.search(r'data:image/[^;]+;base64,[a-zA-Z0-9+/=]+', content)
                            if match:
                                image_url = match.group(0)
                                
                    if not image_url:
                        raise ValueError(f"No image found in OpenRouter response: {data}")
                    
                    if "," in image_url:
                        image_b64 = image_url.split(",")[1]
                    else:
                        image_b64 = image_url
                else:
                    candidates = data.get("candidates", [])
                    if not candidates:
                        raise ValueError(f"Gemini API returned no candidates: {data}")
                    
                    # Search for image part
                    image_b64 = None
                    for cand in candidates:
                        content = cand.get("content", {})
                        parts = content.get("parts", [])
                        for part in parts:
                            inline_data = part.get("inlineData", {})
                            mime_type = inline_data.get("mimeType", "")
                            if mime_type.startswith("image/"):
                                image_b64 = inline_data.get("data")
                                break
                        if image_b64:
                            break
                            
                    if not image_b64:
                        raise ValueError(f"No image found in Gemini API response: {data}")

                # Save base64 image to backend uploads
                image_bytes = base64.b64decode(image_b64)
                saved_url = await save_file_from_bytes(
                    image_bytes,
                    original_filename=f"tryon_banana_{session_id}.jpg",
                    folder="results"
                )
                logger.info(f"[Nano Banana 2] Completed successfully. Image saved to: {saved_url}")
                return saved_url

            except httpx.HTTPStatusError as e:
                logger.warning(f"[Nano Banana 2] HTTP Error (attempt {attempt + 1}/{max_retries}): {e.response.text}")
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(backoff)
                backoff *= 2
            except Exception as e:
                logger.warning(f"[Nano Banana 2] Error (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(backoff)
                backoff *= 2

    raise ValueError("[Nano Banana 2] Max retries exceeded without success")


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
        description: str = "apparel garment product description",
        garment_details: list = None,
        avatar: str = None,
        height: int = None,
        weight: int = None,
        body_bust: int = None,
        body_waist: int = None,
        body_hips: int = None
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
            description: Description of the garment for prompt conditioning.
            garment_details: Optional list of dictionaries with info for all garments to composite.

        Returns:
            dict: { result_url: str, inference_time_ms: int, model_version: str }
        """
        if garment_details and len(garment_details) > 1:
            logger.info(f"[AIClient] Detected multi-garment try-on request. Starting outfit composition...")
            try:
                cloth_image = await composite_garments(garment_details)
                category = "Dresses"
                description = "top and bottom outfit"
            except Exception as e:
                logger.error(f"[AIClient] Failed to composite garments: {e}. Falling back to primary garment.", exc_info=True)

        start = time.time()
        effective_session_id = session_id or str(uuid.uuid4())[:8]

        # Classify garment type for API routing
        _garment_type_for_routing = "top"
        try:
            _tmp_cloth = _load_image(cloth_image, fallback_type="garment")
            _garment_type_for_routing = _classify_garment_type(category, description, _tmp_cloth)
        except Exception:
            pass

        # ── Priority 1: Nano Banana 2 (Gemini 3.1 Flash Image API) ─────────────
        gemini_key = (
            settings.GEMINI_API_KEY 
            or settings.NANO_BANANA_API_KEY 
            or os.getenv("GEMINI_API_KEY") 
            or os.getenv("NANO_BANANA_API_KEY")
        )
        has_real_gemini = (
            gemini_key 
            and "your-gemini-api-key" not in gemini_key 
            and "your_gemini_api_key" not in gemini_key
        )
        openrouter_key = (
            getattr(settings, "OPENROUTER_API_KEY", "")
            or os.getenv("OPENROUTER_API_KEY", "")
        )
        has_real_openrouter = (
            openrouter_key
            and "your_openrouter_api_key" not in openrouter_key
            and "your-openrouter-key" not in openrouter_key
        )
        if has_real_gemini or has_real_openrouter:
            try:
                if has_real_openrouter:
                    logger.info("[AIClient] Trying Priority 1: Nano Banana 2 (via OpenRouter API proxy)...")
                else:
                    logger.info("[AIClient] Trying Priority 1: Nano Banana 2 (Gemini 3.1 Flash Image API)...")
                result_url = await _call_nano_banana_2(
                    user_image=user_image,
                    cloth_image=cloth_image,
                    category=category,
                    description=description,
                    model_variant=model_variant,
                    session_id=effective_session_id,
                    avatar=avatar,
                    height=height,
                    weight=weight,
                    body_bust=body_bust,
                    body_waist=body_waist,
                    body_hips=body_hips
                )
                # Apply post-processing / alignment
                result_url = await apply_post_processing_qc(result_url, user_image, effective_session_id)
                elapsed = int((time.time() - start) * 1000)
                logger.info(f"[AIClient] Nano Banana 2 try-on completed in {elapsed}ms")
                return {
                    "result_url": result_url,
                    "inference_time_ms": elapsed,
                    "model_version": f"banana-{model_variant}",
                }
            except Exception as e:
                logger.warning(f"[AIClient] Nano Banana 2 call failed: {e}. Falling back to Priority 2.")

        # ── Priority 2: IDM-VTON ──────────────────────────────────────────────
        # Sub-Priority 2.1: Replicate IDM-VTON (cloud service)
        replicate_token = os.getenv("REPLICATE_API_TOKEN", "") or os.getenv("REPLICATE_API_KEY", "")
        if replicate_token:
            try:
                logger.info("[AIClient] Trying Priority 2.1: Replicate IDM-VTON (cloud)...")
                result_url = await _call_replicate_idm_vton(
                    user_image, cloth_image,
                    garment_type=_garment_type_for_routing,
                    description=description,
                    session_id=effective_session_id
                )
                # Post-process alignment
                result_url = await apply_post_processing_qc(result_url, user_image, effective_session_id)
                elapsed = int((time.time() - start) * 1000)
                logger.info(f"[AIClient] Replicate IDM-VTON completed in {elapsed}ms")
                return {
                    "result_url": result_url,
                    "inference_time_ms": elapsed,
                    "model_version": "replicate-idm-vton-sdxl",
                }
            except Exception as e:
                logger.warning(f"[AIClient] Replicate IDM-VTON failed: {e}. Trying local bridge.")

        # Sub-Priority 2.2: Custom/Local IDM-VTON Server (port 8001)
        ai_url = settings.AI_SERVICE_URL
        if ai_url:
            try:
                logger.info(f"[AIClient] Trying Priority 2.2: Custom AI Server bridge ({ai_url})...")
                async with httpx.AsyncClient(timeout=180) as client:
                    resp = await client.post(
                        f"{ai_url}/infer",
                        json={
                            "user_image": user_image,
                            "cloth_image": cloth_image,
                            "model_variant": model_variant,
                            "description": f"{description}. Tight fit, slim fit, perfectly hugging the body curves, form-fitting, no loose fabric.",
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()

                    result_url = data.get("result_url")
                    if result_url:
                        from app.services.upload_service import save_file_from_bytes
                        try:
                            async with httpx.AsyncClient(timeout=60) as dl_client:
                                dl = await dl_client.get(result_url)
                                dl.raise_for_status()
                                saved_url = await save_file_from_bytes(
                                    dl.content,
                                    original_filename=f"tryon_{effective_session_id}.jpg",
                                    folder="results"
                                )
                                result_url = saved_url
                                logger.info(f"[AIClient] IDM result saved to backend: {saved_url}")
                                # Apply post-processing / alignment to preserve correct aspect ratio and prevent stretching
                                result_url = await apply_post_processing_qc(result_url, user_image, effective_session_id)
                        except Exception as dl_err:
                            logger.warning(f"[AIClient] Could not re-save or align IDM result ({dl_err}), using original URL")
                    else:
                        logger.warning("[AIClient] Custom AI server returned no result_url. Falling back.")
                        result_url = await run_local_drape_pipeline(
                            user_image, cloth_image, session_id=effective_session_id, category=category, description=description
                        )

                    elapsed = int((time.time() - start) * 1000)
                    return {
                        "result_url": result_url,
                        "inference_time_ms": data.get("inference_time_ms", elapsed),
                        "model_version": data.get("model_version", f"custom-{model_variant}"),
                    }
            except httpx.HTTPError as e:
                logger.warning(f"[AIClient] Custom AI server failed: {e}. Falling back to Priority 3.")

        # ── Priority 3: Local Segment-and-Drape Pipeline v3 (Demo/dev fallback) ──
        logger.info("[AIClient] Running Priority 3: Local Segment-and-Drape Pipeline v3 fallback...")
        import asyncio
        sleep_durations = {"fast": 0.3, "balanced": 0.8, "quality": 1.5}
        sleep_time = sleep_durations.get(model_variant, 0.8)
        await asyncio.sleep(sleep_time)

        result_url = await run_local_drape_pipeline(
            user_image, cloth_image, session_id=effective_session_id, category=category, description=description
        )
        elapsed = int((time.time() - start) * 1000)
        logger.info(f"[AIClient] Local pipeline completed (variant={model_variant}) in {elapsed}ms: {result_url}")
        return {
            "result_url": result_url,
            "inference_time_ms": elapsed,
            "model_version": f"vrital-local-pipeline-v3-{model_variant}",
        }


# Singleton instance shared across the application
ai_client = AIClient()

"""
Vrital AI Virtual Try-On - IDM-VTON Inference Server v5
=======================================================
Uses gradio_client (proven to work with ZeroGPU Spaces) with proper error handling.
The heartbeat 404 is a known cosmetic issue that does NOT affect inference.
"""

from dotenv import load_dotenv
load_dotenv()

import os
import io
import time
import logging
import tempfile
import uuid
import shutil
import httpx
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("idm_vton_server")

# Suppress noisy heartbeat 404 logs from httpx/gradio_client
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

app = FastAPI(
    title="IDM-VTON Inference Service",
    description="Virtual try-on via yisol/IDM-VTON HF Space (gradio_client)",
    version="5.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUTS_DIR = "outputs"
os.makedirs(OUTPUTS_DIR, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")

HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_KEY", "")
logger.info(f"[IDM Server v5] HF Token: {'configured' if HF_TOKEN else 'MISSING'}")

# Initialize gradio_client — heartbeat 404s are cosmetic, inference still works
_gradio_client = None
_handle_file = None

def _init_client():
    global _gradio_client, _handle_file
    try:
        from gradio_client import Client, handle_file as hf
        _handle_file = hf
        logger.info("[IDM Server] Connecting to yisol/IDM-VTON HF Space...")
        _gradio_client = Client(
            "yisol/IDM-VTON",
            token=HF_TOKEN if HF_TOKEN else None,
        )
        logger.info("[IDM Server] gradio_client connected successfully!")
        return True
    except Exception as e:
        logger.error(f"[IDM Server] Failed to connect gradio_client: {e}")
        return False

_init_client()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class TryOnRequest(BaseModel):
    user_image: str
    cloth_image: str
    model_variant: str = "balanced"
    description: str = "apparel garment product description"
    is_checked_crop: bool = True

class TryOnResponse(BaseModel):
    result_url: str
    inference_time_ms: int
    model_version: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def resolve_image_to_local(url: str) -> str:
    """Resolve URL or local path to a local file path (downloads if needed)."""
    if os.path.exists(url):
        return os.path.abspath(url)

    if "/uploads/" in url:
        parts = url.split("/uploads/")
        local_path = os.path.join("uploads", parts[-1])
        if os.path.exists(local_path):
            return os.path.abspath(local_path)

    # Download remote URL
    logger.info(f"[IDM Server] Downloading: {url}")
    with httpx.Client(timeout=30) as c:
        r = c.get(url)
        r.raise_for_status()
        ext = ".jpg"
        ct = r.headers.get("content-type", "")
        if "png" in ct:
            ext = ".png"
        elif "webp" in ct:
            ext = ".webp"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        tmp.write(r.content)
        tmp.close()
        return tmp.name


def ensure_rgb_jpeg(path: str) -> str:
    """Convert image to RGB JPEG. Returns path (may be a new temp file)."""
    try:
        img = Image.open(path)
        if img.mode in ("RGBA", "LA", "P") or not path.lower().endswith((".jpg", ".jpeg")):
            rgb = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode in ("RGBA", "LA"):
                rgb.paste(img, mask=img.split()[-1])
            else:
                rgb.paste(img.convert("RGB"))
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
            rgb.save(tmp.name, "JPEG", quality=95)
            tmp.close()
            return tmp.name
    except Exception as e:
        logger.warning(f"[IDM Server] JPEG conversion failed for {path}: {e}")
    return path


def pad_to_aspect_ratio(img: Image.Image, target_ratio: float = 0.75) -> tuple[Image.Image, tuple[int, int, int, int]]:
    """
    Pads the image to target_ratio (width/height) using the edge color,
    preventing horizontal or vertical stretching.
    Returns (padded_image, (pad_left, pad_top, pad_right, pad_bottom)).
    """
    w, h = img.size
    current_ratio = w / h
    
    # Get background color from corners
    corners = [img.getpixel((0, 0)), img.getpixel((w - 1, 0)), img.getpixel((0, h - 1)), img.getpixel((w - 1, h - 1))]
    # Simple fallback: use the most frequent color or average
    bg_color = corners[0]
    
    if current_ratio < target_ratio:
        # Too narrow, pad left and right
        target_w = int(h * target_ratio)
        new_img = Image.new(img.mode, (target_w, h), bg_color)
        pad_x = (target_w - w) // 2
        new_img.paste(img, (pad_x, 0))
        return new_img, (pad_x, 0, target_w - w - pad_x, 0)
    elif current_ratio > target_ratio:
        # Too wide, pad top and bottom
        target_h = int(w / target_ratio)
        new_img = Image.new(img.mode, (w, target_h), bg_color)
        pad_y = (target_h - h) // 2
        new_img.paste(img, (0, pad_y))
        return new_img, (0, pad_y, 0, target_h - h - pad_y)
    else:
        return img, (0, 0, 0, 0)


def unpad_image(img: Image.Image, pads: tuple[int, int, int, int], original_size: tuple[int, int]) -> Image.Image:
    """Crops out the padded margins and resizes to standard 768x1024 resolution."""
    pad_left, pad_top, pad_right, pad_bottom = pads
    w, h = img.size
    
    # Crop the active region
    cropped = img.crop((pad_left, pad_top, w - pad_right, h - pad_bottom))
    
    def crop_to_ratio(im: Image.Image, target_ratio: float = 0.75) -> Image.Image:
        iw, ih = im.size
        current_ratio = iw / ih
        if abs(current_ratio - target_ratio) < 1e-3:
            return im
        if current_ratio < target_ratio:
            # Too narrow (tall): crop height from center
            new_h = int(iw / target_ratio)
            dy = (ih - new_h) // 2
            return im.crop((0, dy, iw, dy + new_h))
        else:
            # Too wide: crop width from center
            new_w = int(ih * target_ratio)
            dx = (iw - new_w) // 2
            return im.crop((dx, 0, dx + new_w, ih))

    cropped_34 = crop_to_ratio(cropped, 0.75)
    return cropped_34.resize((768, 1024), Image.Resampling.LANCZOS)


def _run_gradio_predict(person_path: str, garment_path: str, description: str, steps: int, is_checked_crop: bool = True) -> str:
    """
    Call IDM-VTON via gradio_client. Returns local path to result image.
    Reconnects automatically if client is not initialized.
    """
    global _gradio_client, _handle_file

    if _gradio_client is None or _handle_file is None:
        logger.info("[IDM Server] Client not ready, re-initializing...")
        if not _init_client():
            raise RuntimeError("Could not connect to IDM-VTON HF Space. Check HF_TOKEN.")

    logger.info(f"[IDM Server] Calling predict (steps={steps}, desc='{description[:40]}', crop={is_checked_crop})...")
    result = _gradio_client.predict(
        dict={
            "background": _handle_file(person_path),
            "layers": [],
            "composite": _handle_file(person_path),
        },
        garm_img=_handle_file(garment_path),
        garment_des=description,
        is_checked=True,
        is_checked_crop=is_checked_crop,
        denoise_steps=steps,
        seed=42,
        api_name="/tryon",
    )

    # result is a tuple — first element is the output image path or dict
    result_path = result[0] if isinstance(result, (list, tuple)) else result
    if isinstance(result_path, dict):
        result_path = result_path.get("path") or result_path.get("url", "")

    logger.info(f"[IDM Server] Gradio result: {result_path}")
    return str(result_path)


def _save_to_outputs(src_path: str) -> str:
    """Copy result to outputs dir and return public URL."""
    out_name = f"result_{uuid.uuid4().hex[:10]}.jpg"
    dest = os.path.join(OUTPUTS_DIR, out_name)
    shutil.copy(src_path, dest)
    url = f"http://localhost:8001/outputs/{out_name}"
    logger.info(f"[IDM Server] Saved result → {url}")
    return url


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "5.0.0",
        "hf_token": bool(HF_TOKEN),
        "client_ready": _gradio_client is not None,
    }

@app.get("/")
def root():
    return {
        "service": "IDM-VTON v5 (gradio_client)",
        "client_ready": _gradio_client is not None,
        "endpoints": ["/health", "/tryon", "/infer"],
    }


@app.post("/tryon")
async def tryon_multipart(
    person: UploadFile = File(...),
    garment: UploadFile = File(...),
):
    """Direct virtual try-on via multipart upload."""
    start = time.time()
    temp_files = []
    try:
        # Save uploads to temp files
        pe = os.path.splitext(person.filename or "p.jpg")[1] or ".jpg"
        ge = os.path.splitext(garment.filename or "g.jpg")[1] or ".jpg"

        pt = tempfile.NamedTemporaryFile(delete=False, suffix=pe)
        pt.write(await person.read()); pt.close(); temp_files.append(pt.name)

        gt = tempfile.NamedTemporaryFile(delete=False, suffix=ge)
        gt.write(await garment.read()); gt.close(); temp_files.append(gt.name)

        pp = ensure_rgb_jpeg(pt.name)
        gp = ensure_rgb_jpeg(gt.name)
        if pp != pt.name: temp_files.append(pp)
        if gp != gt.name: temp_files.append(gp)

        # Pad person to 3:4 aspect ratio to prevent horizontal stretching/squashing
        person_img = Image.open(pp).convert("RGB")
        original_size = person_img.size
        padded_person, pads = pad_to_aspect_ratio(person_img, 0.75)
        
        padded_person_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        padded_person.save(padded_person_tmp.name, "JPEG", quality=95)
        padded_person_tmp.close()
        temp_files.append(padded_person_tmp.name)

        result_path = _run_gradio_predict(padded_person_tmp.name, gp, "garment apparel item", 30, True)
        
        # Unpad and crop back to original aspect ratio and dimensions
        result_img = Image.open(result_path).convert("RGB")
        unpadded_result = unpad_image(result_img, pads, original_size)
        
        unpadded_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        unpadded_result.save(unpadded_tmp.name, "JPEG", quality=95)
        unpadded_tmp.close()
        temp_files.append(unpadded_tmp.name)

        result_url = _save_to_outputs(unpadded_tmp.name)
        logger.info(f"[IDM Server] /tryon done in {time.time()-start:.1f}s")
        return {"result_image": result_url}

    except Exception as e:
        logger.error(f"[IDM Server] /tryon failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for f in temp_files:
            try:
                if os.path.exists(f): os.remove(f)
            except Exception: pass


@app.post("/infer", response_model=TryOnResponse)
async def infer(request: TryOnRequest):
    """JSON-based try-on endpoint used by the backend AI gateway."""
    start = time.time()
    steps = {"fast": 20, "balanced": 30, "quality": 50}.get(request.model_variant, 30)
    temp_files = []
    try:
        logger.info(f"[IDM Server] /infer — variant={request.model_variant}, steps={steps}")
        person_path = resolve_image_to_local(request.user_image)
        cloth_path = resolve_image_to_local(request.cloth_image)
        if tempfile.gettempdir() in person_path: temp_files.append(person_path)
        if tempfile.gettempdir() in cloth_path: temp_files.append(cloth_path)

        pp = ensure_rgb_jpeg(person_path)
        gp = ensure_rgb_jpeg(cloth_path)
        if pp != person_path: temp_files.append(pp)
        if gp != cloth_path: temp_files.append(gp)

        # Pad person to 3:4 aspect ratio to prevent horizontal stretching/squashing
        person_img = Image.open(pp).convert("RGB")
        original_size = person_img.size
        padded_person, pads = pad_to_aspect_ratio(person_img, 0.75)
        
        padded_person_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        padded_person.save(padded_person_tmp.name, "JPEG", quality=95)
        padded_person_tmp.close()
        temp_files.append(padded_person_tmp.name)

        result_path = _run_gradio_predict(padded_person_tmp.name, gp, request.description, steps, request.is_checked_crop)
        
        # Unpad and crop back to original aspect ratio and dimensions
        result_img = Image.open(result_path).convert("RGB")
        unpadded_result = unpad_image(result_img, pads, original_size)
        
        unpadded_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        unpadded_result.save(unpadded_tmp.name, "JPEG", quality=95)
        unpadded_tmp.close()
        temp_files.append(unpadded_tmp.name)

        result_url = _save_to_outputs(unpadded_tmp.name)
        elapsed = int((time.time() - start) * 1000)
        logger.info(f"[IDM Server] /infer done in {elapsed}ms")

        return TryOnResponse(
            result_url=result_url,
            inference_time_ms=elapsed,
            model_version=f"idm-vton-gradio-v5-{request.model_variant}",
        )
    except Exception as e:
        logger.error(f"[IDM Server] /infer failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for f in temp_files:
            try:
                if os.path.exists(f): os.remove(f)
            except Exception: pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")

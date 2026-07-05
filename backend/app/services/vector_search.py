import json
import os
import math
import httpx
import base64
import logging
import io
from PIL import Image
from sqlalchemy.orm import Session
from app.core.config import settings
from app.modules.products.models import Product

logger = logging.getLogger(__name__)

def cosine_similarity(v1, v2):
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude1 = math.sqrt(sum(a * a for a in v1))
    magnitude2 = math.sqrt(sum(b * b for b in v2))
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)

def get_image_embedding(image_bytes: bytes, mime_type: str = "image/jpeg") -> list:
    """
    Generates a 768-dimensional multimodal embedding for an image using gemini-embedding-2.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.error("[VectorSearch] Gemini API Key not configured")
        raise ValueError("Gemini API Key is not configured.")

    # Encode image bytes to base64
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key={api_key}"
    payload = {
        "content": {
            "parts": [
                {
                    "inlineData": {
                        "mimeType": mime_type,
                        "data": image_b64
                    }
                }
            ]
        }
    }

    try:
        logger.info("[VectorSearch] Requesting embedding from gemini-embedding-2...")
        response = httpx.post(url, json=payload, timeout=25.0)
        if response.status_code != 200:
            logger.error(f"[VectorSearch] Gemini API returned error {response.status_code}: {response.text}")
            raise ValueError(f"Gemini API returned status {response.status_code}")
        
        data = response.json()
        embedding_vals = data.get("embedding", {}).get("values", [])
        if not embedding_vals:
            logger.error(f"[VectorSearch] No embedding values in response: {data}")
            raise ValueError("No embedding returned from Gemini API")
        
        logger.info(f"[VectorSearch] Successfully extracted embedding vector of size {len(embedding_vals)}")
        return embedding_vals
    except Exception as e:
        logger.error(f"[VectorSearch] Failed to fetch image embedding: {e}")
        raise

def get_image_embedding_from_url(url: str) -> list:
    """
    Downloads an image from a public URL and extracts its Gemini embedding.
    If the URL points to a local upload path, reads it directly from the filesystem.
    """
    try:
        # Check if local upload path
        if "/uploads/" in url:
            filename = url.split("/uploads/")[-1]
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            local_path = os.path.join(backend_dir, "uploads", filename)
            if os.path.exists(local_path):
                logger.info(f"[VectorSearch] Loading local file directly: {local_path}")
                with open(local_path, "rb") as f:
                    image_bytes = f.read()
                return get_image_embedding(image_bytes, mime_type="image/jpeg")
            else:
                logger.warning(f"[VectorSearch] Local file not found: {local_path}. Falling back to HTTP request.")

        logger.info(f"[VectorSearch] Downloading image for embedding from: {url}")
        response = httpx.get(url, timeout=15.0)
        if response.status_code != 200:
            raise ValueError(f"Failed to download image from {url}, status code {response.status_code}")
        
        # Open image to make sure it's valid, convert to RGB
        img = Image.open(io.BytesIO(response.content))
        if img.mode != "RGB":
            img = img.convert("RGB")
        
        # Save to buffer
        out_buf = io.BytesIO()
        img.save(out_buf, format="JPEG", quality=90)
        return get_image_embedding(out_buf.getvalue(), mime_type="image/jpeg")
    except Exception as e:
        logger.error(f"[VectorSearch] Failed to extract embedding from URL {url}: {e}")
        raise

def precalculate_product_embeddings(db: Session):
    """
    Finds all active products missing image_embeddings, generates them, and commits to DB.
    """
    products = db.query(Product).filter(Product.image_embedding == None, Product.is_active == True).all()
    if not products:
        logger.info("[VectorSearch] All product embeddings are up to date.")
        return

    logger.info(f"[VectorSearch] Found {len(products)} products missing embeddings. Pre-generating...")
    updated_count = 0
    for prod in products:
        try:
            # Check main image URL
            if not prod.main_image_url:
                continue
            
            vector = get_image_embedding_from_url(prod.main_image_url)
            prod.image_embedding = json.dumps(vector)
            updated_count += 1
            logger.info(f"[VectorSearch] Generated embedding for product: {prod.name} ({prod.id})")
        except Exception as e:
            logger.error(f"[VectorSearch] Skipping product {prod.name} due to embedding failure: {e}")
            continue
    
    if updated_count > 0:
        db.commit()
        logger.info(f"[VectorSearch] Committed {updated_count} product embeddings to database.")

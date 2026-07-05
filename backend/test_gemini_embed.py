import httpx
import base64
import sys
import os
import io
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings

def test_embed():
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        print("API Key not found!")
        return

    # Generate a valid tiny JPEG image base64
    img = Image.new('RGB', (10, 10), color='red')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    tiny_jpeg_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key={api_key}"
    payload = {
        "content": {
            "parts": [
                {
                    "inlineData": {
                        "mimeType": "image/jpeg",
                        "data": tiny_jpeg_b64
                    }
                }
            ]
        }
    }
    
    print("Sending request to gemini-embedding-2...")
    try:
        response = httpx.post(url, json=payload, timeout=20.0)
        print("Status Code:", response.status_code)
        print("Response Body:", response.text[:400])
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_embed()

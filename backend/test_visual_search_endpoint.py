import sys
import os
import io
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.modules.products.models import Product

client = TestClient(app)

def test_visual_search():
    # 1. Check if we have active products
    db = SessionLocal()
    products = db.query(Product).filter(Product.is_active == True).all()
    print(f"Database has {len(products)} active products.")
    db.close()
    
    if not products:
        print("No products in database, seeding needed.")
        return

    # 2. Generate a tiny red JPEG image as bytes
    img = Image.new('RGB', (20, 20), color='red')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    img_bytes = buf.getvalue()

    # 3. Call the search-by-image endpoint
    print("Sending POST /api/v1/products/search-by-image...")
    files = {"file": ("test_image.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/v1/products/search-by-image", files=files)
    
    print("Status Code:", response.status_code)
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data)} matching products:")
        for i, item in enumerate(data[:5]):
            print(f"[{i+1}] {item['name']} - Score: {item.get('similarity_score', 0):.4f} - Brand: {item.get('brand', {}).get('name') if item.get('brand') else 'N/A'}")
    else:
        print("Error Response:", response.text)

if __name__ == "__main__":
    test_visual_search()

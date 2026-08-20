import os
import shutil
import sqlite3
import uuid
import requests
import json

# Local Paths
WORKSPACE_ROOT = "/Users/yahyamohnd/Desktop/vrital_web"
BACKEND_DIR = os.path.join(WORKSPACE_ROOT, "backend")
UPLOADS_DIR = os.path.join(BACKEND_DIR, "uploads")
DB_PATH = os.path.join(BACKEND_DIR, "vrital_dev.db")
MEDIA_SOURCE_DIR = "/Users/yahyamohnd/.gemini/antigravity-ide/brain/be5a2802-be6c-412e-bf95-8fb26e9fe8d3/.user_uploaded"

# Live API Configuration
API_BASE_URL = "https://vrital-api.onrender.com/api/v1"
ADMIN_EMAIL = "admin@vrital.com"
ADMIN_PASSWORD = "admin123"

# Product Data Definitions
CUSTOM_PRODUCTS = [
    {
        "local_image_name": "media_1787066657980.jpg",
        "ext": "jpg",
        "name": "Zara Draped Asymmetric Midi Dress",
        "description": "An elegant sleeveless draped midi dress in deep chocolate brown, featuring an asymmetric hem and defined waistband.",
        "price": 145000.00,
        "brand_slug": "zara",
        "category_name": "Dresses",
        "gender": "women",
        "fabric_type": "Satin Crepe",
        "color": "بني / Brown",
        "garment_length": "120 سم",
        "care_instructions": "تنظيف جاف فقط",
        "material_details": "بوليستر 100%",
        "origin_country": "البرتغال / Portugal",
        "garment_weight": "خفيف",
        "sleeve_length": "بدون أكمام",
        "lining": "مبطن بالكامل",
        "closure_type": "سحاب جانبي مخفي",
        "mood_aesthetic": "Stealth Wealth",
        "occasion": "Cocktail Party",
        "editorial_tags": "Evening Elegance, Draped"
    },
    {
        "local_image_name": "media_1787066664623.jpg",
        "ext": "jpg",
        "name": "Gucci Red Velvet Double-Breasted Blazer",
        "description": "A luxurious double-breasted blazer in vibrant red velvet, featuring peak lapels, flap pockets, and structured shoulders. Made in Italy.",
        "price": 2450000.00,
        "brand_slug": "gucci",
        "category_name": "Outerwear",
        "gender": "unisex",
        "fabric_type": "Premium Velvet",
        "color": "أحمر / Red",
        "garment_length": "72 سم",
        "care_instructions": "تنظيف جاف فقط",
        "material_details": "مخمل قطن 100%، بطانة حرير",
        "origin_country": "إيطاليا / Italy",
        "garment_weight": "ثقيل",
        "sleeve_length": "أكمام طويلة",
        "lining": "مبطن بالكامل",
        "closure_type": "أزرار مزدوجة",
        "mood_aesthetic": "Avant-Garde",
        "occasion": "Formal, Gala",
        "editorial_tags": "Gala Nights, Velvet Luxe"
    },
    {
        "local_image_name": "media_1787066673087.png",
        "ext": "png",
        "name": "Zara Oversized Sky Blue Poplin Shirt",
        "description": "A relaxed, oversized poplin shirt in a fresh sky blue tone. Timeless and versatile for any occasion.",
        "price": 85000.00,
        "brand_slug": "zara",
        "category_name": "Tops",
        "gender": "unisex",
        "fabric_type": "100% Poplin Cotton",
        "color": "أزرق فاتح / Light Blue",
        "garment_length": "78 سم",
        "care_instructions": "غسيل يدوي أو تنظيف جاف",
        "material_details": "قطن عضوي 100%",
        "origin_country": "تركيا / Turkey",
        "garment_weight": "خفيف",
        "sleeve_length": "أكمام طويلة",
        "lining": "غير مبطن",
        "closure_type": "أزرار أمامية",
        "mood_aesthetic": "Cozy Minimalism",
        "occasion": "Daily Outing",
        "editorial_tags": "Minimalist Core, Summer Essential"
    },
    {
        "local_image_name": "media_1787066687201.jpg",
        "ext": "jpg",
        "name": "H&M Botanical Print Maxi Dress",
        "description": "A flowing long-sleeve maxi dress in a beautiful blue and white botanical print, with a gathered waist and v-neckline.",
        "price": 110000.00,
        "brand_slug": "hm",
        "category_name": "Dresses",
        "gender": "women",
        "fabric_type": "Viscose Blend",
        "color": "أزرق وأبيض / Blue & White",
        "garment_length": "135 سم",
        "care_instructions": "غسيل يدوي بماء بارد",
        "material_details": "فيسكوز 100%",
        "origin_country": "الهند / India",
        "garment_weight": "خفيف",
        "sleeve_length": "أكمام طويلة",
        "lining": "مبطن جزئياً",
        "closure_type": "سحاب خلفي",
        "mood_aesthetic": "Minimalist Core",
        "occasion": "Daily Outing",
        "editorial_tags": "Spring Garden, Botanical"
    },
    {
        "local_image_name": "media_1787066719656.jpg",
        "ext": "jpg",
        "name": "Zara Off-White Ruffled One-Shoulder Mini Dress",
        "description": "An elegant one-shoulder mini dress with cascading ruffle detail in off-white. Perfect for parties.",
        "price": 165000.00,
        "brand_slug": "zara",
        "category_name": "Dresses",
        "gender": "women",
        "fabric_type": "Poly Chiffon",
        "color": "أوف وايت / Cream Off-White",
        "garment_length": "82 سم",
        "care_instructions": "تنظيف جاف فقط",
        "material_details": "كتان 50%، بوليستر 50%",
        "origin_country": "البرتغال / Portugal",
        "garment_weight": "خفيف",
        "sleeve_length": "كتف واحد",
        "lining": "مبطن بالكامل",
        "closure_type": "سحاب جانبي مخفي",
        "mood_aesthetic": "Evening Elegance",
        "occasion": "Cocktail Party",
        "editorial_tags": "Party Glam, Statement Ruffle"
    }
]

def get_live_token():
    print("Logging in to live Render production backend...")
    try:
        r = requests.post(f"{API_BASE_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
        if r.status_code == 200:
            token = r.json().get("access_token")
            print("Successfully authenticated with live API!")
            return token
        else:
            print(f"Login failed: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"Could not connect to live production backend (server might be down or sleeping): {e}")
    return None

def get_live_mappings(token):
    headers = {"Authorization": f"Bearer {token}"}
    brand_map = {}
    cat_map = {}
    try:
        # Brands
        r_brands = requests.get(f"{API_BASE_URL}/brands", headers=headers, timeout=20)
        brands = r_brands.json() if r_brands.status_code == 200 else []
        if isinstance(brands, dict):
            brands = brands.get("items", brands.get("results", brands))
        brand_map = {b["slug"]: b["id"] for b in brands if "slug" in b}

        # Categories
        r_cats = requests.get(f"{API_BASE_URL}/categories", headers=headers, timeout=20)
        cats = r_cats.json() if r_cats.status_code == 200 else []
        if isinstance(cats, dict):
            cats = cats.get("items", cats.get("results", cats))
        cat_map = {c["name"].lower(): c["id"] for c in cats if "name" in c}
    except Exception as e:
        print(f"Error fetching live mappings: {e}")
    return brand_map, cat_map

def upload_image_to_live(token, file_path):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        with open(file_path, "rb") as f:
            files = {"file": (os.path.basename(file_path), f, "image/jpeg" if file_path.endswith(".jpg") else "image/png")}
            r = requests.post(f"{API_BASE_URL}/upload", files=files, headers=headers, timeout=40)
            if r.status_code in (200, 201):
                url = r.json().get("url")
                print(f"Successfully uploaded image to live backend: {url}")
                return url
            else:
                print(f"Failed to upload image to live backend: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"Error uploading image to live backend: {e}")
    return None

def create_product_live(token, payload):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    try:
        r = requests.post(f"{API_BASE_URL}/products", json=payload, headers=headers, timeout=25)
        if r.status_code in (200, 201):
            prod = r.json()
            print(f"Successfully created product '{payload['name']}' on live server (ID: {prod.get('id')})")
            return prod.get("id")
        else:
            print(f"Failed to create product on live server: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"Error creating product on live server: {e}")
    return None

def get_local_mappings():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT slug, id FROM brands")
    brand_map = {row[0]: row[1] for row in cursor.fetchall()}
    
    cursor.execute("SELECT name, id FROM categories")
    cat_map = {row[0].lower(): row[1] for row in cursor.fetchall()}
    
    conn.close()
    return brand_map, cat_map

def save_product_locally(prod_id, p, brand_id, category_id, local_img_url):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        # Check if already exists by name
        cursor.execute("SELECT id FROM products WHERE name = ?", (p["name"],))
        existing = cursor.fetchone()
        if existing:
            # Delete existing to prevent duplication
            old_id = existing[0]
            cursor.execute("DELETE FROM product_sizes WHERE product_id = ?", (old_id,))
            cursor.execute("DELETE FROM products WHERE id = ?", (old_id,))
            print(f"Removed duplicate product locally: {p['name']}")

        cursor.execute("""
            INSERT INTO products (
                id, name, description, price, currency, brand_id, category_id, gender,
                main_image_url, fabric_type, size_type, stock_quantity, is_active,
                editorial_tags, storytelling_title, storytelling_description, mood_aesthetic,
                occasion, garment_length, care_instructions, color, material_details,
                origin_country, garment_weight, sleeve_length, lining, closure_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            prod_id, p["name"], p["description"], p["price"], "IQD",
            brand_id, category_id, p["gender"],
            local_img_url, p["fabric_type"], "XS/S/M/L/XL", 75,
            1, p["editorial_tags"], p["name"], p["description"],
            p["mood_aesthetic"], p["occasion"], p["garment_length"], p["care_instructions"],
            p["color"], p["material_details"], p["origin_country"], p["garment_weight"],
            p["sleeve_length"], p["lining"], p["closure_type"]
        ))

        # Insert Standard Sizes
        sizes = ["XS", "S", "M", "L", "XL"]
        for size in sizes:
            cursor.execute("""
                INSERT INTO product_sizes (product_id, size, stock)
                VALUES (?, ?, ?)
            """, (prod_id, size, 15))

        conn.commit()
        print(f"Successfully saved product locally: {p['name']} (ID: {prod_id})")
    except Exception as e:
        print(f"Local database insert failed for '{p['name']}': {e}")
    finally:
        conn.close()

def main():
    print("=== Upload and Seeding Script Started ===")
    
    # 1. Local Mappings
    local_brand_map, local_cat_map = get_local_mappings()
    print(f"Local Brands: {local_brand_map}")
    print(f"Local Categories: {local_cat_map}")

    # 2. Live Authentication
    token = get_live_token()
    live_brand_map, live_cat_map = ({}, {})
    if token:
        live_brand_map, live_cat_map = get_live_mappings(token)
        print(f"Live Brands: {live_brand_map}")
        print(f"Live Categories: {live_cat_map}")
    else:
        print("Will skip live upload as server is unreachable.")

    # Make sure uploads directory exists
    os.makedirs(UPLOADS_DIR, exist_ok=True)

    for p in CUSTOM_PRODUCTS:
        print(f"\nProcessing: {p['name']}...")
        
        # Local source file path
        source_file = os.path.join(MEDIA_SOURCE_DIR, p["local_image_name"])
        if not os.path.exists(source_file):
            print(f"Error: Source file not found: {source_file}")
            continue

        # Generate unique UUID for product/image
        prod_id = str(uuid.uuid4())
        dest_filename = f"{prod_id}.{p['ext']}"
        dest_file_path = os.path.join(UPLOADS_DIR, dest_filename)

        # Copy file locally
        shutil.copy2(source_file, dest_file_path)
        print(f"Copied image locally to backend/uploads/{dest_filename}")
        
        # Determine local URL
        local_img_url = f"/uploads/{dest_filename}"
        
        # Fetch local IDs
        l_brand_id = local_brand_map.get(p["brand_slug"])
        l_cat_id = local_cat_map.get(p["category_name"].lower())

        if not l_brand_id or not l_cat_id:
            print(f"Local brand or category not found for: brand={p['brand_slug']}, cat={p['category_name']}")
            continue

        # Save local database record
        save_product_locally(prod_id, p, l_brand_id, l_cat_id, local_img_url)

        # 3. Live Server Upload
        if token:
            live_brand_id = live_brand_map.get(p["brand_slug"])
            live_cat_id = live_cat_map.get(p["category_name"].lower())
            
            if live_brand_id and live_cat_id:
                print(f"Uploading image to live server...")
                live_img_url = upload_image_to_live(token, dest_file_path)
                if live_img_url:
                    payload = {
                        "name": p["name"],
                        "description": p["description"],
                        "price": p["price"],
                        "currency": "IQD",
                        "brand_id": live_brand_id,
                        "category_id": live_cat_id,
                        "gender": p["gender"],
                        "main_image_url": live_img_url,
                        "angles_images_url": live_img_url,
                        "fabric_type": p["fabric_type"],
                        "size_type": "XS/S/M/L/XL",
                        "stock_quantity": 75,
                        "editorial_tags": p["editorial_tags"],
                        "storytelling_title": p["name"],
                        "storytelling_description": p["description"],
                        "mood_aesthetic": p["mood_aesthetic"],
                        "occasion": p["occasion"],
                        "garment_length": p["garment_length"],
                        "care_instructions": p["care_instructions"],
                        "color": p["color"],
                        "material_details": p["material_details"],
                        "origin_country": p["origin_country"],
                        "garment_weight": p["garment_weight"],
                        "sleeve_length": p["sleeve_length"],
                        "lining": p["lining"],
                        "closure_type": p["closure_type"],
                        "sizes": [
                            {"size": "XS", "stock": 15},
                            {"size": "S", "stock": 15},
                            {"size": "M", "stock": 15},
                            {"size": "L", "stock": 15},
                            {"size": "XL", "stock": 15}
                        ]
                    }
                    create_product_live(token, payload)
            else:
                print(f"Skipping live creation of '{p['name']}' due to missing brand/category mappings on production.")
        else:
            print("Skipped live upload (no token).")

    print("\n=== All items processed successfully! ===")

if __name__ == "__main__":
    main()

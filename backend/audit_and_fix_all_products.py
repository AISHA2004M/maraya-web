import urllib.request
import json
import sqlite3

API_BASE_URL = "https://vrital-api-1yxc.onrender.com/api/v1"
LOGIN_URL = f"{API_BASE_URL}/auth/login"
EMAIL = "admin@vrital.com"
PASSWORD = "admin123"

# Definitive 100% Unique & Verified Product Mappings
PRODUCT_AUDIT_MAP = [
    # ── GUCCI ─────────────────────────────────────────────────────────────
    {
        "search_name": "Gucci Tailored Beige Trousers",
        "name": "Gucci Tailored Beige Trousers",
        "description": "Luxury tailored beige trousers in a premium cotton-silk blend, with clean minimalist drape. Made in Italy.",
        "main_image_url": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800",
        "color": "بيج / Beige",
        "fabric_type": "Cotton Silk Blend"
    },
    {
        "search_name": "Gucci GG Canvas Trench Coat",
        "name": "Gucci GG Canvas Trench Coat",
        "description": "A double-breasted trench coat in camel GG canvas, featuring leather buttons, waist belt, and signature silk lining.",
        "main_image_url": "https://images.unsplash.com/photo-1544441893-675973e31985?w=800",
        "color": "بيج جملي / Camel GG",
        "fabric_type": "GG Jacquard Canvas"
    },
    {
        "search_name": "Gucci Silk Crepe Bow Blouse",
        "name": "Gucci Silk Crepe Bow Blouse",
        "description": "A delicate silk crepe de chine blouse in off-white, adorned with a self-tie neck bow and GG mother-of-pearl buttons.",
        "main_image_url": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
        "color": "أوف وايت / Off-white",
        "fabric_type": "Silk Crepe"
    },

    # ── ZARA ──────────────────────────────────────────────────────────────
    {
        "search_name": "Zara Double-Breasted Linen Blazer",
        "name": "Zara Double-Breasted Linen Blazer",
        "description": "A tailored linen-blend blazer in off-white. Features lapel collar, long sleeves, and double-breasted button fastening.",
        "main_image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
        "color": "أبيض عاجي / Off-white",
        "fabric_type": "Linen Blend"
    },
    {
        "search_name": "Zara Abstract Print Satin Shirt",
        "name": "Zara Abstract Print Satin Shirt",
        "description": "A flowing satin-finish shirt with an abstract monochromatic print. Relaxed fit, camp collar, short sleeves.",
        "main_image_url": "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800",
        "color": "أبيض وأسود / Monochrome",
        "fabric_type": "Satin Viscose"
    },
    {
        "search_name": "Zara Silk-Effect Draped Blouse",
        "name": "Zara Silk-Effect Draped Blouse",
        "description": "A high-neck satin-effect draped blouse in emerald green. Features long sleeves and fluid fabric.",
        "main_image_url": "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800",
        "color": "أخضر زمردي / Emerald Green",
        "fabric_type": "Satin Poly"
    },
    {
        "search_name": "Zara Pleated Cropped Trousers",
        "name": "Zara Pleated Cropped Trousers",
        "description": "Relaxed fit trousers in cream white. Features front pleats, cropped hem, and side pockets.",
        "main_image_url": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800",
        "color": "أبيض كريمي / Cream White",
        "fabric_type": "Fluid Poly-Blend"
    },

    # ── H&M ───────────────────────────────────────────────────────────────
    {
        "search_name": "H&M Tailored Tweed Jacket",
        "name": "H&M Tailored Tweed Jacket",
        "description": "A collarless tweed jacket in cream and black woven pattern. Features decorative metal buttons and frayed edges.",
        "main_image_url": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800",
        "color": "تود كريمي وأسود / Tweed",
        "fabric_type": "Tweed Blend"
    },
    {
        "search_name": "H&M High Waisted Tailored Trousers",
        "name": "H&M High Waisted Tailored Trousers",
        "description": "Tailored trousers with a high waist, wide legs, and side pockets. Clean pleated front in charcoal grey.",
        "main_image_url": "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800",
        "color": "رمادي داكن / Charcoal Grey",
        "fabric_type": "Tailored Poly-Blend"
    },
    {
        "search_name": "H&M Rib-Knit Dress",
        "name": "H&M Rib-Knit Dress",
        "description": "A midi rib-knit dress in camel brown. Features long sleeves and a soft body-hugging silhouette.",
        "main_image_url": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
        "color": "بني جملي / Camel Brown",
        "fabric_type": "Rib-Knit Blend"
    }
]

def login():
    try:
        data = json.dumps({"email": EMAIL, "password": PASSWORD}).encode("utf-8")
        req = urllib.request.Request(
            LOGIN_URL,
            data=data,
            headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            return res_data.get("access_token")
    except Exception as e:
        print(f"Login failed: {e}")
        return None

def get_all_live_products(token):
    try:
        req = urllib.request.Request(
            f"{API_BASE_URL}/products?limit=100",
            headers={"Authorization": f"Bearer {token}", "User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode("utf-8"))
    except Exception as e:
        print(f"Failed to fetch live products: {e}")
        return []

def update_product_live(token, prod_id, payload):
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{API_BASE_URL}/products/{prod_id}",
            data=data,
            method="PATCH",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0"
            }
        )
        with urllib.request.urlopen(req) as res:
            print(f"Successfully updated product {prod_id} ({payload.get('name')})")
            return True
    except Exception as e:
        print(f"Failed to update product {prod_id}: {e}")
        return False

def audit_and_fix():
    token = login()
    if not token:
        print("Auth failed.")
        return
        
    prods = get_all_live_products(token)
    print(f"Auditing {len(prods)} products in production...")
    
    prod_map_by_name = {p["name"]: p["id"] for p in prods}
    
    for item in PRODUCT_AUDIT_MAP:
        search_name = item["search_name"]
        if search_name in prod_map_by_name:
            prod_id = prod_map_by_name[search_name]
            payload = {
                "name": item["name"],
                "description": item["description"],
                "main_image_url": item["main_image_url"],
                "angles_images_url": item["main_image_url"],
                "color": item.get("color"),
                "fabric_type": item.get("fabric_type")
            }
            update_product_live(token, prod_id, payload)
        else:
            print(f"Product '{search_name}' not found in live DB.")

    # Local DB update
    try:
        conn = sqlite3.connect("vrital_dev.db")
        cursor = conn.cursor()
        for item in PRODUCT_AUDIT_MAP:
            cursor.execute("""
                UPDATE products
                SET name = ?, description = ?, main_image_url = ?, color = ?, fabric_type = ?
                WHERE name = ?
            """, (item["name"], item["description"], item["main_image_url"], item.get("color"), item.get("fabric_type"), item["search_name"]))
            
        cursor.execute("DELETE FROM tryon_sessions") # Clear all tryon cache
        conn.commit()
        conn.close()
        print("Successfully updated local DB and cleared try-on cache.")
    except Exception as e:
        print(f"Local DB update error: {e}")

if __name__ == "__main__":
    audit_and_fix()

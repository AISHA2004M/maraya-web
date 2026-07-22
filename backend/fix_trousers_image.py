import urllib.request
import json
import sqlite3

API_BASE_URL = "https://vrital-api-1yxc.onrender.com/api/v1"
LOGIN_URL = f"{API_BASE_URL}/auth/login"
EMAIL = "admin@vrital.com"
PASSWORD = "admin123"

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

def fix_trousers():
    token = login()
    if not token:
        print("Auth failed.")
        return
        
    prods = get_all_live_products(token)
    for p in prods:
        if p["name"] == "Zara Pleated Cropped Trousers":
            prod_id = p["id"]
            payload = {
                "name": "Zara Pleated Cropped Trousers",
                "description": "Relaxed fit trousers in cream white. Features front pleats, cropped hem, and side pockets.",
                "main_image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800",
                "angles_images_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800",
                "color": "أبيض كريمي / Cream White",
                "fabric_type": "Fluid Poly-Blend"
            }
            update_product_live(token, prod_id, payload)
            break

    # Local DB update
    try:
        conn = sqlite3.connect("vrital_dev.db")
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE products
            SET main_image_url = 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
                angles_images_url = 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800'
            WHERE name = 'Zara Pleated Cropped Trousers'
        """)
        cursor.execute("DELETE FROM tryon_sessions")
        conn.commit()
        conn.close()
        print("Successfully updated local DB for Zara Pleated Cropped Trousers and cleared try-on cache.")
    except Exception as e:
        print(f"Local DB error: {e}")

if __name__ == "__main__":
    fix_trousers()

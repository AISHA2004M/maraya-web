import urllib.request
import json
import sqlite3

API_BASE_URL = "https://vrital-api-1yxc.onrender.com/api/v1"
LOGIN_URL = f"{API_BASE_URL}/auth/login"
EMAIL = "admin@vrital.com"
PASSWORD = "admin123"

OLD_TROUSERS_ID = "38aa9ff5-b139-4a73-853b-cf2f9b5509a1"

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

def delete_product_live(token, prod_id):
    try:
        req = urllib.request.Request(
            f"{API_BASE_URL}/products/{prod_id}",
            method="DELETE",
            headers={
                "Authorization": f"Bearer {token}",
                "User-Agent": "Mozilla/5.0"
            }
        )
        with urllib.request.urlopen(req) as res:
            print(f"Successfully deleted live mismatched product: {prod_id}")
            return True
    except Exception as e:
        print(f"Failed to delete live product {prod_id}: {e}")
        return False

def create_suit_live(token):
    payload = {
        "name": "Checked Wool Three-Piece Suit",
        "description": "A tailored men's three-piece suit featuring a classic blue check pattern, matching vest, and trousers.",
        "price": 185.00,
        "brand_id": 13, # Zara
        "category_id": 20, # Outerwear
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600",
        "angles_images_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600",
        "stock_quantity": 30,
        "fabric_type": "Wool Blend",
        "size_type": "S/M/L/XL",
        "editorial_tags": "Classic Checked, Tailored",
        "storytelling_title": "The Checked Prestige",
        "storytelling_description": "Crafted from fine Italian checked wool, this three-piece suit represents classic sartorial styling.",
        "mood_aesthetic": "Stealth Wealth",
        "occasion": "Formal, Business",
        "sizes": [
            {"size": "S", "stock": 10},
            {"size": "M", "stock": 10},
            {"size": "L", "stock": 10}
        ]
    }
    
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{API_BASE_URL}/products",
            data=data,
            method="POST",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0"
            }
        )
        with urllib.request.urlopen(req) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            new_id = res_data.get("id")
            print(f"Successfully created product 'Checked Wool Three-Piece Suit'. New ID: {new_id}")
            return new_id
    except Exception as e:
        print(f"Failed to create product: {e}")
        return None

def update_local_db():
    try:
        conn = sqlite3.connect("vrital_dev.db")
        cursor = conn.cursor()
        
        # Update details using parameterized placeholders
        cursor.execute("""
            UPDATE products
            SET name = ?,
                description = ?,
                gender = ?,
                category_id = ?,
                fabric_type = ?,
                size_type = ?,
                editorial_tags = ?,
                storytelling_title = ?,
                storytelling_description = ?,
                mood_aesthetic = ?,
                occasion = ?
            WHERE id = ?
        """, (
            "Checked Wool Three-Piece Suit",
            "A tailored men's three-piece suit featuring a classic blue check pattern, matching vest, and trousers.",
            "men",
            5, # Outerwear
            "Wool Blend",
            "S/M/L/XL",
            "Classic Checked, Tailored",
            "The Checked Prestige",
            "Crafted from fine Italian checked wool.",
            "Stealth Wealth",
            "Formal",
            "949d64fd-36ca-40c3-bd34-4c41bd809424"
        ))
        
        # Clear try-on sessions of this product locally to clear cache
        cursor.execute("DELETE FROM tryon_sessions WHERE product_id = '949d64fd-36ca-40c3-bd34-4c41bd809424'")
        
        conn.commit()
        conn.close()
        print("Successfully updated local SQLite database row and cleared tryon session cache.")
    except Exception as e:
        print(f"Local database update failed: {e}")

if __name__ == "__main__":
    token = login()
    if token:
        print("Logged in successfully.")
        # Delete old product if it exists
        delete_product_live(token, OLD_TROUSERS_ID)
        # Create Checked Wool Three-Piece Suit
        create_suit_live(token)
        # Sync local DB
        update_local_db()
    else:
        print("Authentication failed.")

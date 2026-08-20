import urllib.request
import json
import sqlite3

API_BASE_URL = "https://vrital-api.onrender.com/api/v1"
LOGIN_URL = f"{API_BASE_URL}/auth/login"
EMAIL = "admin@vrital.com"
PASSWORD = "admin123"

OLD_GUCCI_ID = "3ca66981-8804-4605-ba9b-6958c66dd8b3"

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

def create_gucci_joggers_live(token):
    payload = {
        "name": "Gucci Tailored Beige Trousers",
        "description": "Luxury tailored beige trousers in a premium cotton-silk blend, with clean minimalist drape and subtle side web detail. Made in Italy.",
        "price": 1200000.00,
        "currency": "IQD",
        "brand_id": 16, # Gucci
        "category_id": 19, # Bottoms
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
        "angles_images_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
        "stock_quantity": 10,
        "fabric_type": "Cotton Silk Blend",
        "size_type": "S/M/L",
        "editorial_tags": "Stealth Wealth, Italian Tailoring",
        "storytelling_title": "Heritage Track Luxury",
        "storytelling_description": "Woven with fine Italian cotton-silk blend, these trousers unite archive codes with modern luxury tailoring.",
        "mood_aesthetic": "Stealth Wealth",
        "occasion": "Casual Luxury, Travel",
        "garment_length": "100 سم",
        "care_instructions": "تنظيف جاف يفضل",
        "color": "بيج / Beige",
        "material_details": "قطن 70%، حرير 30%",
        "origin_country": "إيطاليا / Italy",
        "sizes": [
            {"size": "S", "stock": 3},
            {"size": "M", "stock": 4},
            {"size": "L", "stock": 3}
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
            print(f"Successfully created product 'Gucci Tailored Beige Trousers'. New ID: {new_id}")
            return new_id
    except Exception as e:
        print(f"Failed to create product: {e}")
        return None

def update_local_db():
    try:
        conn = sqlite3.connect("vrital_dev.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE products
            SET name = ?,
                description = ?,
                main_image_url = ?,
                fabric_type = ?,
                color = ?,
                material_details = ?
            WHERE id = ?
        """, (
            "Gucci Tailored Beige Trousers",
            "Luxury tailored beige trousers in a premium cotton-silk blend with clean minimalist drape. Made in Italy.",
            "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
            "Cotton Silk Blend",
            "بيج / Beige",
            "قطن 70%، حرير 30%",
            "3ca66981-8804-4605-ba9b-6958c66dd8b3"
        ))
        
        cursor.execute("DELETE FROM tryon_sessions WHERE product_id = '3ca66981-8804-4605-ba9b-6958c66dd8b3'")
        
        conn.commit()
        conn.close()
        print("Successfully updated local SQLite database row and cleared tryon session cache.")
    except Exception as e:
        print(f"Local database update failed: {e}")

if __name__ == "__main__":
    token = login()
    if token:
        print("Logged in successfully.")
        delete_product_live(token, OLD_GUCCI_ID)
        create_gucci_joggers_live(token)
        update_local_db()
    else:
        print("Authentication failed.")

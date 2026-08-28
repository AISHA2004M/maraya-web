"""
Vrital Platform — Production Product Reseeder Script
====================================================
Uploads curated products to the live production or staging API.
All images reference isolated directories in Supabase Storage.

Usage:
    python scripts/reseed_products.py
"""

import os
import requests
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("reseed")

API_BASE = os.getenv("API_BASE_URL", "https://vrital-api.onrender.com/api/v1")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@vrital.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
SUPABASE_STORAGE_URL = os.getenv(
    "SUPABASE_STORAGE_URL",
    "https://fyxpczacexydrzpqipfy.supabase.co/storage/v1/object/public/Maraya-image"
)


def get_auth_token():
    logger.info(f"Authenticating with {API_BASE}/auth/login...")
    res = requests.post(f"{API_BASE}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if res.status_code != 200:
        raise RuntimeError(f"Authentication failed ({res.status_code}): {res.text}")
    return res.json()["access_token"]


def reseed_catalog():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Fetch brands and categories mapping
    brands_res = requests.get(f"{API_BASE}/products/brands/all")
    categories_res = requests.get(f"{API_BASE}/products/categories/all")

    if brands_res.status_code != 200 or categories_res.status_code != 200:
        raise RuntimeError("Failed to fetch brands/categories from API.")

    brand_map = {b["slug"]: b["id"] for b in brands_res.json()}
    cat_map = {c["name"]: c["id"] for c in categories_res.json()}

    logger.info(f"Found {len(brand_map)} brands and {len(cat_map)} categories.")
    logger.info("Reseed script initialized successfully.")


if __name__ == "__main__":
    reseed_catalog()

"""
reseed_render.py - Re-uploads all products to the Render production backend.
Run with: python reseed_render.py
"""
import requests

RENDER_BASE = "https://vrital-api.onrender.com/api/v1"
ADMIN_EMAIL = "admin@vrital.com"
ADMIN_PASSWORD = "admin123"

PRODUCTS = [
    # ── ZARA ──────────────────────────────────────────────────────────────────
    {
        "name": "Zara Oversized Sky Blue Poplin Shirt",
        "description": "A relaxed, oversized poplin shirt in a fresh sky blue tone. Timeless and versatile for any occasion.",
        "price": 85000,
        "brand_slug": "zara", "category_name": "Tops", "gender": "unisex",
        "main_image_url": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
        "stock_quantity": 60, "fabric_type": "100% Poplin Cotton", "size_type": "XS/S/M/L/XL",
        "editorial_tags": "Minimalist Core, Summer Essential", "mood_aesthetic": "Cozy Minimalism", "occasion": "Daily Outing",
        "storytelling_title": "The Sky Blue Edit",
        "storytelling_description": "Crafted from crisp poplin cotton in a relaxed oversized silhouette.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40093-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600,https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600",
    },
    {
        "name": "Zara Off-White Ruffled One-Shoulder Mini Dress",
        "description": "An elegant one-shoulder mini dress with cascading ruffle detail in off-white. Perfect for parties.",
        "price": 165000,
        "brand_slug": "zara", "category_name": "Dresses", "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1566206091558-7f218b696731?auto=format&fit=crop&w=600&q=80",
        "stock_quantity": 35, "fabric_type": "Poly Chiffon", "size_type": "XS/S/M/L",
        "editorial_tags": "Party Glam, Statement Ruffle", "mood_aesthetic": "Evening Elegance", "occasion": "Cocktail Party",
        "storytelling_title": "The Ruffle Narrative",
        "storytelling_description": "One shoulder, cascading ruffles. Off-white chiffon catches the light with every step.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40093-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1566206091558-7f218b696731?w=600,https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600",
    },
    {
        "name": "Zara Dark Chocolate Tube Midi Dress",
        "description": "A sleek, form-fitting tube midi dress in deep chocolate brown. Minimal and chic.",
        "price": 120000,
        "brand_slug": "zara", "category_name": "Dresses", "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80",
        "stock_quantity": 40, "fabric_type": "Stretch Jersey", "size_type": "XS/S/M/L",
        "editorial_tags": "Minimalist Core, Evening Edit", "mood_aesthetic": "Stealth Wealth", "occasion": "Evening Outing",
        "storytelling_title": "The Chocolate Silhouette",
        "storytelling_description": "A body-skimming tube cut in sumptuous chocolate jersey.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40093-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600,https://images.unsplash.com/photo-1566206091558-7f218b696731?w=600",
    },
    {
        "name": "Linen Halter Jumpsuit",
        "description": "Elegant white linen sleeveless halter jumpsuit, perfect for summer days.",
        "price": 89990,
        "brand_slug": "zara", "category_name": "Dresses", "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1566206091558-7f218b696731?w=600",
        "stock_quantity": 50, "fabric_type": "Linen Blend", "size_type": "S/M/L",
        "editorial_tags": "Summer Atelier, Minimalist Core", "mood_aesthetic": "Minimalist Core", "occasion": "Daily Outing",
        "storytelling_title": "The Summer Linen Silhouette",
        "storytelling_description": "A modern halter-neck jumpsuit crafted from light organic linen twill.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40093-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1566206091558-7f218b696731?w=600,https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600",
    },
    {
        "name": "Slim Fit Chinos",
        "description": "Tailored slim-fit chino trousers in khaki.",
        "price": 59990,
        "brand_slug": "zara", "category_name": "Bottoms", "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600",
        "stock_quantity": 80, "fabric_type": "Stretch Cotton", "size_type": "28/30/32/34/36",
        "editorial_tags": "Minimalist Core, Everyday Luxury", "mood_aesthetic": "Stealth Wealth", "occasion": "Smart Casual",
        "storytelling_title": "The Contoured Trousers",
        "storytelling_description": "Tailored chinos cut from brushed organic cotton twill.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40093-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600,https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600",
    },
    # ── NIKE ──────────────────────────────────────────────────────────────────
    {
        "name": "Air Max Sneakers",
        "description": "Iconic Nike Air Max for street and sport.",
        "price": 139990,
        "brand_slug": "nike", "category_name": "Clothing", "gender": "unisex",
        "main_image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
        "stock_quantity": 60, "fabric_type": "Mesh/Synthetic", "size_type": "US 6-14",
        "editorial_tags": "Cyber Streetwear, Avant-Garde", "mood_aesthetic": "Avant-Garde", "occasion": "Active Urban",
        "storytelling_title": "Velocity & Stature",
        "storytelling_description": "Futurism meets utility.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-neon-lights-40081-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600,https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600",
    },
    {
        "name": "Tech Fleece Hoodie",
        "description": "Lightweight tech fleece pullover hoodie for performance and style.",
        "price": 109990,
        "brand_slug": "nike", "category_name": "Outerwear", "gender": "unisex",
        "main_image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600",
        "stock_quantity": 80, "fabric_type": "Tech Fleece", "size_type": "XS/S/M/L/XL",
        "editorial_tags": "Streetwear, Athletic Luxe", "mood_aesthetic": "Avant-Garde", "occasion": "Active Urban",
        "storytelling_title": "The Athletic Layer",
        "storytelling_description": "Engineered fleece that moves with you.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-neon-lights-40081-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600,https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
    },
    {
        "name": "Windrunner Jacket",
        "description": "Iconic Nike Windrunner with bold color-block design and lightweight woven fabric.",
        "price": 119990,
        "brand_slug": "nike", "category_name": "Outerwear", "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600",
        "stock_quantity": 50, "fabric_type": "Ripstop Nylon", "size_type": "XS/S/M/L/XL",
        "editorial_tags": "Sporty Luxe, Streetwear", "mood_aesthetic": "Avant-Garde", "occasion": "Active Urban",
        "storytelling_title": "Born to Run",
        "storytelling_description": "Lightweight woven shell with iconic chevron design.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-neon-lights-40081-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600,https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
    },
    # ── H&M ───────────────────────────────────────────────────────────────────
    {
        "name": "Classic White Tee",
        "description": "Essential cotton crew-neck tee in crisp white.",
        "price": 29990,
        "brand_slug": "hm", "category_name": "Tops", "gender": "unisex",
        "main_image_url": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600",
        "stock_quantity": 200, "fabric_type": "100% Cotton", "size_type": "S/M/L/XL/XXL",
        "editorial_tags": "Minimalist Core, Daily Foundations", "mood_aesthetic": "Cozy Minimalism", "occasion": "Daily Outing",
        "storytelling_title": "Structured Simplicity",
        "storytelling_description": "Everyday essentials, elevated.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-light-running-fingers-through-hair-41865-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600,https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600",
    },
    {
        "name": "Denim Jacket",
        "description": "Classic washed denim jacket, a wardrobe staple.",
        "price": 79990,
        "brand_slug": "hm", "category_name": "Outerwear", "gender": "unisex",
        "main_image_url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600",
        "stock_quantity": 70, "fabric_type": "Denim", "size_type": "S/M/L/XL",
        "editorial_tags": "Minimalist Core, Wardrobe Staples", "mood_aesthetic": "Cozy Minimalism", "occasion": "Daily Outing",
        "storytelling_title": "Washed Selvedge",
        "storytelling_description": "Mid-weight selvedge denim, stonewashed in vintage indigo tones.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-light-running-fingers-through-hair-41865-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600,https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600",
    },
    {
        "name": "Floral Wrap Dress",
        "description": "Lightweight floral wrap dress with v-neckline, perfect for warm weather.",
        "price": 49990,
        "brand_slug": "hm", "category_name": "Dresses", "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=600",
        "stock_quantity": 85, "fabric_type": "Woven Viscose", "size_type": "XS/S/M/L/XL",
        "editorial_tags": "Spring Garden, Feminine", "mood_aesthetic": "Minimalist Core", "occasion": "Daily Outing",
        "storytelling_title": "Garden in Bloom",
        "storytelling_description": "Breathable viscose wrap dress printed with botanical florals.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-light-running-fingers-through-hair-41865-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=600,https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600",
    },
    # ── GUCCI ─────────────────────────────────────────────────────────────────
    {
        "name": "Leather Biker Jacket",
        "description": "Premium leather motorcycle jacket with silver hardware.",
        "price": 299990,
        "brand_slug": "gucci", "category_name": "Outerwear", "gender": "unisex",
        "main_image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600",
        "stock_quantity": 25, "fabric_type": "Genuine Leather", "size_type": "S/M/L/XL",
        "editorial_tags": "After Hours, Rock Couture", "mood_aesthetic": "Avant-Garde", "occasion": "Club & Concert",
        "storytelling_title": "The Architectural Biker",
        "storytelling_description": "Cut from premium full-grain steerhide with custom silver-polished zippers.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40093-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600,https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600",
    },
    {
        "name": "Mini Silk Slip Dress",
        "description": "Luxurious silk-satin slip dress in champagne.",
        "price": 199990,
        "brand_slug": "gucci", "category_name": "Dresses", "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600",
        "stock_quantity": 30, "fabric_type": "Silk", "size_type": "XS/S/M/L",
        "editorial_tags": "Evening Elegance, After Hours", "mood_aesthetic": "Stealth Wealth", "occasion": "Cocktail Party",
        "storytelling_title": "The Liquid Silk",
        "storytelling_description": "100% heavy mulberry silk cut on the bias.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40093-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600,https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600",
    },
    {
        "name": "Tailored Trench Coat",
        "description": "Classic double-breasted trench coat in camel with signature Gucci details.",
        "price": 520000,
        "brand_slug": "gucci", "category_name": "Outerwear", "gender": "unisex",
        "main_image_url": "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600",
        "stock_quantity": 12, "fabric_type": "Gabardine", "size_type": "S/M/L/XL",
        "editorial_tags": "Heritage Luxe, Statement Outerwear", "mood_aesthetic": "Stealth Wealth", "occasion": "Business Formal",
        "storytelling_title": "The Italian Trench",
        "storytelling_description": "Double-breasted gabardine in warm camel, lined in signature silk.",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40093-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600,https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600",
    },
]


def get_token():
    print("Logging in as admin...")
    r = requests.post(f"{RENDER_BASE}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=40)
    if r.status_code != 200:
        print(f"Login failed: {r.status_code} {r.text}")
        return None
    token = r.json().get("access_token")
    print("Logged in!")
    return token


def get_brands(token):
    r = requests.get(f"{RENDER_BASE}/brands", timeout=20)
    brands = r.json() if r.status_code == 200 else []
    if isinstance(brands, dict):
        brands = brands.get("items", brands.get("results", []))
    return {b["slug"]: b["id"] for b in brands}


def get_categories(token):
    r = requests.get(f"{RENDER_BASE}/categories", timeout=20)
    cats = r.json() if r.status_code == 200 else []
    if isinstance(cats, dict):
        cats = cats.get("items", cats.get("results", []))
    return {c["name"].lower(): c["id"] for c in cats}


def get_existing_names(token):
    r = requests.get(f"{RENDER_BASE}/products?limit=200", timeout=20)
    if r.status_code != 200:
        return set()
    data = r.json()
    items = data if isinstance(data, list) else data.get("items", data.get("results", []))
    return {p["name"].strip().lower() for p in items}


def main():
    token = get_token()
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}"}
    brand_map = get_brands(token)
    cat_map   = get_categories(token)
    existing  = get_existing_names(token)

    print(f"Brands: {brand_map}")
    print(f"Categories: {cat_map}")
    print(f"Existing products: {len(existing)}")

    ok = skip = fail = 0
    for p in PRODUCTS:
        name = p["name"]
        if name.strip().lower() in existing:
            print(f"Skip (exists): {name}")
            skip += 1
            continue

        brand_id = brand_map.get(p["brand_slug"])
        cat_id   = cat_map.get(p["category_name"].lower())
        if not brand_id or not cat_id:
            print(f"Not found brand/cat for: {name} (brand={p['brand_slug']} cat={p['category_name']})")
            fail += 1
            continue

        payload = {k: v for k, v in p.items() if k not in ("brand_slug", "category_name")}
        payload["brand_id"]    = brand_id
        payload["category_id"] = cat_id

        r = requests.post(f"{RENDER_BASE}/products", json=payload, headers=headers, timeout=25)
        if r.status_code in (200, 201):
            print(f"Uploaded: {name}")
            ok += 1
        else:
            print(f"Failed ({r.status_code}): {name} -> {r.text[:150]}")
            fail += 1

    print(f"\nDone! Uploaded:{ok}  Skipped:{skip}  Failed:{fail}")


if __name__ == "__main__":
    main()

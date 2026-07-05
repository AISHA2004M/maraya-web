"""
Script to update database brands with premium, highly representative fashion images.
Run with: python update_brand_images.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.modules.products.models import Brand

BRAND_UPDATES = {
    "zara": {
        "logo_url": "https://images.unsplash.com/photo-1590845947376-2638caa06a1a?w=400&q=80",
        "banner_url": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&q=80",
        "hero_image_url": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&q=80",
        "story_image_url": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
    },
    "nike": {
        "logo_url": "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80",
        "banner_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600&q=80",
        "hero_image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600&q=80",
        "story_image_url": "https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80"
    },
    "hm": {
        "logo_url": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80",
        "banner_url": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1600&q=80",
        "hero_image_url": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1600&q=80",
        "story_image_url": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1200&q=80"
    },
    "gucci": {
        "logo_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
        "banner_url": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80",
        "hero_image_url": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80",
        "story_image_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80"
    }
}

def update_brands():
    db = SessionLocal()
    try:
        updated_count = 0
        for slug, updates in BRAND_UPDATES.items():
            brand = db.query(Brand).filter(Brand.slug == slug).first()
            if brand:
                brand.logo_url = updates["logo_url"]
                brand.banner_url = updates["banner_url"]
                brand.hero_image_url = updates["hero_image_url"]
                brand.story_image_url = updates["story_image_url"]
                print(f"Updated images for brand: {brand.name}")
                updated_count += 1
            else:
                print(f"Brand not found in database: {slug}")
        db.commit()
        print(f"Successfully updated {updated_count} brands in database!")
    except Exception as e:
        db.rollback()
        print(f"Failed to update brand images: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_brands()

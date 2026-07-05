"""
Script to update database brands with official transparent SVG logos and premium storefront/campaign images.
Run with: python update_brand_images.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.modules.products.models import Brand

BRAND_UPDATES = {
    "zara": {
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg",
        "banner_url": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1600&q=80",
        "hero_image_url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
        "story_image_url": "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80"
    },
    "nike": {
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
        "banner_url": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1600&q=80",
        "hero_image_url": "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1600&q=80",
        "story_image_url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80"
    },
    "hm": {
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg",
        "banner_url": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=80",
        "hero_image_url": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=80",
        "story_image_url": "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1200&q=80"
    },
    "gucci": {
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/0/04/Gucci_logo.svg",
        "banner_url": "https://images.unsplash.com/photo-1583228724456-7ee16af252b4?w=1600&q=80",
        "hero_image_url": "https://images.unsplash.com/photo-1583228724456-7ee16af252b4?w=1600&q=80",
        "story_image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80"
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

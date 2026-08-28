"""
Vrital Platform — Database Seeder Script
========================================
Populates the database with foundational brands, categories, and initial admin/partner accounts.

Usage:
    python -m scripts.seed_db
    or:
    cd backend && python scripts/seed_db.py
"""

import sys
import os
import logging

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, engine, Base
from app.modules.products.models import Brand, Category
from app.modules.users.models import User
from app.core.security import hash_password
import app.db.base  # noqa: F401 — register all SQLAlchemy models

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seeder")

BRANDS = [
    {
        "name": "Zara",
        "slug": "zara",
        "description": "Bold, contemporary street-inspired aesthetics with structured silhouettes and quick-to-market fashion forward edits.",
        "hero_title": "Zara Atelier",
        "hero_subtitle": "Bold, contemporary street-inspired aesthetics with structured silhouettes.",
        "hero_cta_text": "Discover Zara",
        "story_title": "Fast Fashion Reimagined",
        "story_description": "Zara Atelier represents our high-end limited collection edits. Focused on structured silhouettes and bold shapes.",
        "philosophy_title": "Democratic Design",
        "philosophy_text": "We believe high-fashion aesthetics should be accessible to all.",
        "accent_color": "#FFFFFF",
        "font_family": "Montserrat, sans-serif",
    },
    {
        "name": "Nike",
        "slug": "nike",
        "description": "Technological innovation meets high-performance streetwear. Pushing boundaries of movement, form, and performance fashion.",
        "hero_title": "Nike Lab",
        "hero_subtitle": "Technological innovation meets high-performance streetwear.",
        "hero_cta_text": "Explore Nike",
        "story_title": "The Athletic Evolution",
        "story_description": "Engineered with custom technical fabrics and dynamic silhouettes.",
        "philosophy_title": "Performance & Style",
        "philosophy_text": "Design should not compromise performance.",
        "accent_color": "#F3F4F6",
        "font_family": "Hanken Grotesk, sans-serif",
    },
    {
        "name": "Gucci",
        "slug": "gucci",
        "description": "High-luxury Italian craftsmanship, eccentric romance, and unapologetic maximalism.",
        "hero_title": "Gucci Heritage",
        "hero_subtitle": "High-luxury Italian craftsmanship and unapologetic maximalism.",
        "hero_cta_text": "Enter Gucci",
        "story_title": "Florentine Legacy",
        "story_description": "Centuries of leather mastery combined with contemporary opulence.",
        "philosophy_title": "Unapologetic Luxury",
        "philosophy_text": "Fashion as an artistic statement of identity and grandeur.",
        "accent_color": "#D4AF37",
        "font_family": "Bodoni Moda, serif",
    },
    {
        "name": "H&M",
        "slug": "hm",
        "description": "Accessible, versatile Scandinavian minimalism. Modern everyday wardrobe staples designed with sustainability in mind.",
        "hero_title": "H&M Studio",
        "hero_subtitle": "Accessible, versatile Scandinavian minimalism.",
        "hero_cta_text": "Shop H&M",
        "story_title": "Nordic Simplicity",
        "story_description": "Clean lines, relaxed fits, and breathable fabrics designed for everyday wear.",
        "philosophy_title": "Conscious Fashion",
        "philosophy_text": "Sustainable everyday style crafted with thoughtful simplicity.",
        "accent_color": "#F8F6F0",
        "font_family": "Hanken Grotesk, sans-serif",
    },
]

CATEGORIES = ["Tops", "Dresses", "Outerwear", "Bottoms", "Knitwear", "Accessories"]


def seed_database():
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Categories
        logger.info("Seeding categories...")
        cat_map = {}
        for cat_name in CATEGORIES:
            cat = db.query(Category).filter(Category.name == cat_name).first()
            if not cat:
                cat = Category(name=cat_name)
                db.add(cat)
                db.flush()
                logger.info(f"  + Category created: {cat_name}")
            cat_map[cat_name] = cat.id

        # 2. Seed Brands
        logger.info("Seeding brands...")
        brand_map = {}
        for b_data in BRANDS:
            brand = db.query(Brand).filter(Brand.slug == b_data["slug"]).first()
            if not brand:
                brand = Brand(**b_data)
                db.add(brand)
                db.flush()
                logger.info(f"  + Brand created: {b_data['name']}")
            brand_map[b_data["slug"]] = brand.id

        # 3. Seed Admin User
        admin_email = os.getenv("ADMIN_EMAIL", "admin@vrital.com")
        admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                password_hash=hash_password(admin_pass),
                full_name="Platform Administrator",
                role="admin",
                is_active=True,
            )
            db.add(admin)
            logger.info(f"  + Admin account created: {admin_email}")

        # 4. Seed Partner Accounts
        partner_pass = os.getenv("PARTNER_PASSWORD", "partner1234")
        for slug, b_id in brand_map.items():
            p_email = f"{slug}_partner@vrital.com"
            partner = db.query(User).filter(User.email == p_email).first()
            if not partner:
                partner = User(
                    email=p_email,
                    password_hash=hash_password(partner_pass),
                    full_name=f"{slug.capitalize()} Partner Representative",
                    role="partner",
                    brand_id=b_id,
                    is_active=True,
                )
                db.add(partner)
                logger.info(f"  + Partner account created: {p_email}")

        db.commit()
        logger.info("Seeding completed successfully!")

    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {e}", exc_info=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

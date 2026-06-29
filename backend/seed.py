"""
Seed script: populates the database with sample brands, categories, and products.
Run with: python seed.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.modules.products.models import Brand, Category, Product
from app.modules.users.models import User
from app.core.security import hash_password

# Import all models to ensure tables exist
import app.db.base  # noqa

Base.metadata.create_all(bind=engine)

BRANDS = [
    {
        "name": "Zara",
        "slug": "zara",
        "description": "Bold, contemporary street-inspired aesthetics with structured silhouettes and quick-to-market fashion forward edits.",
        "logo_url": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&q=80",
        "banner_url": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80",
        "hero_title": "Zara Atelier",
        "hero_subtitle": "Bold, contemporary street-inspired aesthetics with structured silhouettes.",
        "hero_image_url": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80",
        "hero_cta_text": "Discover Zara",
        "story_title": "Fast Fashion Reimagined",
        "story_description": "Zara Atelier represents our high-end limited collection edits. Focused on structured silhouettes, quick-to-market responsiveness, and bold shapes.",
        "story_image_url": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1200&q=80",
        "philosophy_title": "Democratic Design",
        "philosophy_text": "We believe high-fashion aesthetics should be accessible to all. Our lines are designed with clean structural forms suited for daily modern elegance.",
        "accent_color": "#FFFFFF",
        "font_family": "Montserrat, sans-serif",
        "seasonal_title": "Summer/Spring Edit",
        "seasonal_desc": "Curated lines, premium textures, and contemporary drapes."
    },
    {
        "name": "Nike",
        "slug": "nike",
        "description": "Technological innovation meets high-performance streetwear. Pushing boundaries of movement, form, and performance fashion.",
        "logo_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80",
        "banner_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1600&q=80",
        "hero_title": "Nike Lab",
        "hero_subtitle": "Technological innovation meets high-performance streetwear.",
        "hero_image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1600&q=80",
        "hero_cta_text": "Explore Nike",
        "story_title": "The Athletic Evolution",
        "story_description": "Pushing boundaries of movement, form, and athletic fashion. Engineered with custom technical fabrics and dynamic silhouettes.",
        "story_image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80",
        "philosophy_title": "Performance & Style",
        "philosophy_text": "Design should not compromise performance. Our garments are building blocks for motion and stature in urban spaces.",
        "accent_color": "#F3F4F6",
        "font_family": "Hanken Grotesk, sans-serif",
        "seasonal_title": "Active Tech Campaign",
        "seasonal_desc": "Technical details and raw tailored pieces that bridge the active shift."
    },
    {
        "name": "H&M",
        "slug": "hm",
        "description": "Sustainable essentials and relaxed, accessible contemporary garments designed for modern effortless daily elegance.",
        "logo_url": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=200&q=80",
        "banner_url": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1600&q=80",
        "hero_title": "H&M Edition",
        "hero_subtitle": "Sustainable essentials and relaxed, accessible contemporary garments.",
        "hero_image_url": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1600&q=80",
        "hero_cta_text": "View Edition",
        "story_title": "Conscious Tailoring",
        "story_description": "Essentials stripped of unnecessary details. Made of premium organic cotton, structured stretch chinos, and breathable fabrics.",
        "story_image_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80",
        "philosophy_title": "Sustainability First",
        "philosophy_text": "Designing with tomorrow in mind. Premium tailoring and classic structural forms suited for the modern high fashion enthusiast.",
        "accent_color": "#F7F7F7",
        "font_family": "Hanken Grotesk, sans-serif",
        "seasonal_title": "Sustainable Comfort",
        "seasonal_desc": "Minimalist essentials designed for relaxed, daily elegance."
    },
    {
        "name": "Gucci",
        "slug": "gucci",
        "description": "Renowned Italian luxury fashion house redefining 21st-century luxury through influential, innovative, and progressive design codes.",
        "logo_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=200&q=80",
        "banner_url": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80",
        "hero_title": "Gucci Atelier",
        "hero_subtitle": "Redefining 21st-century luxury through innovative and progressive design codes.",
        "hero_image_url": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80",
        "hero_cta_text": "Enter Gucci",
        "story_title": "The Italian Silhouette",
        "story_description": "A fluid draping narrative designed to float gracefully with movement. Crafted in our Italian ateliers with hand-painted motifs.",
        "story_image_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80",
        "philosophy_title": "Heritage & Drama",
        "philosophy_text": "Style is a deeply personal signature, a silent dialogue between dress and context. We redefine luxury through influential codes.",
        "accent_color": "#FAF5EC",
        "font_family": "Bodoni Moda, serif",
        "seasonal_title": "Autumnal Narrative",
        "seasonal_desc": "Discover structural lines and raw tailored pieces that bridge the seasonal shift."
    },
]

CATEGORIES = [
    {"name": "Clothing", "parent_id": None},
    {"name": "Dresses", "parent_id": 1},
    {"name": "Tops", "parent_id": 1},
    {"name": "Bottoms", "parent_id": 1},
    {"name": "Outerwear", "parent_id": 1},
]

PRODUCTS = [
    {
        "name": "Floral Maxi Dress",
        "description": "Elegant floral print maxi dress, perfect for summer occasions.",
        "price": 89.99,
        "brand_id": 1,
        "category_id": 2,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1566206091558-7f218b696731?w=600",
        "stock_quantity": 50,
        "fabric_type": "Cotton Blend",
        "size_type": "S/M/L/XL",
        "editorial_tags": "Evening Elegance, Seasonal Statement",
        "storytelling_title": "The Botanical Silhouette",
        "storytelling_description": "A fluid draping dress designed to float gracefully with movement. Crafted in our Italian ateliers with hand-painted floral motifs.",
        "mood_aesthetic": "Evening Elegance",
        "occasion": "Cocktail Party",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40093-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1566206091558-7f218b696731?w=600,https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600,https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600,https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600",
    },
    {
        "name": "Classic White Tee",
        "description": "Essential cotton crew-neck tee in crisp white.",
        "price": 29.99,
        "brand_id": 3,
        "category_id": 3,
        "gender": "unisex",
        "main_image_url": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600",
        "stock_quantity": 200,
        "fabric_type": "100% Cotton",
        "size_type": "S/M/L/XL/XXL",
        "editorial_tags": "Minimalist Core, Daily Foundations",
        "storytelling_title": "Structured Simplicity",
        "storytelling_description": "Everyday essentials, elevated. Designed with a custom heavy-weight knit fabric that maintains its clean silhouette throughout the day.",
        "mood_aesthetic": "Cozy Minimalism",
        "occasion": "Daily Outing",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-light-running-fingers-through-hair-41865-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600,https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600,https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600,https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
    },
    {
        "name": "Slim Fit Chinos",
        "description": "Tailored slim-fit chino trousers in khaki.",
        "price": 59.99,
        "brand_id": 1,
        "category_id": 4,
        "gender": "men",
        "main_image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600",
        "stock_quantity": 80,
        "fabric_type": "Stretch Cotton",
        "size_type": "28/30/32/34/36",
        "editorial_tags": "Minimalist Core, Everyday Luxury",
        "storytelling_title": "The Contoured Trousers",
        "storytelling_description": "Tailored chinos cut from brushed organic cotton twill. Features a slight stretch to accommodate comfortable motion without sagging.",
        "mood_aesthetic": "Stealth Wealth",
        "occasion": "Smart Casual",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40093-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600,https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600,https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600,https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600",
    },
    {
        "name": "Air Max Sneakers",
        "description": "Iconic Nike Air Max for street and sport.",
        "price": 139.99,
        "brand_id": 2,
        "category_id": 1,
        "gender": "unisex",
        "main_image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
        "stock_quantity": 60,
        "fabric_type": "Mesh/Synthetic",
        "size_type": "US 6-14",
        "editorial_tags": "Cyber Streetwear, Avant-Garde",
        "storytelling_title": "Velocity & Stature",
        "storytelling_description": "Futurism meets utility. Dynamic cushioned sole panels provide response, while the technical mesh shell showcases progressive performance lines.",
        "mood_aesthetic": "Avant-Garde",
        "occasion": "Active Urban",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-neon-lights-40081-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600,https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600,https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600,https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
    },
    {
        "name": "Leather Biker Jacket",
        "description": "Premium leather motorcycle jacket with silver hardware.",
        "price": 299.99,
        "brand_id": 4,
        "category_id": 5,
        "gender": "unisex",
        "main_image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600",
        "stock_quantity": 25,
        "fabric_type": "Genuine Leather",
        "size_type": "S/M/L/XL",
        "editorial_tags": "After Hours, Rock Couture",
        "storytelling_title": "The Architectural Biker",
        "storytelling_description": "Cut from premium full-grain steerhide. This heavy-duty piece develops a personalized patina over years of wear, featuring custom silver-polished zippers.",
        "mood_aesthetic": "Avant-Garde",
        "occasion": "Club & Concert",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40093-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600,https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600,https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600,https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600",
    },
    {
        "name": "Mini Silk Slip Dress",
        "description": "Luxurious silk-satin slip dress in champagne.",
        "price": 199.99,
        "brand_id": 4,
        "category_id": 2,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600",
        "stock_quantity": 30,
        "fabric_type": "Silk",
        "size_type": "XS/S/M/L",
        "editorial_tags": "Evening Elegance, After Hours",
        "storytelling_title": "The Liquid Silk",
        "storytelling_description": "100% heavy mulberry silk cut on the bias to cling softly to body contours. A timeless silhouette inspired by nineties minimalism.",
        "mood_aesthetic": "Stealth Wealth",
        "occasion": "Cocktail Party",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40093-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600,https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600,https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600",
    },
    {
        "name": "Denim Jacket",
        "description": "Classic washed denim jacket, a wardrobe staple.",
        "price": 79.99,
        "brand_id": 3,
        "category_id": 5,
        "gender": "unisex",
        "main_image_url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600",
        "stock_quantity": 70,
        "fabric_type": "Denim",
        "size_type": "S/M/L/XL",
        "editorial_tags": "Minimalist Core, Wardrobe Staples",
        "storytelling_title": "Washed Selvedge",
        "storytelling_description": "Mid-weight selvedge denim, stonewashed in vintage indigo tones. Hand-distressed details ensure that no two jackets are identical.",
        "mood_aesthetic": "Cozy Minimalism",
        "occasion": "Daily Outing",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-light-running-fingers-through-hair-41865-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600,https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600,https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600,https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600",
    },
    {
        "name": "Wide-Leg Linen Trousers",
        "description": "Breezy wide-leg trousers in natural linen.",
        "price": 69.99,
        "brand_id": 1,
        "category_id": 4,
        "gender": "women",
        "main_image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600",
        "stock_quantity": 45,
        "fabric_type": "Linen",
        "size_type": "XS/S/M/L/XL",
        "editorial_tags": "Seasonal Statement, Minimalist Core",
        "storytelling_title": "The Airflow Trouser",
        "storytelling_description": "Crafted in breathable Irish linen. Designed with a generous wide-leg profile that creates elegant lines in motion. Ideal for warm escapes.",
        "mood_aesthetic": "Stealth Wealth",
        "occasion": "Resort Wear",
        "cinematic_video_url": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40093-large.mp4",
        "angles_images_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600,https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600,https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600,https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600",
    },
]


def seed():
    db = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(Brand).count() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding brands...")
        brands_dict = {}
        for b in BRANDS:
            brand = Brand(**b)
            db.add(brand)
            brands_dict[b["slug"]] = brand
        db.flush()

        # Map of hardcoded brand index in PRODUCTS to seeded Brand ID
        brand_slug_by_index = {
            1: "zara",
            2: "nike",
            3: "hm",
            4: "gucci",
        }
        brand_id_map = {index: brands_dict[slug].id for index, slug in brand_slug_by_index.items()}

        print("Seeding categories...")
        # 1. Insert parent category first
        parent_cat = Category(name="Clothing", parent_id=None)
        db.add(parent_cat)
        db.flush()

        # 2. Insert child categories referencing the parent's actual ID
        child_cats = {
            2: Category(name="Dresses", parent_id=parent_cat.id),
            3: Category(name="Tops", parent_id=parent_cat.id),
            4: Category(name="Bottoms", parent_id=parent_cat.id),
            5: Category(name="Outerwear", parent_id=parent_cat.id),
        }
        for cat in child_cats.values():
            db.add(cat)
        db.flush()

        # Map of hardcoded category index in PRODUCTS to seeded Category ID
        category_id_map = {
            1: parent_cat.id,
            2: child_cats[2].id,
            3: child_cats[3].id,
            4: child_cats[4].id,
            5: child_cats[5].id,
        }

        print("Seeding products...")
        for p in PRODUCTS:
            prod_data = p.copy()
            # Resolve Brand and Category IDs dynamically
            prod_data["brand_id"] = brand_id_map.get(p["brand_id"])
            prod_data["category_id"] = category_id_map.get(p["category_id"])
            
            product = Product(**prod_data)
            db.add(product)
        db.flush()

        print("Creating default users...")
        # Admin User
        admin = User(
            email="admin@vrital.com",
            password_hash=hash_password("admin123"),
            full_name="Admin User",
            role="admin",
        )
        db.add(admin)

        # Partner User (Generic / Zara)
        partner = User(
            email="partner@vrital.com",
            password_hash=hash_password("partner123"),
            full_name="Demo Store Owner",
            role="partner",
            brand_id=brands_dict["zara"].id
        )
        db.add(partner)

        # Brand specific partners
        gucci_partner = User(
            email="gucci_partner@vrital.com",
            password_hash=hash_password("partner123"),
            full_name="Gucci Manager",
            role="partner",
            brand_id=brands_dict["gucci"].id
        )
        db.add(gucci_partner)

        nike_partner = User(
            email="nike_partner@vrital.com",
            password_hash=hash_password("partner123"),
            full_name="Nike Manager",
            role="partner",
            brand_id=brands_dict["nike"].id
        )
        db.add(nike_partner)

        zara_partner = User(
            email="zara_partner@vrital.com",
            password_hash=hash_password("partner123"),
            full_name="Zara Manager",
            role="partner",
            brand_id=brands_dict["zara"].id
        )
        db.add(zara_partner)

        hm_partner = User(
            email="hm_partner@vrital.com",
            password_hash=hash_password("partner123"),
            full_name="H&M Manager",
            role="partner",
            brand_id=brands_dict["hm"].id
        )
        db.add(hm_partner)

        # Customer User
        customer = User(
            email="customer@vrital.com",
            password_hash=hash_password("customer123"),
            full_name="Demo Customer",
            role="customer",
        )
        db.add(customer)

        db.commit()
        print("✅ Seed completed successfully!")
        print("   Admin login: admin@vrital.com / admin123")
        print("   Partner logins:")
        print("     - partner@vrital.com / partner123 (Zara)")
        print("     - gucci_partner@vrital.com / partner123")
        print("     - nike_partner@vrital.com / partner123")
        print("     - zara_partner@vrital.com / partner123")
        print("     - hm_partner@vrital.com / partner123")
        print("   Customer login: customer@vrital.com / customer123")
    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()


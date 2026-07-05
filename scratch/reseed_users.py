import os
import sys

# Add backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.core.database import SessionLocal
from app.modules.users.models import User
from app.modules.products.models import Brand
from app.core.security import hash_password

def reseed_users():
    db = SessionLocal()
    try:
        print("Clearing existing users...")
        db.query(User).delete()
        db.flush()

        print("Fetching brand map...")
        brands = {b.slug: b.id for b in db.query(Brand).all()}

        print("Creating default users with new password hash salt...")
        
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
            brand_id=brands.get("zara")
        )
        db.add(partner)

        # Brand specific partners
        gucci_partner = User(
            email="gucci_partner@vrital.com",
            password_hash=hash_password("partner123"),
            full_name="Gucci Manager",
            role="partner",
            brand_id=brands.get("gucci")
        )
        db.add(gucci_partner)

        nike_partner = User(
            email="nike_partner@vrital.com",
            password_hash=hash_password("partner123"),
            full_name="Nike Manager",
            role="partner",
            brand_id=brands.get("nike")
        )
        db.add(nike_partner)

        zara_partner = User(
            email="zara_partner@vrital.com",
            password_hash=hash_password("partner123"),
            full_name="Zara Manager",
            role="partner",
            brand_id=brands.get("zara")
        )
        db.add(zara_partner)

        hm_partner = User(
            email="hm_partner@vrital.com",
            password_hash=hash_password("partner123"),
            full_name="H&M Manager",
            role="partner",
            brand_id=brands.get("hm")
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
        print("✅ Default users re-seeded successfully with the new password hashing salt!")
    except Exception as e:
        db.rollback()
        print(f"❌ Reseed failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    reseed_users()

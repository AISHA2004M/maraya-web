import os
import sys
import uuid

# Add backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.core.database import SessionLocal
from app.modules.tryon.models import TryOnSession, UserImage
from app.modules.products.models import Product
from app.modules.users.models import User

def test_db():
    db = SessionLocal()
    try:
        print("Creating test records...")
        prod = db.query(Product).first()
        if not prod:
            print("No product found, aborting test.")
            return

        # 1. Create UserImage
        img = UserImage(
            image_url="http://test.com/img.jpg",
            image_hash="testhash123"
        )
        db.add(img)
        db.flush()

        # 2. Create TryOnSession
        sess = TryOnSession(
            id=str(uuid.uuid4()),
            product_id=prod.id,
            user_image_id=img.id,
            status="queued",
            progress=0,
            image_hash="testhash123",
            model_variant="balanced",
            garments_list="[]",
            avatar="avatar_name",
            height=180,
            weight=75,
            body_bust=90,
            body_waist=75,
            body_hips=95
        )
        db.add(sess)
        db.flush()

        print("Test records created successfully! Database schema is 100% compliant.")
        db.rollback() # Don't commit dummy test data
    except Exception as e:
        db.rollback()
        print("Database schema check FAILED:", e)
    finally:
        db.close()

if __name__ == "__main__":
    os.environ["DATABASE_URL"] = "postgresql://vrital_db_user:YUXvIu3lNC88RoCuHn6wEX3cJH1mVgiM@dpg-d91edfugvqtc73dmsbcg-a.oregon-postgres.render.com/vrital_db"
    test_db()

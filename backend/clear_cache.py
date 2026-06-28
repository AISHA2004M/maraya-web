from sqlalchemy import create_engine, text

DATABASE_URL = "sqlite:///./vrital_dev.db"
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as connection:
        # Clear database cache tables
        connection.execute(text("DELETE FROM tryon_sessions;"))
        connection.execute(text("DELETE FROM user_images;"))
        connection.commit()
        print("Database try-on cache cleared successfully!")
except Exception as e:
    print(f"Failed to clear cache: {e}")

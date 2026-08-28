from pydantic_settings import BaseSettings, SettingsConfigDict
from urllib.parse import quote_plus
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Virtual Try-On API"
    API_V1_STR: str = "/api/v1"
    # Can be set as full URL or as individual DB_* parts (avoids encoding issues in Render)
    DATABASE_URL: Optional[str] = None
    DB_HOST: Optional[str] = None
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    DB_NAME: str = "postgres"
    DB_PORT: int = 6543
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200
    REDIS_URL: str = "redis://localhost:6379/0"
    API_BASE_URL: str = "http://localhost:8000"

    # S3 / Cloud Storage
    # Set USE_S3=true in production .env to enable cloud uploads
    USE_S3: bool = False
    S3_BUCKET: str = ""
    S3_REGION: str = "us-east-1"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_ENDPOINT_URL: str = ""   # Set for S3-compatible stores (MinIO, Cloudflare R2, etc.)

    # AI Service
    AI_SERVICE_URL: str = "http://localhost:8001"

    # Nano Banana 2 / Gemini API
    GEMINI_API_KEY: str = ""
    NANO_BANANA_API_KEY: str = ""
    NANO_BANANA_MODEL: str = "google/gemini-3.1-flash-image"
    OPENROUTER_API_KEY: str = ""

    # Supabase Storage
    SUPABASE_URL: str = "https://fyxpczacexydrzpqipfy.supabase.co"
    SUPABASE_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eHBjemFjZXh5ZHJ6cHFpcGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjEyMjQsImV4cCI6MjEwMjczNzIyNH0.s63Bp-gRKzWXtGg2QfUBe-_AV6o3QdHwfBZS47eLJ7s"
    SUPABASE_STORAGE_BUCKET: str = "Maraya-image"

    # Cloudinary (free cloud storage for production images)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")




settings = Settings()

# Build DATABASE_URL from individual DB_* parts if not set directly.
# This avoids URL-encoding issues with special chars ($ * @) in Render env vars.
if not settings.DATABASE_URL:
    if settings.DB_HOST and settings.DB_USER and settings.DB_PASSWORD:
        _pw = quote_plus(settings.DB_PASSWORD)
        settings.DATABASE_URL = (
            f"postgresql://{settings.DB_USER}:{_pw}"
            f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
        )
    else:
        raise ValueError(
            "DATABASE_URL or (DB_HOST + DB_USER + DB_PASSWORD) must be set"
        )

# Fix Render/PostgreSQL database scheme compatibility for SQLAlchemy
if settings.DATABASE_URL and settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql://", 1)




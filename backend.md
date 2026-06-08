Below is a production-grade FastAPI template designed like something you’d actually see in a real company backend (clean architecture, modular, scalable, async-ready, and AI-service friendly).

I’ll keep it plug-and-play, so you can extend it into your Virtual Try-On system easily.

⸻

🧱 1. Project Structure (Production Layout)

backend/
│
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   ├── logging.py
│   │   └── exceptions.py
│   │
│   ├── api/
│   │   ├── deps.py
│   │   └── router.py
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   │
│   │   ├── users/
│   │   ├── products/
│   │   └── tryon/
│   │
│   ├── services/
│   │   ├── s3.py
│   │   ├── redis.py
│   │   └── ai_client.py
│   │
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   │
│   └── utils/
│       ├── time.py
│       └── helpers.py
│
├── alembic/
├── tests/
├── docker/
├── .env
├── docker-compose.yml
├── requirements.txt
└── README.md

⸻

⚙️ 2. Core Configuration

📌 core/config.py

from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    PROJECT_NAME: str = "Virtual Try-On API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REDIS_URL: str
    S3_BUCKET: str
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    AI_SERVICE_URL: str
    class Config:
        env_file = ".env"
settings = Settings()

⸻

🗄️ 3. Database Setup

📌 core/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
class Base(DeclarativeBase):
    pass

⸻

📌 Dependency

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

⸻

🔐 4. Security (JWT Auth)

📌 core/security.py

from datetime import datetime, timedelta
from jose import jwt
from app.core.config import settings
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )

⸻

🚨 5. Global Exception Handling

📌 core/exceptions.py

from fastapi import HTTPException
class AppException(HTTPException):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(status_code=status_code, detail=message)

⸻

🧩 6. Main Application Entry

📌 main.py

from fastapi import FastAPI
from app.api.router import api_router
from app.core.config import settings
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0"
)
app.include_router(api_router, prefix=settings.API_V1_STR)
@app.get("/")
def health_check():
    return {"status": "ok"}

⸻

🧭 7. Central Router

📌 api/router.py

from fastapi import APIRouter
from app.modules.auth.router import router as auth_router
from app.modules.products.router import router as products_router
from app.modules.tryon.router import router as tryon_router
api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(products_router, prefix="/products", tags=["Products"])
api_router.include_router(tryon_router, prefix="/tryon", tags=["TryOn"])

⸻

👤 8. Auth Module (Clean Example)

📌 modules/auth/schemas.py

from pydantic import BaseModel
class UserCreate(BaseModel):
    email: str
    password: str

⸻

📌 service.py

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def hash_password(password: str):
    return pwd_context.hash(password)
def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

⸻

📌 router.py

from fastapi import APIRouter, Depends
from app.modules.auth.schemas import UserCreate
router = APIRouter()
@router.post("/register")
def register(user: UserCreate):
    return {"message": "user created"}

⸻

🛍️ 9. Products Module

📌 Example Model

from sqlalchemy import Column, Integer, String
from app.db.base import Base
class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    brand = Column(String)
    category = Column(String)
    image_url = Column(String)

⸻

📌 Router

from fastapi import APIRouter
router = APIRouter()
@router.get("/")
def get_products():
    return [{"id": 1, "name": "T-Shirt"}]

⸻

🤖 10. AI Try-On Service Layer (VERY IMPORTANT)

📌 services/ai_client.py

import httpx
from app.core.config import settings
class AIClient:
    async def generate_tryon(self, user_image: str, cloth_image: str):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.AI_SERVICE_URL}/infer",
                json={
                    "user_image": user_image,
                    "cloth_image": cloth_image
                },
                timeout=60
            )
        return response.json()

⸻

📌 Try-On Router

from fastapi import APIRouter
from app.services.ai_client import AIClient
router = APIRouter()
ai_client = AIClient()
@router.post("/generate")
async def generate_tryon(payload: dict):
    result = await ai_client.generate_tryon(
        payload["user_image"],
        payload["cloth_image"]
    )
    return result

⸻

📦 11. S3 Storage Service

import boto3
from app.core.config import settings
class S3Service:
    def __init__(self):
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY
        )
    def upload_file(self, file, key: str):
        self.client.upload_fileobj(file, settings.S3_BUCKET, key)
        return f"https://{settings.S3_BUCKET}.s3.amazonaws.com/{key}"

⸻

🧠 12. Production Requirements (IMPORTANT)

🔥 Must-have for real deployment:

🐳 Docker

* backend container
* postgres container
* redis container

⚡ Async

* httpx instead of requests
* async endpoints for AI calls

🧵 Background Jobs

Use:

* Celery OR
* FastAPI BackgroundTasks (MVP only)

📊 Observability

* structured logging (JSON)
* request_id middleware

⸻

🚀 13. Docker Compose (Basic Production Setup)

version: "3.9"
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - db
      - redis
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: tryon
  redis:
    image: redis:7

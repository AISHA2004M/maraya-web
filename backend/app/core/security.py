from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
import hashlib
import hmac
import os
from app.core.config import settings

# Use SHA-256 HMAC for password hashing (compatible with all Python/bcrypt versions)
# For production, swap back to bcrypt with a compatible version
_HASH_SECRET = settings.JWT_SECRET.encode()


def hash_password(password: str) -> str:
    """HMAC-SHA256 password hash (dev-compatible; swap to bcrypt for production)."""
    token = hmac.new(_HASH_SECRET, password.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"sha256${token}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if hashed_password.startswith("sha256$"):
        expected = hash_password(plain_password)
        return hmac.compare_digest(hashed_password, expected)
    return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None

from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
import hashlib
import hmac
import os
from app.core.config import settings

# Use a fixed salt for HMAC-SHA256 password hashing so that token rotation (JWT_SECRET changes)
# does not invalidate existing user passwords in the database.
_HASH_SECRET = b"vrital_platform_hash_salt_2026"


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
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_password_reset_token(email: str) -> str:
    """Creates a 1-hour valid token specifically for password reset."""
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    to_encode = {"sub": email, "type": "password_reset", "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)



def verify_password_reset_token(token: str) -> Optional[str]:
    """Decodes token and returns email if valid password_reset token, else None."""
    try:
        decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if decoded.get("type") == "password_reset":
            return decoded.get("sub")
        return None
    except JWTError:
        return None


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


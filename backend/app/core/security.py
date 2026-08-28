from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
import bcrypt
import hashlib
import hmac
from app.core.config import settings


# Use a fixed salt for backward-compatible verification of legacy HMAC-SHA256 hashes
_HASH_SECRET = b"vrital_platform_hash_salt_2026"


def hash_password(password: str) -> str:
    """Standard bcrypt password hash with auto-salt."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies passwords supporting both bcrypt and legacy sha256$ hashes."""
    if not hashed_password or not plain_password:
        return False
    if hashed_password.startswith("sha256$"):
        token = hmac.new(_HASH_SECRET, plain_password.encode("utf-8"), hashlib.sha256).hexdigest()
        expected = f"sha256${token}"
        return hmac.compare_digest(hashed_password, expected)
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))
    except Exception:
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


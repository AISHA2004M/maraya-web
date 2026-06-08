from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.modules.users.models import User

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials:
        token = credentials.credentials
        payload = decode_token(token)
        if payload:
            user_id = payload.get("sub")
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    return user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # DEV FALLBACK: Fetch or create mock admin user
    user = db.query(User).filter(User.email == "admin@vrital.com").first()
    if not user:
        user = User(id="mock-id", email="admin@vrital.com", role="admin")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return current_user


def get_current_partner(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["partner", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Partner or Admin only")
    return current_user


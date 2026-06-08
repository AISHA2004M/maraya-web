from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_admin, get_current_user
from app.modules.users import service
from app.modules.users.schemas import UserOut, UserUpdate
from typing import List

router = APIRouter()


@router.get("/me", response_model=UserOut)
def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return service.update_user_profile(db, current_user.id, payload)


@router.get("/", response_model=List[UserOut])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    return service.get_all_users(db, skip=skip, limit=limit)


@router.patch("/{user_id}/role")
def update_role(
    user_id: str,
    role: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    user = service.set_user_role(db, user_id, role)
    return {"success": True, "user": UserOut.model_validate(user)}


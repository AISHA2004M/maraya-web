from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    height: Optional[int] = None
    weight: Optional[int] = None
    body_bust: Optional[int] = None
    body_waist: Optional[int] = None
    body_hips: Optional[int] = None
    brand_preferences: Optional[str] = None
    style_preferences: Optional[str] = None



class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    body_bust: Optional[int] = None
    body_waist: Optional[int] = None
    body_hips: Optional[int] = None
    brand_preferences: Optional[str] = None
    style_preferences: Optional[str] = None


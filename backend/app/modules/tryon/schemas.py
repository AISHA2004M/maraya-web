from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class TryOnRequest(BaseModel):
    product_id: Optional[str] = None
    user_image_url: str
    product_ids: Optional[List[str]] = []
    avatar: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    body_bust: Optional[int] = None
    body_waist: Optional[int] = None
    body_hips: Optional[int] = None


class TryOnSessionOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    product_id: Optional[str] = None
    result_image_url: Optional[str] = None
    status: str
    progress: Optional[int] = 0
    ai_model_version: Optional[str] = None
    inference_time_ms: Optional[int] = None
    garments_list: Optional[str] = None
    avatar: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    body_bust: Optional[int] = None
    body_waist: Optional[int] = None
    body_hips: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TryOnDispatchOut(BaseModel):
    """Immediate response returned after submitting a try-on job."""
    session_id: str
    status: str
    message: str


class TryOnStatusOut(BaseModel):
    """Real-time status response for polling."""
    session_id: str
    status: str                              # queued | processing | completed | failed
    progress: Optional[int] = 0
    result_image_url: Optional[str] = None
    inference_time_ms: Optional[int] = None
    ai_model_version: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TryOnResponse(BaseModel):
    job_id: str
    status: str
    progress: int


class TryOnResultResponse(BaseModel):
    job_id: str
    status: str
    result_image_url: Optional[str] = None
    inference_time_ms: Optional[int] = None


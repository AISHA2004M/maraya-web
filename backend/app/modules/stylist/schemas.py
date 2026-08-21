from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from decimal import Decimal
import uuid


class StylistMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class StylistProductRecommendation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    price: Decimal
    brand_name: Optional[str] = None
    main_image_url: str
    editorial_tags: Optional[str] = None
    reason: Optional[str] = None


class StylistChatRequest(BaseModel):
    message: str
    history: Optional[List[StylistMessage]] = []
    budget_max: Optional[Decimal] = None
    preferred_gender: Optional[str] = None


class StylistChatResponse(BaseModel):
    reply: str
    look_title: Optional[str] = None
    style_archetype: Optional[str] = None
    recommendations: List[StylistProductRecommendation] = []

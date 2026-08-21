from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime
from typing import Optional


class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    body: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    body: Optional[str] = None


class ReviewerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: str
    rating: int
    title: Optional[str] = None
    body: Optional[str] = None
    verified_purchase: bool = False
    created_at: datetime
    reviewer_name: Optional[str] = None



class ProductRatingSummary(BaseModel):
    """Aggregated rating stats for a product — shown on product page."""
    product_id: str
    average_rating: float
    total_reviews: int
    rating_breakdown: dict  # {1: count, 2: count, ..., 5: count}

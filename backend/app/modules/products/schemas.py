from typing import Optional, List
from pydantic import BaseModel
import uuid
from decimal import Decimal


class BrandOut(BaseModel):
    id: int
    name: str
    slug: str
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    description: Optional[str] = None
    
    # CMS settings
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_image_url: Optional[str] = None
    hero_cta_text: Optional[str] = None
    story_title: Optional[str] = None
    story_description: Optional[str] = None
    story_image_url: Optional[str] = None
    philosophy_title: Optional[str] = None
    philosophy_text: Optional[str] = None
    accent_color: Optional[str] = None
    font_family: Optional[str] = None
    seasonal_title: Optional[str] = None
    seasonal_desc: Optional[str] = None

    class Config:
        from_attributes = True


class BrandCMSUpdate(BaseModel):
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_image_url: Optional[str] = None
    hero_cta_text: Optional[str] = None
    story_title: Optional[str] = None
    story_description: Optional[str] = None
    story_image_url: Optional[str] = None
    philosophy_title: Optional[str] = None
    philosophy_text: Optional[str] = None
    accent_color: Optional[str] = None
    font_family: Optional[str] = None
    seasonal_title: Optional[str] = None
    seasonal_desc: Optional[str] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None

    class Config:
        from_attributes = True


class ProductImageOut(BaseModel):
    id: int
    image_url: str
    angle: Optional[str] = None

    class Config:
        from_attributes = True


class ProductSizeOut(BaseModel):
    """Serialized size/stock pair returned to the client."""
    size: str
    stock: int

    class Config:
        from_attributes = True


class ProductSizeIn(BaseModel):
    """Input schema for setting a size and its available stock."""
    size: str
    stock: int = 0


class ProductOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    price: Decimal
    currency: str
    gender: Optional[str] = None
    main_image_url: str
    stock_quantity: int
    is_active: bool
    editorial_tags: Optional[str] = None
    storytelling_title: Optional[str] = None
    storytelling_description: Optional[str] = None
    mood_aesthetic: Optional[str] = None
    occasion: Optional[str] = None
    cinematic_video_url: Optional[str] = None
    angles_images_url: Optional[str] = None
    brand: Optional[BrandOut] = None
    category: Optional[CategoryOut] = None
    images: List[ProductImageOut] = []
    sizes: List[ProductSizeOut] = []

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    currency: str = "USD"
    brand_id: Optional[int] = None
    category_id: Optional[int] = None
    gender: Optional[str] = None
    main_image_url: str
    fabric_type: Optional[str] = None
    size_type: Optional[str] = None
    stock_quantity: int = 0
    editorial_tags: Optional[str] = None
    storytelling_title: Optional[str] = None
    storytelling_description: Optional[str] = None
    mood_aesthetic: Optional[str] = None
    occasion: Optional[str] = None
    cinematic_video_url: Optional[str] = None
    angles_images_url: Optional[str] = None
    sizes: Optional[List[ProductSizeIn]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    is_active: Optional[bool] = None
    main_image_url: Optional[str] = None
    brand_id: Optional[int] = None
    category_id: Optional[int] = None
    gender: Optional[str] = None
    fabric_type: Optional[str] = None
    size_type: Optional[str] = None
    editorial_tags: Optional[str] = None
    storytelling_title: Optional[str] = None
    storytelling_description: Optional[str] = None
    mood_aesthetic: Optional[str] = None
    occasion: Optional[str] = None
    cinematic_video_url: Optional[str] = None
    angles_images_url: Optional[str] = None
    sizes: Optional[List[ProductSizeIn]] = None

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Any


class WishlistItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: str
    created_at: datetime

    # Flattened product fields for convenience
    product_name: Optional[str] = None
    product_price: Optional[Any] = None
    product_image: Optional[str] = None
    product_brand: Optional[str] = None
    product_brand_slug: Optional[str] = None



class WishlistToggleResponse(BaseModel):
    """Returned after toggle — tells the client the new state."""
    saved: bool          # True if item was just added, False if removed
    product_id: str
    wishlist_count: int  # Total items in wishlist after operation

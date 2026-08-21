"""
Wishlist Router
===============
Endpoints:
  GET  /wishlist           — Get all saved items for current user
  POST /wishlist/toggle    — Toggle save/unsave for a product
  GET  /wishlist/check/:id — Check if specific product is saved
  GET  /wishlist/count     — Get total wishlist count (for Navbar badge)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.modules.wishlist.service import (
    get_user_wishlist,
    toggle_wishlist,
    is_in_wishlist,
    get_wishlist_count,
)
from app.modules.wishlist.schemas import WishlistItemOut, WishlistToggleResponse
from app.modules.products.models import Product, Brand

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=List[WishlistItemOut])
def list_wishlist(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Return all wishlist items for the authenticated user, with product details."""
    items = get_user_wishlist(db, str(current_user.id))
    result = []
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        brand_name = None
        brand_slug = None
        if product and product.brand_id:
            brand = db.query(Brand).filter(Brand.id == product.brand_id).first()
            if brand:
                brand_name = brand.name
                brand_slug = brand.slug

        result.append(WishlistItemOut(
            id=item.id,
            product_id=item.product_id,
            created_at=item.created_at,
            product_name=product.name if product else None,
            product_price=float(product.price) if product else None,
            product_image=product.main_image_url if product else None,
            product_brand=brand_name,
            product_brand_slug=brand_slug,
        ))
    return result


@router.post("/toggle", response_model=WishlistToggleResponse)
def toggle(product_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Toggle save/unsave. Returns new saved state and total count."""
    result = toggle_wishlist(db, str(current_user.id), product_id)
    return WishlistToggleResponse(
        saved=result["saved"],
        product_id=product_id,
        wishlist_count=result["count"],
    )


@router.get("/check/{product_id}")
def check_saved(product_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Check if a specific product is in the user's wishlist."""
    return {"saved": is_in_wishlist(db, str(current_user.id), product_id)}


@router.get("/count")
def wishlist_count(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get total number of items in wishlist (for navbar badge)."""
    return {"count": get_wishlist_count(db, str(current_user.id))}

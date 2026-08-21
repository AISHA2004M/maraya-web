"""
Wishlist Service
================
Toggle-based wishlist logic: calling save on an already-saved item removes it.
This matches how Zara / ASOS wishlist buttons work.
"""
from sqlalchemy.orm import Session
from app.modules.wishlist.models import WishlistItem


def get_user_wishlist(db: Session, user_id: str) -> list[WishlistItem]:
    return (
        db.query(WishlistItem)
        .filter(WishlistItem.user_id == user_id)
        .order_by(WishlistItem.created_at.desc())
        .all()
    )


def is_in_wishlist(db: Session, user_id: str, product_id: str) -> bool:
    return (
        db.query(WishlistItem)
        .filter(WishlistItem.user_id == user_id, WishlistItem.product_id == product_id)
        .first()
        is not None
    )


def toggle_wishlist(db: Session, user_id: str, product_id: str) -> dict:
    """
    Adds item if not saved. Removes it if already saved.
    Returns {"saved": bool, "count": int}.
    """
    existing = (
        db.query(WishlistItem)
        .filter(WishlistItem.user_id == user_id, WishlistItem.product_id == product_id)
        .first()
    )

    if existing:
        db.delete(existing)
        db.commit()
        saved = False
    else:
        item = WishlistItem(user_id=user_id, product_id=product_id)
        db.add(item)
        db.commit()
        saved = True

    count = db.query(WishlistItem).filter(WishlistItem.user_id == user_id).count()
    return {"saved": saved, "count": count}


def get_wishlist_count(db: Session, user_id: str) -> int:
    return db.query(WishlistItem).filter(WishlistItem.user_id == user_id).count()

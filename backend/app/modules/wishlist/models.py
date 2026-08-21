"""
Wishlist Model
==============
Stores saved products per user. A (user_id, product_id) pair is unique
so the same product cannot be saved twice in a user's wishlist.
"""
import os
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.types import CHAR
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.types import TypeDecorator
from sqlalchemy.orm import relationship
from app.core.database import Base


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Enforce uniqueness at DB level
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),
    )

    user = relationship("app.modules.users.models.User")
    product = relationship("app.modules.products.models.Product")

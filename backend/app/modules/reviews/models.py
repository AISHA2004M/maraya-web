"""
Reviews & Ratings Model
========================
Customers can leave one review per product (enforced by UniqueConstraint).
Reviews include a star rating (1-5), optional title, and text body.
"""
import os
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, UniqueConstraint, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(255), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)     # 1-5

    title = Column(String(200), nullable=True)
    body = Column(Text, nullable=True)
    verified_purchase = Column(Integer, default=0)  # 1 if user actually bought the product
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        # One review per user per product
        UniqueConstraint("user_id", "product_id", name="uq_review_user_product"),
        # Rating must be between 1 and 5
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating_range"),
    )

    user = relationship("app.modules.users.models.User")
    product = relationship("app.modules.products.models.Product")

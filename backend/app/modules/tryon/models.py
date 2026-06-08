import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserImage(Base):
    __tablename__ = "user_images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    image_url = Column(Text, nullable=False)
    image_hash = Column(String(64), nullable=True, index=True)
    body_type = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    tryon_sessions = relationship("TryOnSession", back_populates="user_image")


class TryOnSession(Base):
    __tablename__ = "tryon_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=True)
    user_image_id = Column(String(36), ForeignKey("user_images.id"), nullable=True)
    result_image_url = Column(Text, nullable=True)
    status = Column(String(50), default="processing")
    progress = Column(Integer, default=0)
    image_hash = Column(String(64), nullable=True, index=True)
    model_variant = Column(String(50), nullable=True)
    ai_model_version = Column(String(50), nullable=True)
    inference_time_ms = Column(Integer, nullable=True)
    garments_list = Column(Text, nullable=True)  # JSON text list of product IDs
    avatar = Column(String(50), nullable=True)
    height = Column(Integer, nullable=True)
    weight = Column(Integer, nullable=True)
    body_bust = Column(Integer, nullable=True)
    body_waist = Column(Integer, nullable=True)
    body_hips = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user_image = relationship("UserImage", back_populates="tryon_sessions")


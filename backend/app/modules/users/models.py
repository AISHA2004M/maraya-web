import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="customer")
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    
    height = Column(Integer, nullable=True)
    weight = Column(Integer, nullable=True)
    body_bust = Column(Integer, nullable=True)
    body_waist = Column(Integer, nullable=True)
    body_hips = Column(Integer, nullable=True)
    brand_preferences = Column(Text, nullable=True)  # Comma-separated or JSON list
    style_preferences = Column(Text, nullable=True)  # Comma-separated or JSON list
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    brand = relationship("app.modules.products.models.Brand")

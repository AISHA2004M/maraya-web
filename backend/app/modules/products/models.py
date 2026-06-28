import uuid
from sqlalchemy import Column, String, Integer, Text, Numeric, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    logo_url = Column(Text, nullable=True)
    banner_url = Column(Text, nullable=True)
    
    # CMS settings
    hero_title = Column(String(255), nullable=True)
    hero_subtitle = Column(String(255), nullable=True)
    hero_image_url = Column(Text, nullable=True)
    hero_cta_text = Column(String(100), nullable=True)
    story_title = Column(String(255), nullable=True)
    story_description = Column(Text, nullable=True)
    story_image_url = Column(Text, nullable=True)
    philosophy_title = Column(String(255), nullable=True)
    philosophy_text = Column(Text, nullable=True)
    accent_color = Column(String(50), nullable=True)
    font_family = Column(String(100), nullable=True)
    seasonal_title = Column(String(255), nullable=True)
    seasonal_desc = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    products = relationship("Product", back_populates="brand")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    parent = relationship("Category", remote_side=[id], backref="children")
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD")
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    gender = Column(String(20), nullable=True)
    main_image_url = Column(Text, nullable=False)
    fabric_type = Column(String(100), nullable=True)
    size_type = Column(String(50), nullable=True)
    stock_quantity = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    editorial_tags = Column(Text, nullable=True)  # comma-separated list
    storytelling_title = Column(String(255), nullable=True)
    storytelling_description = Column(Text, nullable=True)
    mood_aesthetic = Column(String(100), nullable=True)
    occasion = Column(String(100), nullable=True)
    cinematic_video_url = Column(Text, nullable=True)
    angles_images_url = Column(Text, nullable=True)  # comma-separated list of image URLs

    # Iraq market — essential buyer details
    garment_length = Column(String(50), nullable=True)    # e.g. "120 سم"
    care_instructions = Column(Text, nullable=True)       # e.g. "غسيل يدوي فقط"
    color = Column(String(100), nullable=True)            # e.g. "أسود"
    material_details = Column(Text, nullable=True)        # e.g. "قطن 100% مستورد"
    origin_country = Column(String(100), nullable=True)   # e.g. "تركيا"
    garment_weight = Column(String(50), nullable=True)    # e.g. "خفيف" / "متوسط" / "ثقيل"
    sleeve_length = Column(String(100), nullable=True)    # e.g. "أكمام طويلة"
    lining = Column(String(100), nullable=True)           # e.g. "مبطن بالكامل"
    closure_type = Column(String(100), nullable=True)     # e.g. "سحاب خلفي"

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    brand = relationship("Brand", back_populates="products")
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    sizes = relationship("ProductSize", back_populates="product", cascade="all, delete-orphan")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"))
    image_url = Column(Text, nullable=False)
    angle = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    product = relationship("Product", back_populates="images")


class ProductSize(Base):
    """Tracks per-size stock availability for each product."""
    __tablename__ = "product_sizes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    size = Column(String(10), nullable=False)  # e.g. "XS", "S", "M", "L", "XL"
    stock = Column(Integer, default=0, nullable=False)

    product = relationship("Product", back_populates="sizes")

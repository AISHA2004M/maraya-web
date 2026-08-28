import uuid
import os
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, func
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class GUID(TypeDecorator):
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(pgUUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return str(value)

ID_TYPE = GUID



class Cart(Base):
    __tablename__ = "carts"

    id = Column(ID_TYPE, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(ID_TYPE, ForeignKey("users.id"), unique=True)
    created_at = Column(DateTime, server_default=func.now())


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cart_id = Column(ID_TYPE, ForeignKey("carts.id", ondelete="CASCADE"))
    product_id = Column(String(255), ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    added_at = Column(DateTime, server_default=func.now())


class Order(Base):
    __tablename__ = "orders"

    id = Column(ID_TYPE, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(ID_TYPE, ForeignKey("users.id"))
    total_amount = Column(Numeric(10, 2))
    status = Column(String(50), default="pending")  # pending, confirmed, processing, shipped, out_for_delivery, delivered, cancelled
    payment_method = Column(String(50), nullable=True)
    shipping_address = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    promo_code = Column(String(50), nullable=True)
    discount_amount = Column(Numeric(10, 2), default=0.0)
    tracking_number = Column(String(100), nullable=True)
    carrier = Column(String(50), default="DHL Express")
    estimated_delivery = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_percent = Column(Integer, default=0)       # e.g. 15 for 15%
    discount_amount = Column(Numeric(10, 2), default=0) # e.g. 25.00 for $25 off
    min_spend = Column(Numeric(10, 2), default=0)       # Minimum order subtotal
    is_active = Column(Integer, default=1)              # 1 = active, 0 = disabled
    created_at = Column(DateTime, server_default=func.now())


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(ID_TYPE, ForeignKey("orders.id", ondelete="CASCADE"))
    product_id = Column(String(255), ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(Numeric(10, 2))
    created_at = Column(DateTime, server_default=func.now())

    order = relationship("Order", back_populates="items")
    product = relationship("app.modules.products.models.Product")



class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(ID_TYPE, ForeignKey("users.id"))
    product_id = Column(String(255), ForeignKey("products.id"))
    created_at = Column(DateTime, server_default=func.now())




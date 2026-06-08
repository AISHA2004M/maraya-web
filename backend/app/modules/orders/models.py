import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Cart(Base):
    __tablename__ = "carts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True)
    created_at = Column(DateTime, server_default=func.now())


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cart_id = Column(String(36), ForeignKey("carts.id", ondelete="CASCADE"))
    product_id = Column(String(36), ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    added_at = Column(DateTime, server_default=func.now())


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"))
    total_amount = Column(Numeric(10, 2))
    status = Column(String(50), default="pending")
    payment_method = Column(String(50), nullable=True)
    shipping_address = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"))
    product_id = Column(String(36), ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(Numeric(10, 2))
    created_at = Column(DateTime, server_default=func.now())

    order = relationship("Order", back_populates="items")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id"))
    product_id = Column(String(36), ForeignKey("products.id"))
    created_at = Column(DateTime, server_default=func.now())

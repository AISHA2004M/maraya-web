from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int
    price_at_purchase: Decimal


class OrderItemOut(BaseModel):
    id: int
    order_id: str
    product_id: str
    quantity: int
    price_at_purchase: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    full_name: str
    shipping_address: str
    payment_method: str
    items: List[OrderItemCreate]


class OrderOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    total_amount: Decimal
    status: str
    payment_method: Optional[str] = None
    shipping_address: Optional[str] = None
    full_name: Optional[str] = None
    created_at: datetime
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str

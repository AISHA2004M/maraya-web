from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from datetime import datetime


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int
    price_at_purchase: Decimal


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: str
    product_id: str
    quantity: int
    price_at_purchase: Decimal
    created_at: datetime


class OrderCreate(BaseModel):
    full_name: str
    shipping_address: str
    payment_method: str
    promo_code: Optional[str] = None
    items: List[OrderItemCreate]


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    total_amount: Decimal
    status: str
    payment_method: Optional[str] = None
    shipping_address: Optional[str] = None
    full_name: Optional[str] = None
    promo_code: Optional[str] = None
    discount_amount: Optional[Decimal] = Decimal("0.00")
    tracking_number: Optional[str] = None
    carrier: Optional[str] = "DHL Express"
    estimated_delivery: Optional[datetime] = None
    created_at: datetime
    items: List[OrderItemOut] = []



class OrderTrackingOut(BaseModel):
    order_id: str
    status: str
    status_label: str
    progress_percentage: int
    tracking_number: Optional[str]
    carrier: str
    estimated_delivery: Optional[str]
    created_at: datetime
    shipping_address: Optional[str]
    total_amount: Decimal
    items_count: int
    steps: List[dict]


class PromoValidateRequest(BaseModel):
    code: str
    subtotal: Decimal


class PromoValidateResponse(BaseModel):
    valid: bool
    code: str
    discount_percent: int
    discount_amount: Decimal
    new_subtotal: Decimal
    message: str


class PaymentIntentRequest(BaseModel):
    amount: Decimal
    currency: str = "usd"
    order_id: Optional[str] = None


class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_id: str
    status: str
    amount: Decimal
    currency: str


class OrderStatusUpdate(BaseModel):
    status: str
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None


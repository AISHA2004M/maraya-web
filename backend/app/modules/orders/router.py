from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_user_optional, get_current_partner
from app.modules.users.models import User
from app.modules.orders import service
from app.modules.orders.models import OrderItem
from app.modules.orders.schemas import (
    OrderCreate,
    OrderOut,
    OrderStatusUpdate,
    PromoValidateRequest,
    PromoValidateResponse,
    OrderTrackingOut,
    PaymentIntentRequest,
    PaymentIntentResponse,
)

router = APIRouter()


@router.post("/checkout", response_model=OrderOut, status_code=201)
def checkout(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    user_id = str(current_user.id) if current_user else None
    return service.create_order(db, user_id, payload)



@router.post("/apply-promo", response_model=PromoValidateResponse)
def apply_promo(payload: PromoValidateRequest, db: Session = Depends(get_db)):
    """Validate a promo code and calculate discount amount."""
    return service.validate_promo_code(db, payload.code, payload.subtotal)


@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
def create_payment_intent_endpoint(payload: PaymentIntentRequest):
    """Generate Stripe PaymentIntent client_secret or simulator token."""
    return service.create_payment_intent(payload.amount, payload.currency, payload.order_id)


@router.get("/track/{order_id}", response_model=OrderTrackingOut)
def track_order(order_id: str, db: Session = Depends(get_db)):
    """Public / Customer order tracking status with step progression and carrier details."""
    return service.get_order_tracking(db, order_id)


@router.patch("/{order_id}/cancel", response_model=OrderOut)
def cancel_my_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a pending order and restore inventory."""
    return service.cancel_order(db, order_id, str(current_user.id))


@router.get("/my-orders", response_model=List[OrderOut])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_user_orders(db, current_user.id)


@router.get("/all", response_model=List[OrderOut])
def get_all_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    partner = Depends(get_current_partner),
):
    brand_id = partner.brand_id if partner.role == "partner" else None
    return service.get_all_orders(db, skip=skip, limit=limit, brand_id=brand_id)


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    partner = Depends(get_current_partner),
):
    # Security check: partners can only modify orders containing their products
    if partner.role == "partner":
        from app.modules.products.models import Product
        has_product = (
            db.query(OrderItem)
            .join(Product)
            .filter(OrderItem.order_id == order_id, Product.brand_id == partner.brand_id)
            .first()
        )
        if not has_product:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update order belonging to another brand"
            )
            
    order = service.update_order_status(
        db,
        order_id,
        payload.status,
        tracking_number=payload.tracking_number,
        carrier=payload.carrier
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


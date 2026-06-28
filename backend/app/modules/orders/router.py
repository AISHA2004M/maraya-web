from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_partner
from app.modules.users.models import User
from app.modules.orders import service
from app.modules.orders.models import OrderItem
from app.modules.orders.schemas import OrderCreate, OrderOut, OrderStatusUpdate

router = APIRouter()


@router.post("/checkout", response_model=OrderOut, status_code=201)
def checkout(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_order(db, current_user.id, payload)


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
            
    order = service.update_order_status(db, order_id, payload.status)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

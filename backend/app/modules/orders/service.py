from sqlalchemy.orm import Session
from app.modules.orders.models import Order, OrderItem
from app.modules.orders.schemas import OrderCreate
from app.modules.products.service import get_product_by_id
from fastapi import HTTPException, status
from typing import List, Optional
import uuid


def create_order(db: Session, user_id: str, data: OrderCreate) -> Order:
    # 1. Calculate total amount and validate stock
    total_amount = 0
    order_items_to_create = []

    for item_data in data.items:
        product = get_product_by_id(db, item_data.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item_data.product_id} not found"
            )

        if product.stock_quantity < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product '{product.name}'. Available: {product.stock_quantity}"
            )

        # Update stock
        product.stock_quantity -= item_data.quantity
        
        # Calculate line cost
        total_amount += float(item_data.price_at_purchase) * item_data.quantity

        order_item = OrderItem(
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            price_at_purchase=item_data.price_at_purchase
        )
        order_items_to_create.append(order_item)

    # 2. Create the Order
    order = Order(
        user_id=user_id,
        total_amount=total_amount,
        status="pending",
        payment_method=data.payment_method,
        shipping_address=data.shipping_address,
        full_name=data.full_name,
        items=order_items_to_create
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    # 3. Dispatch luxury order confirmation email
    try:
        from app.modules.users.models import User
        user = db.query(User).filter(User.id == user_id).first()
        recipient_email = user.email if user else "customer@vrital.com"
        
        # Build items details list with names for email presentation
        email_items = []
        for it in order.items:
            prod = get_product_by_id(db, it.product_id)
            prod_name = prod.name if prod else "Exclusive Apparel"
            email_items.append({
                "name": prod_name,
                "quantity": it.quantity,
                "price": float(it.price_at_purchase)
            })

        from app.services.email_service import send_order_confirmation_email
        send_order_confirmation_email(
            recipient_email=recipient_email,
            order_id=order.id,
            customer_name=order.full_name or (user.full_name if user else "Valued Customer"),
            total_amount=float(order.total_amount),
            items=email_items,
            shipping_address=order.shipping_address or "Not Specified"
        )
    except Exception as e:
        print(f"Failed to dispatch luxury email confirmation: {e}")

    return order



def get_user_orders(db: Session, user_id: str) -> List[Order]:
    return db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()


def get_all_orders(db: Session, skip: int = 0, limit: int = 100, brand_id: Optional[int] = None) -> List[Order]:
    if brand_id is not None:
        from app.modules.products.models import Product
        orders = (
            db.query(Order)
            .join(OrderItem)
            .join(Product)
            .filter(Product.brand_id == brand_id)
            .distinct()
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        # Expunge and filter items to only include partner's brand items
        for order in orders:
            db.expunge(order)
            filtered_items = []
            new_total = 0
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product and product.brand_id == brand_id:
                    filtered_items.append(item)
                    new_total += float(item.price_at_purchase) * item.quantity
            order.items = filtered_items
            order.total_amount = new_total
        return orders
    return db.query(Order).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


def update_order_status(db: Session, order_id: str, status_str: str) -> Optional[Order]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    order.status = status_str
    db.commit()
    db.refresh(order)
    return order

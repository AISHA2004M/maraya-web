from sqlalchemy.orm import Session, joinedload
from app.modules.orders.models import Order, OrderItem, PromoCode
from app.modules.orders.schemas import (
    OrderCreate,
    PromoValidateResponse,
    OrderTrackingOut,
    PaymentIntentResponse,
)
from app.modules.products.service import get_product_by_id
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import uuid
import os



def validate_promo_code(db: Session, code_str: str, subtotal: Decimal) -> PromoValidateResponse:
    clean_code = code_str.strip().upper()
    
    # Built-in promo codes fallback if table is empty
    builtins = {
        "VRITAL10": {"percent": 10, "amount": 0, "min_spend": 50},
        "ELEGANCE20": {"percent": 20, "amount": 0, "min_spend": 150},
        "VIP50": {"percent": 0, "amount": 50, "min_spend": 200},
        "WELCOME": {"percent": 15, "amount": 0, "min_spend": 0},
    }

    promo = db.query(PromoCode).filter(PromoCode.code == clean_code, PromoCode.is_active == 1).first()
    
    discount_percent = 0
    discount_amount = Decimal("0.00")
    min_spend = Decimal("0.00")

    if promo:
        discount_percent = promo.discount_percent or 0
        discount_amount = Decimal(str(promo.discount_amount or 0))
        min_spend = Decimal(str(promo.min_spend or 0))
    elif clean_code in builtins:
        b = builtins[clean_code]
        discount_percent = b["percent"]
        discount_amount = Decimal(str(b["amount"]))
        min_spend = Decimal(str(b["min_spend"]))
    else:
        return PromoValidateResponse(
            valid=False,
            code=clean_code,
            discount_percent=0,
            discount_amount=Decimal("0.00"),
            new_subtotal=subtotal,
            message="Invalid promo code"
        )

    if subtotal < min_spend:
        return PromoValidateResponse(
            valid=False,
            code=clean_code,
            discount_percent=0,
            discount_amount=Decimal("0.00"),
            new_subtotal=subtotal,
            message=f"Minimum spend of ${min_spend} required for this code"
        )

    calculated_discount = Decimal("0.00")
    if discount_percent > 0:
        calculated_discount = (subtotal * Decimal(discount_percent) / Decimal(100)).quantize(Decimal("0.01"))
    elif discount_amount > 0:
        calculated_discount = min(discount_amount, subtotal).quantize(Decimal("0.01"))

    new_subtotal = max(Decimal("0.00"), subtotal - calculated_discount)

    return PromoValidateResponse(
        valid=True,
        code=clean_code,
        discount_percent=discount_percent,
        discount_amount=calculated_discount,
        new_subtotal=new_subtotal,
        message=f"Promo code applied successfully! Saved ${calculated_discount}"
    )


def create_payment_intent(amount: Decimal, currency: str = "usd", order_id: Optional[str] = None) -> PaymentIntentResponse:
    """Creates a Stripe PaymentIntent or realistic simulator token."""
    stripe_key = os.getenv("STRIPE_SECRET_KEY")
    if stripe_key and not stripe_key.startswith("mock_"):
        try:
            import stripe
            stripe.api_key = stripe_key
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),
                currency=currency.lower(),
                metadata={"order_id": order_id or ""},
            )
            return PaymentIntentResponse(
                client_secret=intent.client_secret,
                payment_id=intent.id,
                status=intent.status,
                amount=amount,
                currency=currency,
            )
        except Exception as e:
            print(f"Stripe error, falling back to secure simulated checkout: {e}")

    # Fallback to simulated payment intent for frictionless testing & demo
    simulated_id = f"pi_vrital_{uuid.uuid4().hex[:16]}"
    return PaymentIntentResponse(
        client_secret=f"{simulated_id}_secret_{uuid.uuid4().hex[:12]}",
        payment_id=simulated_id,
        status="requires_payment_method",
        amount=amount,
        currency=currency,
    )


def create_order(db: Session, user_id: Optional[str] = None, data: OrderCreate = None) -> Order:
    total_amount = Decimal("0.00")
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

        # Decrement stock
        product.stock_quantity -= item_data.quantity
        line_cost = Decimal(str(item_data.price_at_purchase)) * item_data.quantity
        total_amount += line_cost

        order_item = OrderItem(
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            price_at_purchase=item_data.price_at_purchase
        )
        order_items_to_create.append(order_item)

    # Apply promo discount if provided
    discount_val = Decimal("0.00")
    if data.promo_code:
        promo_res = validate_promo_code(db, data.promo_code, total_amount)
        if promo_res.valid:
            discount_val = promo_res.discount_amount
            total_amount = promo_res.new_subtotal

    # Generate tracking info
    now_utc = datetime.now(timezone.utc)
    tracking_num = f"VRTL-{now_utc.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    est_delivery = now_utc + timedelta(days=4)


    # Create Order
    order = Order(
        user_id=user_id,
        total_amount=total_amount,
        status="confirmed",
        payment_method=data.payment_method,
        shipping_address=data.shipping_address,
        full_name=data.full_name,
        promo_code=data.promo_code,
        discount_amount=discount_val,
        tracking_number=tracking_num,
        carrier="DHL Express",
        estimated_delivery=est_delivery,
        items=order_items_to_create
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    # Dispatch order confirmation email
    try:
        from app.modules.users.models import User
        user = db.query(User).filter(User.id == user_id).first()
        recipient_email = user.email if user else "customer@vrital.com"
        
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
        print(f"Failed to dispatch email confirmation: {e}")

    return order


def get_order_tracking(db: Session, order_id: str) -> OrderTrackingOut:
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    status_map = {
        "pending": {"label": "Order Placed", "progress": 15, "step": 1},
        "confirmed": {"label": "Order Confirmed", "progress": 30, "step": 1},
        "processing": {"label": "Atelier Preparation & Quality Control", "progress": 55, "step": 2},
        "shipped": {"label": "Dispatched with Carrier", "progress": 75, "step": 3},
        "out_for_delivery": {"label": "Out for Final Delivery", "progress": 90, "step": 4},
        "delivered": {"label": "Delivered to Doorstep", "progress": 100, "step": 5},
        "cancelled": {"label": "Order Cancelled", "progress": 0, "step": 0},
    }

    current_info = status_map.get(order.status.lower(), {"label": "In Progress", "progress": 50, "step": 2})

    steps = [
        {
            "title": "Order Confirmed",
            "desc": f"Received on {order.created_at.strftime('%b %d, %Y')}",
            "completed": current_info["step"] >= 1 and order.status != "cancelled",
            "current": current_info["step"] == 1,
        },
        {
            "title": "Atelier Inspection",
            "desc": "Garment quality check & luxury packaging",
            "completed": current_info["step"] >= 2 and order.status != "cancelled",
            "current": current_info["step"] == 2,
        },
        {
            "title": "Dispatched via Courier",
            "desc": f"{order.carrier or 'DHL Express'} · Tracking #{order.tracking_number or 'Assigned'}",
            "completed": current_info["step"] >= 3 and order.status != "cancelled",
            "current": current_info["step"] == 3,
        },
        {
            "title": "Out for Delivery",
            "desc": "Courier is heading to your shipping address",
            "completed": current_info["step"] >= 4 and order.status != "cancelled",
            "current": current_info["step"] == 4,
        },
        {
            "title": "Delivered",
            "desc": "Package signed and delivered",
            "completed": current_info["step"] >= 5 and order.status != "cancelled",
            "current": current_info["step"] == 5,
        },
    ]

    est_str = order.estimated_delivery.strftime("%A, %B %d") if order.estimated_delivery else "In 3-5 business days"

    return OrderTrackingOut(
        order_id=str(order.id),
        status=order.status,
        status_label=current_info["label"],
        progress_percentage=current_info["progress"],
        tracking_number=order.tracking_number,
        carrier=order.carrier or "DHL Express",
        estimated_delivery=est_str,
        created_at=order.created_at,
        shipping_address=order.shipping_address,
        total_amount=order.total_amount,
        items_count=len(order.items),
        steps=steps,
    )


def cancel_order(db: Session, order_id: str, user_id: str) -> Order:
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if str(order.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Unauthorized to cancel this order")

    if order.status in ("shipped", "delivered", "cancelled"):
        raise HTTPException(status_code=400, detail=f"Order cannot be cancelled in '{order.status}' status")

    # Restore product inventory
    for item in order.items:
        prod = get_product_by_id(db, item.product_id)
        if prod:
            prod.stock_quantity += item.quantity

    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return order


def get_user_orders(db: Session, user_id: str) -> List[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .all()
    )


def get_all_orders(db: Session, skip: int = 0, limit: int = 100, brand_id: Optional[int] = None) -> List[Order]:
    if brand_id is not None:
        from app.modules.products.models import Product
        orders = (
            db.query(Order)
            .options(joinedload(Order.items).joinedload(OrderItem.product))
            .join(OrderItem, OrderItem.order_id == Order.id)
            .join(Product, Product.id == OrderItem.product_id)
            .filter(Product.brand_id == brand_id)
            .distinct()
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        for order in orders:
            items_list = list(order.items)
            db.expunge(order)
            filtered_items = []
            new_total = 0
            for item in items_list:
                product = item.product
                if product and product.brand_id == brand_id:
                    filtered_items.append(item)
                    new_total += float(item.price_at_purchase) * item.quantity
            order.items = filtered_items
            order.total_amount = new_total
        return orders
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )



def update_order_status(db: Session, order_id: str, status_str: str, tracking_number: Optional[str] = None, carrier: Optional[str] = None) -> Optional[Order]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    order.status = status_str
    if tracking_number:
        order.tracking_number = tracking_number
    if carrier:
        order.carrier = carrier
    db.commit()
    db.refresh(order)
    return order


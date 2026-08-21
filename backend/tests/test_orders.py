"""
Orders, Promo Codes & Tracking Tests
====================================
"""
import pytest
from decimal import Decimal


def test_validate_builtin_promo(client):
    """Builtin promo codes should apply valid percentage discounts."""
    res = client.post("/api/v1/orders/apply-promo", json={
        "code": "VRITAL10",
        "subtotal": 100.00
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["discount_percent"] == 10
    assert float(data["discount_amount"]) == 10.00
    assert float(data["new_subtotal"]) == 90.00


def test_invalid_promo(client):
    """Non-existent promo codes should return valid=False."""
    res = client.post("/api/v1/orders/apply-promo", json={
        "code": "FAKECODE999",
        "subtotal": 100.00
    })
    assert res.status_code == 200
    assert res.json()["valid"] is False


def test_order_creation_and_tracking(client, auth_headers, db):
    """User creates order, checks tracking details and step pipeline."""
    from app.modules.products.models import Brand, Product

    brand = Brand(name="Chanel Test", slug="chanel-test")
    db.add(brand)
    db.commit()

    product = Product(
        name="Chanel Classic Jacket",
        price=250.00,
        main_image_url="https://example.com/jacket.jpg",
        brand_id=brand.id,
        stock_quantity=10,
    )
    db.add(product)
    db.commit()

    # Checkout
    order_res = client.post(
        "/api/v1/orders/checkout",
        headers=auth_headers,
        json={
            "full_name": "Test Buyer",
            "shipping_address": "123 Fashion Ave, Paris, 75001",
            "payment_method": "Credit Card",
            "promo_code": "VRITAL10",
            "items": [
                {
                    "product_id": str(product.id),
                    "quantity": 1,
                    "price_at_purchase": 250.00,
                }
            ]
        }
    )
    assert order_res.status_code == 201
    order_data = order_res.json()
    order_id = order_data["id"]
    assert order_data["status"] == "confirmed"

    # Track Order
    track_res = client.get(f"/api/v1/orders/track/{order_id}")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["order_id"] == order_id
    assert track_data["carrier"] == "DHL Express"
    assert len(track_data["steps"]) == 5
    assert track_data["steps"][0]["completed"] is True


def test_guest_checkout(client, db):
    """Guest user without token can checkout seamlessly."""
    from app.modules.products.models import Brand, Product

    brand = Brand(name="Guest Brand", slug="guest-brand")
    db.add(brand)
    db.commit()

    product = Product(
        name="Guest Silk Scarf",
        price=85.00,
        main_image_url="https://example.com/scarf.jpg",
        brand_id=brand.id,
        stock_quantity=5,
    )
    db.add(product)
    db.commit()

    # Checkout with NO auth headers
    res = client.post(
        "/api/v1/orders/checkout",
        json={
            "full_name": "Guest Customer",
            "shipping_address": "456 Luxury St, New York, NY",
            "payment_method": "Cash on Delivery",
            "items": [
                {
                    "product_id": str(product.id),
                    "quantity": 1,
                    "price_at_purchase": 85.00,
                }
            ]
        }
    )
    assert res.status_code == 201
    assert res.json()["status"] == "confirmed"
    assert res.json()["full_name"] == "Guest Customer"


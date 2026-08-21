"""
Wishlist Endpoint Tests
"""
import pytest


def test_wishlist_requires_auth(client):
    """Wishlist endpoints require authentication."""
    res = client.get("/api/v1/wishlist")
    assert res.status_code in (401, 403)


def test_wishlist_toggle(client, auth_headers, db):
    """User can toggle wishlist items."""
    from app.modules.products.models import Brand, Product

    # Create a test product
    brand = Brand(name="Test Brand CI", slug="test-brand-ci")
    db.add(brand)
    db.commit()

    product = Product(
        name="Test Product CI",
        price=99.99,
        main_image_url="https://example.com/img.jpg",
        brand_id=brand.id,
    )
    db.add(product)
    db.commit()

    # Toggle (add)
    res = client.post(
        f"/api/v1/wishlist/toggle?product_id={product.id}",
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["saved"] is True
    assert res.json()["wishlist_count"] == 1

    # Toggle again (remove)
    res = client.post(
        f"/api/v1/wishlist/toggle?product_id={product.id}",
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["saved"] is False
    assert res.json()["wishlist_count"] == 0

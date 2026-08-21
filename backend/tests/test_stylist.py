"""
AI Fashion Stylist Tests
========================
"""
import pytest


def test_stylist_chat_endpoint(client, db):
    """Test AI Fashion Stylist conversation and recommendations."""
    from app.modules.products.models import Brand, Product

    brand = Brand(name="Balenciaga Test", slug="balenciaga-test")
    db.add(brand)
    db.commit()

    product = Product(
        name="Balenciaga Silk Evening Blazer",
        price=750.00,
        main_image_url="https://example.com/blazer.jpg",
        brand_id=brand.id,
        editorial_tags="evening,formal,luxury",
    )
    db.add(product)
    db.commit()

    res = client.post("/api/v1/stylist/chat", json={
        "message": "I need a luxury evening blazer for a gala dinner",
        "preferred_gender": "unisex"
    })

    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["reply"]) > 0
    assert len(data["recommendations"]) > 0
    assert data["recommendations"][0]["id"] == str(product.id)


def test_social_login_google(client):
    """Test instant Google Social Login."""
    res = client.post("/api/v1/auth/social-login", json={
        "provider": "google",
        "email": "auto.google.user@vrital.com",
        "full_name": "Google Test User"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "customer"

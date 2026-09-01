import io
import uuid
from PIL import Image
from app.modules.products.models import Brand, Category, Product


def _create_sample_jpeg():
    img = Image.new("RGB", (200, 300), color=(210, 180, 150))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf


def _ensure_test_product(db):
    brand = db.query(Brand).filter(Brand.slug == "zara").first()
    if not brand:
        brand = Brand(name="Zara", slug="zara")
        db.add(brand)
        db.flush()

    cat = db.query(Category).first()
    if not cat:
        cat = Category(name="Dresses")
        db.add(cat)
        db.flush()

    prod_id = "test-tryon-prod-001"
    prod = db.query(Product).filter(Product.id == prod_id).first()
    if not prod:
        prod = Product(
            id=prod_id,
            name="Test Velvet Dress",
            description="Luxury evening velvet dress in midnight black",
            price=299.0,
            currency="USD",
            brand_id=brand.id,
            category_id=cat.id,
            main_image_url="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800",
            is_active=True,
        )
        db.add(prod)
        db.commit()
    return prod


def test_tryon_upload_and_flow(client, db, test_user, auth_headers):
    prod = _ensure_test_product(db)
    portrait_buf = _create_sample_jpeg()

    # 1. Submit try-on request
    files = {"user_image": ("portrait.jpg", portrait_buf, "image/jpeg")}
    data = {
        "product_id": prod.id,
        "model_variant": "fast",
    }
    res = client.post("/api/v1/ai/try-on", files=files, data=data, headers=auth_headers)
    assert res.status_code == 202
    res_data = res.json()
    assert "job_id" in res_data
    job_id = res_data["job_id"]
    assert res_data["status"] in ("completed", "processing", "queued")

    # 2. Check status endpoint
    status_res = client.post if False else client.get(f"/api/v1/ai/try-on/status/{job_id}")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["job_id"] == job_id

    # 3. Check result endpoint
    result_res = client.get(f"/api/v1/ai/try-on/result/{job_id}")
    assert result_res.status_code == 200
    result_data = result_res.json()
    assert result_data["job_id"] == job_id
    assert result_data["status"] in ("completed", "processing", "queued")


def test_guest_tryon_upload_and_flow(client, db):
    prod = _ensure_test_product(db)
    portrait_buf = _create_sample_jpeg()

    # 1. Submit unauthenticated guest try-on request
    files = {"user_image": ("portrait_guest.jpg", portrait_buf, "image/jpeg")}
    data = {
        "product_id": prod.id,
        "model_variant": "fast",
    }
    res = client.post("/api/v1/ai/try-on", files=files, data=data)
    assert res.status_code == 202
    res_data = res.json()
    assert "job_id" in res_data
    job_id = res_data["job_id"]
    assert res_data["status"] in ("completed", "processing", "queued")

    # 2. Guest can poll status
    status_res = client.get(f"/api/v1/ai/try-on/status/{job_id}")
    assert status_res.status_code == 200
    assert status_res.json()["job_id"] == job_id


def test_tryon_invalid_job_id_returns_404(client):
    res = client.get("/api/v1/ai/try-on/status/non-existent-or-invalid-uuid")
    assert res.status_code == 404

    res2 = client.get(f"/api/v1/ai/try-on/status/{str(uuid.uuid4())}")
    assert res2.status_code == 404


def test_tryon_quality_validation():
    import os
    from PIL import Image, ImageDraw
    from app.services.ai_client import validate_rendered_tryon_result, TryOnQualityError
    import pytest

    # 1. Reject solid color / gray canvas
    corrupted_img = Image.new("RGB", (600, 800), color=(180, 180, 180))
    with pytest.raises(TryOnQualityError):
        validate_rendered_tryon_result(corrupted_img)

    # 2. Reject image with giant gray blob over torso
    bad_torso_img = Image.new("RGB", (600, 800), color=(240, 220, 200))
    draw = ImageDraw.Draw(bad_torso_img)
    draw.rectangle([100, 200, 500, 650], fill=(128, 128, 128))
    with pytest.raises(TryOnQualityError):
        validate_rendered_tryon_result(bad_torso_img)

    # 3. Accept valid high-texture image
    random_bytes = os.urandom(600 * 800 * 3)
    valid_img = Image.frombytes("RGB", (600, 800), random_bytes)
    # Should not raise
    validate_rendered_tryon_result(valid_img)



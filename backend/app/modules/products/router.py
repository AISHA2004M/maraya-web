from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_partner, get_current_user
from app.modules.products import service
from app.modules.products.schemas import ProductOut, ProductCreate, ProductUpdate, BrandOut, CategoryOut, BrandCMSUpdate

router = APIRouter()


@router.get("/brands/all", response_model=List[BrandOut])
def list_brands(db: Session = Depends(get_db)):
    return service.get_brands(db)


@router.get("/brands/reseed-images")
def reseed_brand_images(db: Session = Depends(get_db)):
    from app.modules.products.models import Brand
    BRAND_UPDATES = {
        "zara": {
            "logo_url": "https://images.unsplash.com/photo-1590845947376-2638caa06a1a?w=400&q=80",
            "banner_url": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&q=80",
            "hero_image_url": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&q=80",
            "story_image_url": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
        },
        "nike": {
            "logo_url": "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80",
            "banner_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600&q=80",
            "hero_image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600&q=80",
            "story_image_url": "https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80"
        },
        "hm": {
            "logo_url": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80",
            "banner_url": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1600&q=80",
            "hero_image_url": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1600&q=80",
            "story_image_url": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1200&q=80"
        },
        "gucci": {
            "logo_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
            "banner_url": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80",
            "hero_image_url": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80",
            "story_image_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80"
        }
    }
    for slug, updates in BRAND_UPDATES.items():
        brand = db.query(Brand).filter(Brand.slug == slug).first()
        if brand:
            brand.logo_url = updates["logo_url"]
            brand.banner_url = updates["banner_url"]
            brand.hero_image_url = updates["hero_image_url"]
            brand.story_image_url = updates["story_image_url"]
    db.commit()
    return {"status": "success", "message": "Brand images reseeded successfully"}



@router.get("/categories/all", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return service.get_categories(db)


@router.get("/brands/slug/{slug}", response_model=BrandOut)
def get_brand_by_slug(slug: str, db: Session = Depends(get_db)):
    brand = service.get_brand_by_slug(db, slug)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


@router.patch("/brands/{brand_id}/cms", response_model=BrandOut)
def update_brand_cms(
    brand_id: int,
    data: BrandCMSUpdate,
    db: Session = Depends(get_db),
    partner = Depends(get_current_partner),
):
    if partner.role == "partner" and partner.brand_id != brand_id:
        raise HTTPException(status_code=403, detail="Cannot update another brand's settings")
    brand = service.update_brand_cms(db, brand_id, data)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


@router.get("", response_model=List[ProductOut])
def list_products(
    skip: int = 0,
    limit: int = 50,
    category_id: Optional[int] = None,
    gender: Optional[str] = None,
    brand_id: Optional[int] = None,
    partner_view: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    if partner_view and current_user and current_user.role == "partner":
        brand_id = current_user.brand_id
    return service.get_products(
        db,
        skip=skip,
        limit=limit,
        category_id=category_id,
        gender=gender,
        brand_id=brand_id,
    )


@router.get("/brands/{brand_id}", response_model=BrandOut)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    brand = service.get_brand_by_id(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = service.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductOut, status_code=201)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    partner = Depends(get_current_partner),
):
    if partner.role == "partner":
        data.brand_id = partner.brand_id
    return service.create_product(db, data)


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    partner = Depends(get_current_partner),
):
    product = service.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if partner.role == "partner":
        if product.brand_id != partner.brand_id:
            raise HTTPException(status_code=403, detail="Cannot update product of another brand")
        if data.brand_id is not None and data.brand_id != partner.brand_id:
            raise HTTPException(status_code=403, detail="Cannot change brand to another brand")
    
    updated_product = service.update_product(db, product_id, data)
    return updated_product


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    partner = Depends(get_current_partner),
):
    product = service.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if partner.role == "partner" and product.brand_id != partner.brand_id:
        raise HTTPException(status_code=403, detail="Cannot delete product of another brand")
    
    service.delete_product(db, product_id)


@router.get("/{product_id}/recommendations", response_model=List[ProductOut])
def get_product_recommendations(
    product_id: str,
    db: Session = Depends(get_db),
):
    return service.get_product_recommendations(db, product_id)





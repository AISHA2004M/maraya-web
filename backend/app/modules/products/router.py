from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_partner, get_current_user
from app.modules.products import service
from app.modules.products.schemas import ProductOut, ProductCreate, ProductUpdate, BrandOut, CategoryOut, BrandCMSUpdate, ProductSearchByImageOut

router = APIRouter()


@router.get("/brands/all", response_model=List[BrandOut])
def list_brands(db: Session = Depends(get_db)):
    return service.get_brands(db)


@router.get("/brands/reseed-images")
def reseed_brand_images(db: Session = Depends(get_db)):
    from app.modules.products.models import Brand
    BRAND_UPDATES = {
        "zara": {
            "logo_url": "https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg",
            "banner_url": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1600&q=80",
            "hero_image_url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
            "story_image_url": "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80"
        },
        "nike": {
            "logo_url": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
            "banner_url": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1600&q=80",
            "hero_image_url": "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1600&q=80",
            "story_image_url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80"
        },
        "hm": {
            "logo_url": "https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg",
            "banner_url": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=80",
            "hero_image_url": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=80",
            "story_image_url": "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1200&q=80"
        },
        "gucci": {
            "logo_url": "https://upload.wikimedia.org/wikipedia/commons/0/04/Gucci_logo.svg",
            "banner_url": "https://images.unsplash.com/photo-1583228724456-7ee16af252b4?w=1600&q=80",
            "hero_image_url": "https://images.unsplash.com/photo-1583228724456-7ee16af252b4?w=1600&q=80",
            "story_image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80"
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


@router.post("/search-by-image", response_model=List[ProductSearchByImageOut])
def search_by_image(
    file: UploadFile = File(...),
    brand_id: Optional[int] = None,
    category_id: Optional[int] = None,
    color: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    db: Session = Depends(get_db),
):
    """
    Visual search: uploads an image, gets its embedding from Gemini,
    compares it to cached embeddings of active products, and returns matches.
    """
    import json
    from app.services.vector_search import get_image_embedding, cosine_similarity
    from app.modules.products.models import Product

    try:
        # Read uploaded image bytes
        image_bytes = file.file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        # Get Gemini embedding for query image
        query_vector = get_image_embedding(image_bytes, mime_type=file.content_type or "image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process query image embedding: {str(e)}")

    # Fetch all active products
    products = db.query(Product).filter(Product.is_active == True).all()

    results = []
    for prod in products:
        # Check if product has embedding, if not try generating it on-the-fly
        prod_vector = None
        if prod.image_embedding:
            try:
                prod_vector = json.loads(prod.image_embedding)
            except Exception:
                pass

        if not prod_vector:
            # If not cached, let's attempt to precalculate and cache it now
            try:
                from app.services.vector_search import get_image_embedding_from_url
                prod_vector = get_image_embedding_from_url(prod.main_image_url)
                prod.image_embedding = json.dumps(prod_vector)
                db.commit()
            except Exception:
                continue  # Skip if we couldn't embed

        # Compute cosine similarity
        score = cosine_similarity(query_vector, prod_vector)
        
        # Store score on the transient attribute
        prod.similarity_score = score
        results.append(prod)

    # Apply filters
    if brand_id is not None:
        results = [p for p in results if p.brand_id == brand_id]
    if category_id is not None:
        results = [p for p in results if p.category_id == category_id]
    if color:
        color_clean = color.strip().lower()
        results = [p for p in results if p.color and color_clean in p.color.lower()]
    if price_min is not None:
        results = [p for p in results if float(p.price) >= price_min]
    if price_max is not None:
        results = [p for p in results if float(p.price) <= price_max]

    # Sort by similarity score descending
    results.sort(key=lambda x: x.similarity_score, reverse=True)

    return results





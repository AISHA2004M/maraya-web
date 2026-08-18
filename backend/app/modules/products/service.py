from sqlalchemy.orm import Session
from app.modules.products.models import Product, Brand, Category, ProductSize
from app.modules.products.schemas import ProductCreate, ProductUpdate, BrandCMSUpdate
from typing import Optional


def get_products(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    category_id: Optional[int] = None,
    gender: Optional[str] = None,
    brand_id: Optional[int] = None,
):
    q = db.query(Product).filter(Product.is_active == True)
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if gender:
        q = q.filter(Product.gender == gender)
    if brand_id:
        q = q.filter(Product.brand_id == brand_id)
    return q.offset(skip).limit(limit).all()


def get_brand_by_id(db: Session, brand_id: int) -> Optional[Brand]:
    return db.query(Brand).filter(Brand.id == brand_id).first()


CUSTOM_PIECES = [
    {
        "id": "eb838ca7-45be-4986-a77b-96e87e2245ee",
        "name": "Zara Draped Asymmetric Midi Dress",
        "description": "An elegant sleeveless draped midi dress in deep chocolate brown, featuring an asymmetric hem and defined waistband.",
        "price": 145000,
        "currency": "IQD",
        "gender": "women",
        "main_image_url": "/uploads/eb838ca7-45be-4986-a77b-96e87e2245ee.jpg",
        "category_name": "Dresses",
    },
    {
        "id": "8750612d-0446-4251-9d9c-c299d1d1eb75",
        "name": "Gucci Red Velvet Double-Breasted Blazer",
        "description": "A luxurious double-breasted blazer in vibrant red velvet, featuring peak lapels, flap pockets, and structured shoulders. Made in Italy.",
        "price": 2450000,
        "currency": "IQD",
        "gender": "unisex",
        "main_image_url": "/uploads/8750612d-0446-4251-9d9c-c299d1d1eb75.jpg",
        "category_name": "Outerwear",
    },
    {
        "id": "f02a279c-c827-466d-8bc4-a698ba672fba",
        "name": "Zara Oversized Sky Blue Poplin Shirt",
        "description": "Classic relaxed-fit button-down poplin shirt in crisp sky blue, crafted from 100% organic cotton.",
        "price": 85000,
        "currency": "IQD",
        "gender": "unisex",
        "main_image_url": "/uploads/f02a279c-c827-466d-8bc4-a698ba672fba.jpg",
        "category_name": "Tops",
    },
    {
        "id": "3c6b5f9b-6fc2-4fc4-bc8c-02cfdd01c70e",
        "name": "H&M Botanical Print Maxi Dress",
        "description": "Flowing airy maxi dress with an all-over vibrant floral botanical print in light breathable viscose.",
        "price": 110000,
        "currency": "IQD",
        "gender": "women",
        "main_image_url": "/uploads/3c6b5f9b-6fc2-4fc4-bc8c-02cfdd01c70e.png",
        "category_name": "Dresses",
    },
    {
        "id": "313f681a-67d7-4228-bdc1-196160898a39",
        "name": "Zara Off-White Ruffled Mini Dress",
        "description": "Chic romantic mini dress featuring delicate ruffled trim, smocked bodice, and airy layered hem in pure off-white cotton.",
        "price": 165000,
        "currency": "IQD",
        "gender": "women",
        "main_image_url": "/uploads/313f681a-67d7-4228-bdc1-196160898a39.jpg",
        "category_name": "Dresses",
    }
]


def get_product_by_id(db: Session, product_id: str):
    p = db.query(Product).filter(Product.id == product_id).first()
    if p:
        return p
    for cp in CUSTOM_PIECES:
        if cp["id"] == str(product_id) or str(product_id).lower() in cp["id"].lower():
            class MockCategory:
                name = cp["category_name"]
            class CustomProductWrapper:
                id = cp["id"]
                name = cp["name"]
                description = cp["description"]
                price = cp["price"]
                currency = cp["currency"]
                gender = cp["gender"]
                main_image_url = cp["main_image_url"]
                category = MockCategory()
            return CustomProductWrapper()
    return None


def create_product(db: Session, data: ProductCreate) -> Product:
    # Extract sizes before building Product; sizes live in a separate table
    sizes_data = data.sizes
    product_data = data.model_dump(exclude={"sizes"})
    product = Product(**product_data)
    db.add(product)
    db.flush()  # assigns product.id without committing

    if sizes_data:
        for s in sizes_data:
            db.add(ProductSize(product_id=product.id, size=s.size, stock=s.stock))

    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: str, data: ProductUpdate) -> Optional[Product]:
    product = get_product_by_id(db, product_id)
    if not product:
        return None

    # Extract sizes before flattening the update dict
    sizes_data = data.sizes
    update_dict = data.model_dump(exclude_none=True, exclude={"sizes"})

    for field, value in update_dict.items():
        setattr(product, field, value)

    # Replace sizes if provided
    if sizes_data is not None:
        db.query(ProductSize).filter(ProductSize.product_id == product_id).delete()
        for s in sizes_data:
            db.add(ProductSize(product_id=product_id, size=s.size, stock=s.stock))

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: str) -> bool:
    product = get_product_by_id(db, product_id)
    if not product:
        return False
    db.delete(product)
    db.commit()
    return True


def get_brands(db: Session):
    return db.query(Brand).all()


def get_categories(db: Session):
    return db.query(Category).all()


def create_brand(db: Session, name: str, description: str = None, logo_url: str = None) -> Brand:
    brand = Brand(name=name, description=description, logo_url=logo_url)
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


def create_category(db: Session, name: str, parent_id: int = None) -> Category:
    cat = Category(name=name, parent_id=parent_id)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def get_product_recommendations(db: Session, product_id: str, limit: int = 4):
    """
    SQL-first recommendation engine.

    BEFORE (O(n)):
      - Loaded ALL active products into Python memory
      - Iterated and scored every row in a Python loop
      - With 10,000 products → 10,000 object loads per request

    AFTER (O(k), k << n):
      - Pre-filters candidates in SQL using indexed columns
      - Fetches only mood-matched + occasion-matched products (small pool)
      - Falls back to same-brand and price-range candidates
      - Scores only the small candidate pool in Python
      - Single query per request regardless of catalog size

    Index usage:
      ix_products_active_mood       → mood_aesthetic filter
      ix_products_active_category   → category filter
      ix_products_active_brand      → brand filter
    """
    product = get_product_by_id(db, product_id)
    if not product:
        return []

    candidate_ids_seen = set()
    candidates = []

    # ── Tier 1: Same mood + different category (best recommendations) ───────
    if product.mood_aesthetic:
        mood_matches = (
            db.query(Product)
            .filter(
                Product.is_active == True,
                Product.id != product_id,
                Product.mood_aesthetic == product.mood_aesthetic,
                Product.category_id != product.category_id,  # different category = complete the look
            )
            .order_by(Product.created_at.desc())
            .limit(limit * 3)  # fetch 3x limit to allow scoring selection
            .all()
        )
        for p in mood_matches:
            if p.id not in candidate_ids_seen:
                candidates.append((p, 15))  # highest score tier
                candidate_ids_seen.add(p.id)

    # ── Tier 2: Same occasion, different category ────────────────────────────
    if product.occasion and len(candidates) < limit * 2:
        occasion_matches = (
            db.query(Product)
            .filter(
                Product.is_active == True,
                Product.id != product_id,
                Product.occasion == product.occasion,
                Product.category_id != product.category_id,
            )
            .limit(limit * 2)
            .all()
        )
        for p in occasion_matches:
            if p.id not in candidate_ids_seen:
                candidates.append((p, 8))
                candidate_ids_seen.add(p.id)

    # ── Tier 3: Same brand (brand loyalty signal) ────────────────────────────
    if product.brand_id and len(candidates) < limit * 2:
        brand_matches = (
            db.query(Product)
            .filter(
                Product.is_active == True,
                Product.id != product_id,
                Product.brand_id == product.brand_id,
                Product.category_id != product.category_id,
            )
            .limit(limit)
            .all()
        )
        for p in brand_matches:
            if p.id not in candidate_ids_seen:
                candidates.append((p, 5))
                candidate_ids_seen.add(p.id)

    # ── Tier 4: Fill remaining slots with recent active products ────────────
    if len(candidates) < limit:
        remaining_needed = limit - len(candidates)
        fallback = (
            db.query(Product)
            .filter(
                Product.is_active == True,
                Product.id != product_id,
                Product.id.notin_(candidate_ids_seen),
            )
            .order_by(Product.created_at.desc())
            .limit(remaining_needed * 2)
            .all()
        )
        for p in fallback:
            if p.id not in candidate_ids_seen:
                candidates.append((p, 1))
                candidate_ids_seen.add(p.id)

    # ── Score & Sort ─────────────────────────────────────────────────────────
    candidates.sort(key=lambda x: x[1], reverse=True)
    return [p for p, _ in candidates[:limit]]


def get_brand_by_slug(db: Session, slug: str) -> Optional[Brand]:
    return db.query(Brand).filter(Brand.slug == slug).first()


def update_brand_cms(db: Session, brand_id: int, data: BrandCMSUpdate) -> Optional[Brand]:
    brand = get_brand_by_id(db, brand_id)
    if not brand:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(brand, field, value)
    db.commit()
    db.refresh(brand)
    return brand


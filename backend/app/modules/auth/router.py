from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.modules.users.service import get_user_by_email, create_user
from app.modules.users.schemas import UserCreate

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = create_user(db, UserCreate(email=payload.email, password=payload.password, full_name=payload.full_name))
    token = create_access_token({"sub": str(user.id)})
    try:
        from app.services.email_service import send_welcome_email
        send_welcome_email(user.email, user.full_name or "Valued Member")
    except Exception as e:
        print(f"Failed to dispatch welcome email: {e}")
    return {"access_token": token, "role": user.role}


@router.post("/register-partner", response_model=TokenResponse, status_code=201)
def register_partner(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = create_user(db, UserCreate(email=payload.email, password=payload.password, full_name=payload.full_name))
    user.role = "partner"
    
    # Create brand for partner
    brand_name = payload.full_name or f"Atelier {payload.email.split('@')[0]}"
    import re
    slug = re.sub(r'[^a-z0-9]+', '-', brand_name.lower()).strip('-')
    if not slug:
        slug = "partner-brand"
        
    from app.modules.products.models import Brand
    existing_brand = db.query(Brand).filter(Brand.slug == slug).first()
    if existing_brand:
        import random
        slug = f"{slug}-{random.randint(1000, 9999)}"
        
    brand = Brand(
        name=brand_name,
        slug=slug,
        description=f"Welcome to the digital atelier of {brand_name}.",
        accent_color="#FFFFFF",
        font_family="Hanken Grotesk, sans-serif"
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)
    
    user.brand_id = brand.id
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    try:
        from app.services.email_service import send_welcome_email
        send_welcome_email(user.email, user.full_name or "Boutique Partner")
    except Exception as e:
        print(f"Failed to dispatch welcome email: {e}")
    return {"access_token": token, "role": user.role, "brand_slug": brand.slug}



@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    brand_slug = user.brand.slug if (user.brand and user.role == "partner") else None
    return {"access_token": token, "role": user.role, "brand_slug": brand_slug}

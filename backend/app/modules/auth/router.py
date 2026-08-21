from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    verify_password,
    create_access_token,
    create_password_reset_token,
    verify_password_reset_token,
    hash_password,
)
from app.modules.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    SocialLoginRequest,
)

from app.modules.users.service import get_user_by_email, create_user
from app.modules.users.schemas import UserCreate
from app.core.rate_limit import auth_limit
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
@auth_limit
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
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
@auth_limit
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    brand_slug = user.brand.slug if (user.brand and user.role == "partner") else None
    return {"access_token": token, "role": user.role, "brand_slug": brand_slug}


@router.post("/forgot-password")
@auth_limit
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a password reset token and dispatch or return it."""
    user = get_user_by_email(db, payload.email)
    # Even if email doesn't exist, return generic success to prevent email enumeration attacks
    if not user:
        return {"message": "If this email is registered, a password reset link has been generated."}
    
    reset_token = create_password_reset_token(user.email)
    
    # Try sending email if service configured
    try:
        from app.services.email_service import send_email
        reset_url = f"https://vrital.com/reset-password?token={reset_token}"
        send_email(
            to=user.email,
            subject="Reset Your Vrital Password",
            body=f"Hello {user.full_name or 'Member'},\n\nClick the link below to reset your password:\n{reset_url}\n\nThis link will expire in 1 hour."
        )
    except Exception:
        pass
        
    return {
        "message": "If this email is registered, a password reset link has been generated.",
        "reset_token": reset_token, # Available in response for instant development / demo testing
    }


@router.post("/reset-password")
@auth_limit
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify reset token and update user password."""
    email = verify_password_reset_token(payload.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password has been successfully reset. You may now log in."}


@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Logged in user password change."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
        
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/social-login", response_model=TokenResponse)
def social_login(payload: SocialLoginRequest, db: Session = Depends(get_db)):
    """Instant Google / Apple Sign-In handler."""
    user = get_user_by_email(db, payload.email)
    if not user:
        # Register new user seamlessly
        import uuid
        dummy_pass = f"social_{payload.provider}_{uuid.uuid4().hex[:16]}"
        user = create_user(db, UserCreate(
            email=payload.email,
            password=dummy_pass,
            full_name=payload.full_name or f"{payload.provider.title()} Member"
        ))
    
    token = create_access_token({"sub": str(user.id)})
    brand_slug = user.brand.slug if (user.brand and user.role == "partner") else None
    return {"access_token": token, "role": user.role, "brand_slug": brand_slug}


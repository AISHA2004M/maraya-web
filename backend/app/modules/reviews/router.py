"""
Reviews Router
==============
GET  /reviews/{product_id}          — Get all reviews for a product (public)
GET  /reviews/{product_id}/summary  — Get aggregated rating stats (public)
POST /reviews                       — Create a review (auth required)
PATCH /reviews/{review_id}          — Update own review (auth required)
DELETE /reviews/{review_id}         — Delete own review (auth required)
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.modules.reviews.service import (
    get_product_reviews,
    get_product_rating_summary,
    create_review,
    update_review,
    delete_review,
)
from app.modules.reviews.schemas import ReviewOut, ReviewCreate, ReviewUpdate, ProductRatingSummary
from app.modules.users.models import User

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/{product_id}", response_model=List[ReviewOut])
def list_reviews(
    product_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Public: List all reviews for a product, newest first."""
    reviews = get_product_reviews(db, product_id, skip=skip, limit=limit)
    result = []
    for r in reviews:
        user = db.query(User).filter(User.id == r.user_id).first()
        result.append(ReviewOut(
            id=r.id,
            product_id=r.product_id,
            rating=r.rating,
            title=r.title,
            body=r.body,
            verified_purchase=bool(r.verified_purchase),
            created_at=r.created_at,
            reviewer_name=user.full_name.split()[0] if user and user.full_name else "Customer",
        ))
    return result


@router.get("/{product_id}/summary", response_model=ProductRatingSummary)
def rating_summary(product_id: str, db: Session = Depends(get_db)):
    """Public: Get aggregated rating stats for a product."""
    return get_product_rating_summary(db, product_id)


@router.post("", response_model=ReviewOut, status_code=201)
def create(data: ReviewCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Auth required: Create a new review."""
    review = create_review(db, str(current_user.id), data)
    return ReviewOut(
        id=review.id,
        product_id=review.product_id,
        rating=review.rating,
        title=review.title,
        body=review.body,
        verified_purchase=bool(review.verified_purchase),
        created_at=review.created_at,
        reviewer_name=current_user.full_name.split()[0] if current_user.full_name else "You",
    )


@router.patch("/{review_id}", response_model=ReviewOut)
def update(
    review_id: int,
    data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Auth required: Update your own review."""
    review = update_review(db, review_id, str(current_user.id), data)
    return ReviewOut(
        id=review.id,
        product_id=review.product_id,
        rating=review.rating,
        title=review.title,
        body=review.body,
        verified_purchase=bool(review.verified_purchase),
        created_at=review.created_at,
        reviewer_name=current_user.full_name.split()[0] if current_user.full_name else "You",
    )


@router.delete("/{review_id}", status_code=204)
def delete(
    review_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Auth required: Delete your own review."""
    delete_review(db, review_id, str(current_user.id))

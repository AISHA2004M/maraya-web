"""
Reviews Service
===============
CRUD operations for product reviews and aggregated rating stats.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.modules.reviews.models import Review
from app.modules.reviews.schemas import ReviewCreate, ReviewUpdate
from app.modules.orders.models import Order, OrderItem
from fastapi import HTTPException


def get_product_reviews(db: Session, product_id: str, skip: int = 0, limit: int = 20) -> list[Review]:
    return (
        db.query(Review)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_product_rating_summary(db: Session, product_id: str) -> dict:
    stats = (
        db.query(
            func.coalesce(func.avg(Review.rating), 0).label("avg_rating"),
            func.count(Review.id).label("total_reviews"),
        )
        .filter(Review.product_id == str(product_id))
        .first()
    )

    if not stats or stats.total_reviews == 0:
        return {
            "product_id": product_id,
            "average_rating": 0.0,
            "total_reviews": 0,
            "rating_breakdown": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        }

    # Group counts by star rating
    breakdown_rows = (
        db.query(Review.rating, func.count(Review.id))
        .filter(Review.product_id == str(product_id))
        .group_by(Review.rating)
        .all()
    )
    breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating_val, count in breakdown_rows:
        if rating_val in breakdown:
            breakdown[rating_val] = count

    return {
        "product_id": product_id,
        "average_rating": round(float(stats.avg_rating), 1),
        "total_reviews": stats.total_reviews,
        "rating_breakdown": breakdown,
    }



def create_review(db: Session, user_id: str, data: ReviewCreate) -> Review:
    # Check if user already reviewed this product
    existing = (
        db.query(Review)
        .filter(Review.user_id == user_id, Review.product_id == data.product_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You have already reviewed this product")

    # Check if verified purchase
    verified = False
    try:
        bought = (
            db.query(OrderItem)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(Order.user_id == user_id, OrderItem.product_id == data.product_id)
            .first()
        )
        verified = bought is not None
    except Exception:
        pass

    review = Review(
        user_id=user_id,
        product_id=data.product_id,
        rating=data.rating,
        title=data.title,
        body=data.body,
        verified_purchase=1 if verified else 0,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def update_review(db: Session, review_id: int, user_id: str, data: ReviewUpdate) -> Review:
    review = db.query(Review).filter(Review.id == review_id, Review.user_id == user_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if data.rating is not None:
        review.rating = data.rating
    if data.title is not None:
        review.title = data.title
    if data.body is not None:
        review.body = data.body
    db.commit()
    db.refresh(review)
    return review


def delete_review(db: Session, review_id: int, user_id: str) -> None:
    review = db.query(Review).filter(Review.id == review_id, Review.user_id == user_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()

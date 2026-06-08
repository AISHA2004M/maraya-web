"""
Performance Indexes — Catalog & Recommendation Query Optimization
==================================================================
Revision: perf_indexes_v1
Revises:  1481f6e79e5c
Create Date: 2026-06-06

INDEXES ADDED:
--------------

products table:
  ix_products_active_category  — Composite: (is_active, category_id)
    Used by: GET /products?category_id=X
    Without: Full table scan on products
    With:    Index range scan on is_active=true + category filter

  ix_products_active_brand     — Composite: (is_active, brand_id)
    Used by: GET /products?brand_id=X

  ix_products_active_mood      — Composite: (is_active, mood_aesthetic)
    Used by: Recommendation engine filtering by mood

  ix_products_price            — Single: (price)
    Used by: Price range filtering, sorting by price

  ix_products_created_at       — Single: (created_at DESC)
    Used by: Pagination and "new arrivals" ordering

  ix_products_is_active        — Single: (is_active)
    Used by: All product list queries base filter

tryon_sessions table:
  ix_tryon_sessions_user_status — Composite: (user_id, status)
    Used by: GET /tryon/my-sessions and analytics dashboard

  ix_tryon_sessions_created_at  — Single: (created_at)
    Used by: Analytics time-range queries

orders table:
  ix_orders_created_at          — Single: (created_at)
    Used by: Revenue analytics aggregation

  ix_orders_user_id             — Single: (user_id)
    Used by: Order history lookup

order_items table:
  ix_order_items_product_id     — Single: (product_id)
    Used by: Brand analytics JOIN

ESTIMATED IMPACT:
  Catalog queries:         10-50ms → 1-5ms
  Recommendation engine:  50-200ms → 5-20ms
  Analytics aggregation:  100-500ms → 10-50ms
"""

from alembic import op
import sqlalchemy as sa

# Revision identifiers
revision = "perf_indexes_v1"
down_revision = "1481f6e79e5c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── products table ──────────────────────────────────────────────────────

    # Composite: most common query pattern (is_active=True + category filter)
    op.create_index(
        "ix_products_active_category",
        "products",
        ["is_active", "category_id"],
        unique=False,
    )

    # Composite: brand-filtered catalog pages
    op.create_index(
        "ix_products_active_brand",
        "products",
        ["is_active", "brand_id"],
        unique=False,
    )

    # Composite: mood-based filtering (recommendation engine)
    op.create_index(
        "ix_products_active_mood",
        "products",
        ["is_active", "mood_aesthetic"],
        unique=False,
    )

    # Single: price sorting and range filters
    op.create_index(
        "ix_products_price",
        "products",
        ["price"],
        unique=False,
    )

    # Single: chronological ordering for "new arrivals"
    op.create_index(
        "ix_products_created_at",
        "products",
        ["created_at"],
        unique=False,
    )

    # Single: base filter used in virtually every product query
    op.create_index(
        "ix_products_is_active",
        "products",
        ["is_active"],
        unique=False,
    )

    # ── tryon_sessions table ─────────────────────────────────────────────────

    # Composite: user's own session history (authentication-scoped queries)
    op.create_index(
        "ix_tryon_sessions_user_status",
        "tryon_sessions",
        ["user_id", "status"],
        unique=False,
    )

    # Single: analytics time-range aggregation
    op.create_index(
        "ix_tryon_sessions_created_at",
        "tryon_sessions",
        ["created_at"],
        unique=False,
    )

    # ── orders table ─────────────────────────────────────────────────────────

    # Single: revenue aggregation by time period
    op.create_index(
        "ix_orders_created_at",
        "orders",
        ["created_at"],
        unique=False,
    )

    # Single: user's order history
    op.create_index(
        "ix_orders_user_id",
        "orders",
        ["user_id"],
        unique=False,
    )

    # ── order_items table ────────────────────────────────────────────────────

    # Single: brand analytics JOIN performance
    op.create_index(
        "ix_order_items_product_id",
        "order_items",
        ["product_id"],
        unique=False,
    )


def downgrade() -> None:
    # Drop all performance indexes (reverse of upgrade)
    op.drop_index("ix_order_items_product_id", table_name="order_items")
    op.drop_index("ix_orders_user_id", table_name="orders")
    op.drop_index("ix_orders_created_at", table_name="orders")
    op.drop_index("ix_tryon_sessions_created_at", table_name="tryon_sessions")
    op.drop_index("ix_tryon_sessions_user_status", table_name="tryon_sessions")
    op.drop_index("ix_products_is_active", table_name="products")
    op.drop_index("ix_products_created_at", table_name="products")
    op.drop_index("ix_products_price", table_name="products")
    op.drop_index("ix_products_active_mood", table_name="products")
    op.drop_index("ix_products_active_brand", table_name="products")
    op.drop_index("ix_products_active_category", table_name="products")

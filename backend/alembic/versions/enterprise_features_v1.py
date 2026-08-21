"""Enterprise features: wishlist_items and reviews tables

Revision ID: enterprise_features_v1
Revises: perf_indexes_v1
Create Date: 2026-08-21
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'enterprise_features_v1'
down_revision = 'perf_indexes_v1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Wishlist Items ────────────────────────────────────────────────────────
    op.create_table(
        'wishlist_items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'product_id', name='uq_wishlist_user_product'),
    )
    op.create_index('ix_wishlist_user', 'wishlist_items', ['user_id'])
    op.create_index('ix_wishlist_product', 'wishlist_items', ['product_id'])

    # ── Reviews ───────────────────────────────────────────────────────────────
    op.create_table(
        'reviews',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=36), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=True),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('verified_purchase', sa.Integer(), server_default='0', nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='ck_review_rating_range'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'product_id', name='uq_review_user_product'),
    )
    op.create_index('ix_reviews_product', 'reviews', ['product_id'])
    op.create_index('ix_reviews_user', 'reviews', ['user_id'])
    op.create_index('ix_reviews_rating', 'reviews', ['product_id', 'rating'])


def downgrade() -> None:
    op.drop_table('reviews')
    op.drop_table('wishlist_items')

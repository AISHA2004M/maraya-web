"""add missing tryon fields

Revision ID: 9f8e7d6c5b4a
Revises: ace2b1c21ec0
Create Date: 2026-06-30 02:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f8e7d6c5b4a'
down_revision: Union[str, None] = 'ace2b1c21ec0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing columns to tryon_sessions
    with op.batch_alter_table('tryon_sessions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('progress', sa.Integer(), server_default='0', nullable=False))
        batch_op.add_column(sa.Column('image_hash', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('model_variant', sa.String(length=50), nullable=True))
        batch_op.create_index('ix_tryon_sessions_image_hash', ['image_hash'], unique=False)

    # Add missing columns to user_images
    with op.batch_alter_table('user_images', schema=None) as batch_op:
        batch_op.add_column(sa.Column('image_hash', sa.String(length=64), nullable=True))
        batch_op.create_index('ix_user_images_image_hash', ['image_hash'], unique=False)


def downgrade() -> None:
    # Remove columns from user_images
    with op.batch_alter_table('user_images', schema=None) as batch_op:
        batch_op.drop_index('ix_user_images_image_hash')
        batch_op.drop_column('image_hash')

    # Remove columns from tryon_sessions
    with op.batch_alter_table('tryon_sessions', schema=None) as batch_op:
        batch_op.drop_index('ix_tryon_sessions_image_hash')
        batch_op.drop_column('model_variant')
        batch_op.drop_column('image_hash')
        batch_op.drop_column('progress')

"""add iraq product details fields

Revision ID: ace2b1c21ec0
Revises: f27859d96e21
Create Date: 2026-06-23 19:22:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ace2b1c21ec0'
down_revision: Union[str, None] = 'f27859d96e21'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.add_column(sa.Column('garment_length', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('care_instructions', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('color', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('material_details', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('origin_country', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('garment_weight', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('sleeve_length', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('lining', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('closure_type', sa.String(length=100), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.drop_column('closure_type')
        batch_op.drop_column('lining')
        batch_op.drop_column('sleeve_length')
        batch_op.drop_column('garment_weight')
        batch_op.drop_column('origin_country')
        batch_op.drop_column('material_details')
        batch_op.drop_column('color')
        batch_op.drop_column('care_instructions')
        batch_op.drop_column('garment_length')

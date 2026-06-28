"""add shipping address and full name to orders

Revision ID: f27859d96e21
Revises: 5b9770ab1bbe
Create Date: 2026-06-23 18:59:15.146074

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f27859d96e21'
down_revision: Union[str, None] = '5b9770ab1bbe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.add_column(sa.Column('shipping_address', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('full_name', sa.String(length=255), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.drop_column('full_name')
        batch_op.drop_column('shipping_address')
    # ### end Alembic commands ###

"""clear_tryon_cache_for_nike

Revision ID: 27e0e5adca24
Revises: 8b001c47be5f
Create Date: 2026-07-24 01:44:59.026522

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '27e0e5adca24'
down_revision: Union[str, None] = '8b001c47be5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DELETE FROM tryon_sessions WHERE product_id = '05fbdcdd-5128-413c-8981-765d11a700d9'")


def downgrade() -> None:
    pass

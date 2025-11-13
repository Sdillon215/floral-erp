"""add user role

Revision ID: e163a994b7c8
Revises: d331b85686e2
Create Date: 2025-11-12 16:53:07.785858

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e163a994b7c8'
down_revision: Union[str, Sequence[str], None] = 'd331b85686e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("user") as batch_op:
        batch_op.add_column(
            sa.Column('role', sa.String(length=50), nullable=False, server_default='sales')
        )
    op.execute("UPDATE \"user\" SET role='sales' WHERE role IS NULL")
    with op.batch_alter_table("user") as batch_op:
        batch_op.alter_column('role', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("user") as batch_op:
        batch_op.drop_column('role')

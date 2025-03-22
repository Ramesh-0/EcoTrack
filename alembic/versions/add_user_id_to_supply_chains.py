"""add_user_id_to_supply_chains

Revision ID: add_user_id_column
Create Date: 2023-03-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_user_id_column'
down_revision = '0732e6a85847'  # This should match your previous migration
branch_labels = None
depends_on = None


def upgrade():
    # Add user_id column to supply_chains table
    op.add_column('supply_chains', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_supply_chains_user_id_users',
        'supply_chains', 'users',
        ['user_id'], ['id']
    )


def downgrade():
    # Drop the user_id column from supply_chains table
    op.drop_constraint('fk_supply_chains_user_id_users', 'supply_chains', type_='foreignkey')
    op.drop_column('supply_chains', 'user_id') 
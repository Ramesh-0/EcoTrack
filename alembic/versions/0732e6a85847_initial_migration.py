"""Initial migration

Revision ID: 0732e6a85847
Revises: 
Create Date: 2025-03-21 15:47:48.136899

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0732e6a85847'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('test_table')
    op.add_column('companies', sa.Column('location', sa.String(length=100), nullable=True))
    op.add_column('companies', sa.Column('size', sa.String(length=20), nullable=True))
    op.alter_column('companies', 'name',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('companies', 'industry',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.drop_index('ix_companies_name', table_name='companies')
    op.create_index(op.f('ix_companies_name'), 'companies', ['name'], unique=False)
    op.drop_column('companies', 'region')
    op.drop_column('companies', 'carbon_footprint')
    op.add_column('emissions_data', sa.Column('scope', sa.String(length=20), nullable=True))
    op.add_column('emissions_data', sa.Column('category', sa.String(length=50), nullable=True))
    op.add_column('emissions_data', sa.Column('emission_value', sa.Float(), nullable=True))
    op.add_column('emissions_data', sa.Column('emission_unit', sa.String(length=20), nullable=True))
    op.add_column('emissions_data', sa.Column('reporting_period', sa.String(length=50), nullable=True))
    op.add_column('emissions_data', sa.Column('data_quality', sa.String(length=20), nullable=True))
    op.alter_column('emissions_data', 'user_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.drop_column('emissions_data', 'unit')
    op.drop_column('emissions_data', 'co2_per_unit')
    op.drop_column('emissions_data', 'date')
    op.drop_column('emissions_data', 'amount')
    op.drop_column('emissions_data', 'description')
    op.drop_column('emissions_data', 'type')
    op.add_column('materials', sa.Column('name', sa.String(length=100), nullable=True))
    op.add_column('materials', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('materials', sa.Column('category', sa.String(length=50), nullable=True))
    op.add_column('materials', sa.Column('emission_factor', sa.Float(), nullable=True))
    op.add_column('materials', sa.Column('emission_unit', sa.String(length=20), nullable=True))
    op.create_index(op.f('ix_materials_name'), 'materials', ['name'], unique=False)
    op.drop_constraint(None, 'materials', type_='foreignkey')
    op.drop_column('materials', 'transportation_distance')
    op.drop_column('materials', 'transportation_type')
    op.drop_column('materials', 'quantity')
    op.drop_column('materials', 'notes')
    op.drop_column('materials', 'transportation_date')
    op.drop_column('materials', 'material_type')
    op.drop_column('materials', 'supply_chain_id')
    op.add_column('suppliers', sa.Column('contact_info', sa.String(length=200), nullable=True))
    op.add_column('suppliers', sa.Column('company_id', sa.Integer(), nullable=True))
    op.alter_column('suppliers', 'name',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('suppliers', 'location',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.create_index(op.f('ix_suppliers_name'), 'suppliers', ['name'], unique=False)
    op.create_foreign_key(None, 'suppliers', 'companies', ['company_id'], ['id'])
    op.drop_column('suppliers', 'emission_ratings')
    op.add_column('supply_chains', sa.Column('company_id', sa.Integer(), nullable=True))
    op.add_column('supply_chains', sa.Column('supplier_id', sa.Integer(), nullable=True))
    op.add_column('supply_chains', sa.Column('tier', sa.Integer(), nullable=True))
    op.add_column('supply_chains', sa.Column('material_id', sa.Integer(), nullable=True))
    op.add_column('supply_chains', sa.Column('quantity', sa.Float(), nullable=True))
    op.add_column('supply_chains', sa.Column('unit', sa.String(length=20), nullable=True))
    op.drop_constraint(None, 'supply_chains', type_='foreignkey')
    op.create_foreign_key(None, 'supply_chains', 'materials', ['material_id'], ['id'])
    op.create_foreign_key(None, 'supply_chains', 'suppliers', ['supplier_id'], ['id'])
    op.create_foreign_key(None, 'supply_chains', 'companies', ['company_id'], ['id'])
    op.drop_column('supply_chains', 'date')
    op.drop_column('supply_chains', 'user_id')
    op.drop_column('supply_chains', 'supplier_name')
    op.add_column('users', sa.Column('role', sa.String(length=20), nullable=True))
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'is_superuser')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('users', sa.Column('is_superuser', sa.BOOLEAN(), nullable=True))
    op.add_column('users', sa.Column('is_active', sa.BOOLEAN(), nullable=True))
    op.drop_column('users', 'role')
    op.add_column('supply_chains', sa.Column('supplier_name', sa.VARCHAR(), nullable=False))
    op.add_column('supply_chains', sa.Column('user_id', sa.INTEGER(), nullable=True))
    op.add_column('supply_chains', sa.Column('date', sa.DATETIME(), nullable=False))
    op.drop_constraint(None, 'supply_chains', type_='foreignkey')
    op.drop_constraint(None, 'supply_chains', type_='foreignkey')
    op.drop_constraint(None, 'supply_chains', type_='foreignkey')
    op.create_foreign_key(None, 'supply_chains', 'users', ['user_id'], ['id'])
    op.drop_column('supply_chains', 'unit')
    op.drop_column('supply_chains', 'quantity')
    op.drop_column('supply_chains', 'material_id')
    op.drop_column('supply_chains', 'tier')
    op.drop_column('supply_chains', 'supplier_id')
    op.drop_column('supply_chains', 'company_id')
    op.add_column('suppliers', sa.Column('emission_ratings', sa.FLOAT(), nullable=False))
    op.drop_constraint(None, 'suppliers', type_='foreignkey')
    op.drop_index(op.f('ix_suppliers_name'), table_name='suppliers')
    op.alter_column('suppliers', 'location',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('suppliers', 'name',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.drop_column('suppliers', 'company_id')
    op.drop_column('suppliers', 'contact_info')
    op.add_column('materials', sa.Column('supply_chain_id', sa.INTEGER(), nullable=True))
    op.add_column('materials', sa.Column('material_type', sa.VARCHAR(length=14), nullable=False))
    op.add_column('materials', sa.Column('transportation_date', sa.DATETIME(), nullable=False))
    op.add_column('materials', sa.Column('notes', sa.TEXT(), nullable=True))
    op.add_column('materials', sa.Column('quantity', sa.FLOAT(), nullable=False))
    op.add_column('materials', sa.Column('transportation_type', sa.VARCHAR(length=5), nullable=False))
    op.add_column('materials', sa.Column('transportation_distance', sa.FLOAT(), nullable=False))
    op.create_foreign_key(None, 'materials', 'supply_chains', ['supply_chain_id'], ['id'])
    op.drop_index(op.f('ix_materials_name'), table_name='materials')
    op.drop_column('materials', 'emission_unit')
    op.drop_column('materials', 'emission_factor')
    op.drop_column('materials', 'category')
    op.drop_column('materials', 'description')
    op.drop_column('materials', 'name')
    op.add_column('emissions_data', sa.Column('type', sa.VARCHAR(), nullable=False))
    op.add_column('emissions_data', sa.Column('description', sa.TEXT(), nullable=True))
    op.add_column('emissions_data', sa.Column('amount', sa.FLOAT(), nullable=False))
    op.add_column('emissions_data', sa.Column('date', sa.DATETIME(), nullable=False))
    op.add_column('emissions_data', sa.Column('co2_per_unit', sa.FLOAT(), nullable=False))
    op.add_column('emissions_data', sa.Column('unit', sa.VARCHAR(), nullable=False))
    op.alter_column('emissions_data', 'user_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.drop_column('emissions_data', 'data_quality')
    op.drop_column('emissions_data', 'reporting_period')
    op.drop_column('emissions_data', 'emission_unit')
    op.drop_column('emissions_data', 'emission_value')
    op.drop_column('emissions_data', 'category')
    op.drop_column('emissions_data', 'scope')
    op.add_column('companies', sa.Column('carbon_footprint', sa.FLOAT(), nullable=True))
    op.add_column('companies', sa.Column('region', sa.VARCHAR(), nullable=True))
    op.drop_index(op.f('ix_companies_name'), table_name='companies')
    op.create_index('ix_companies_name', 'companies', ['name'], unique=False)
    op.alter_column('companies', 'industry',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('companies', 'name',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.drop_column('companies', 'size')
    op.drop_column('companies', 'location')
    op.create_table('test_table',
    sa.Column('id', sa.INTEGER(), nullable=True),
    sa.Column('name', sa.TEXT(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ### 
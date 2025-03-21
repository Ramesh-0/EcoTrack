from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base

# User Roles
ROLE_ADMIN = "admin"
ROLE_USER = "user"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(100))
    role = Column(String(20), default=ROLE_USER)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="users")
    emissions_data = relationship("EmissionsData", back_populates="user")

    def __init__(self, username=None, email=None, hashed_password=None, role=ROLE_USER, company_id=None):
        self.username = username
        self.email = email
        self.hashed_password = hashed_password
        self.role = role
        self.company_id = company_id

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    description = Column(Text, nullable=True)
    industry = Column(String(50), nullable=True)
    location = Column(String(100), nullable=True)
    size = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="company")
    suppliers = relationship("Supplier", back_populates="company")
    emissions_data = relationship("EmissionsData", back_populates="company")
    supply_chains = relationship("SupplyChain", back_populates="company")

    def __init__(self, name=None, description=None, industry=None, location=None, size=None):
        self.name = name
        self.description = description
        self.industry = industry
        self.location = location
        self.size = size

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    description = Column(Text, nullable=True)
    contact_info = Column(String(200), nullable=True)
    location = Column(String(100), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="suppliers")
    emissions_data = relationship("EmissionsData", back_populates="supplier")
    supply_chains = relationship("SupplyChain", back_populates="supplier")

    def __init__(self, name=None, description=None, contact_info=None, location=None, company_id=None):
        self.name = name
        self.description = description
        self.contact_info = contact_info
        self.location = location
        self.company_id = company_id

class EmissionsData(Base):
    __tablename__ = "emissions_data"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    scope = Column(String(20), nullable=True)
    category = Column(String(50), nullable=True)
    emission_value = Column(Float, nullable=True)
    emission_unit = Column(String(20), nullable=True)
    reporting_period = Column(String(50), nullable=True)
    data_quality = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="emissions_data")
    supplier = relationship("Supplier", back_populates="emissions_data")
    user = relationship("User", back_populates="emissions_data")

    def __init__(self, company_id=None, supplier_id=None, user_id=None, scope=None, category=None, 
                 emission_value=None, emission_unit=None, reporting_period=None, data_quality=None):
        self.company_id = company_id
        self.supplier_id = supplier_id
        self.user_id = user_id
        self.scope = scope
        self.category = category
        self.emission_value = emission_value
        self.emission_unit = emission_unit
        self.reporting_period = reporting_period
        self.data_quality = data_quality

class SupplyChain(Base):
    __tablename__ = "supply_chains"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    tier = Column(Integer, nullable=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    quantity = Column(Float, nullable=True)
    unit = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="supply_chains")
    supplier = relationship("Supplier", back_populates="supply_chains")
    material = relationship("Material", back_populates="supply_chains")

    def __init__(self, company_id=None, supplier_id=None, tier=None, material_id=None, quantity=None, unit=None):
        self.company_id = company_id
        self.supplier_id = supplier_id
        self.tier = tier
        self.material_id = material_id
        self.quantity = quantity
        self.unit = unit

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)
    emission_factor = Column(Float, nullable=True)
    emission_unit = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    supply_chains = relationship("SupplyChain", back_populates="material")

    def __init__(self, name=None, description=None, category=None, emission_factor=None, emission_unit=None):
        self.name = name
        self.description = description
        self.category = category
        self.emission_factor = emission_factor
        self.emission_unit = emission_unit

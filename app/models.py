from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, CheckConstraint, Boolean, Enum, Date, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import enum

class TransportationType(str, enum.Enum):
    ROAD = 'Road'
    RAIL = 'Rail'
    AIR = 'Air'
    SEA = 'Sea'
    MIXED = 'Mixed'

class MaterialType(str, enum.Enum):
    RAW_MATERIALS = 'Raw Materials'
    COMPONENTS = 'Components'
    FINISHED_GOODS = 'Finished Goods'
    PACKAGING = 'Packaging'
    OTHER = 'Other'

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    industry = Column(String, nullable=False)
    region = Column(String)
    carbon_footprint = Column(Float)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="company")
    emissions_data = relationship("EmissionData", back_populates="company")

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    emission_ratings = Column(Float, nullable=False)
    location = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    emissions_data = relationship("EmissionData", back_populates="supplier")

    __table_args__ = (
        CheckConstraint('emission_ratings >= 0', name='check_emission_ratings_positive'),
    )

class EmissionData(Base):
    __tablename__ = "emissions_data"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # e.g., 'electricity', 'transport', etc.
    date = Column(DateTime, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    co2_per_unit = Column(Float, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    unit = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="emissions")
    company = relationship("Company", back_populates="emissions_data")
    supplier = relationship("Supplier", back_populates="emissions_data")

class SupplyChain(Base):
    __tablename__ = "supply_chains"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    supplier_name = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="supply_chains")
    materials = relationship("Material", back_populates="supply_chain", cascade="all, delete-orphan")

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    supply_chain_id = Column(Integer, ForeignKey("supply_chains.id"))
    material_type = Column(Enum(MaterialType), nullable=False)
    quantity = Column(Float, nullable=False)
    transportation_type = Column(Enum(TransportationType), nullable=False)
    transportation_distance = Column(Float, nullable=False)
    transportation_date = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    supply_chain = relationship("SupplyChain", back_populates="materials")

    __table_args__ = (
        CheckConstraint('quantity >= 0', name='check_quantity_positive'),
        CheckConstraint('transportation_distance >= 0', name='check_distance_positive'),
    )

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="users")
    emissions = relationship("EmissionData", back_populates="user")
    supply_chains = relationship("SupplyChain", back_populates="user")

    def set_password(self, password: str):
        from app.auth import pwd_context
        self.hashed_password = pwd_context.hash(password)

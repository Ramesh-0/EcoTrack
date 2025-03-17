from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app import models, schemas
import logging
from datetime import datetime
from typing import List

logger = logging.getLogger(__name__)

def create_company(db: Session, company: schemas.CompanyCreate):
    try:
        db_company = models.Company(**company.dict())
        db.add(db_company)
        db.commit()
        db.refresh(db_company)
        return db_company
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error while creating company: {str(e)}")
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating company: {str(e)}")
        raise

def get_company(db: Session, company_id: int):
    return db.query(models.Company).filter(models.Company.id == company_id).first()

def get_companies(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.Company).offset(skip).limit(limit).all()

def delete_company(db: Session, company_id: int):
    try:
        company = get_company(db, company_id)
        if company:
            db.delete(company)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting company: {str(e)}")
        raise

def create_supplier(db: Session, supplier: schemas.SupplierCreate):
    try:
        # Check if supplier with same name already exists
        existing_supplier = db.query(models.Supplier).filter(models.Supplier.name == supplier.name).first()
        if existing_supplier:
            raise ValueError(f"Supplier with name '{supplier.name}' already exists")

        db_supplier = models.Supplier(
            name=supplier.name,
            emission_ratings=supplier.emission_ratings,
            location=supplier.location,
            description=supplier.description,
            created_at=datetime.utcnow()
        )
        db.add(db_supplier)
        db.commit()
        db.refresh(db_supplier)
        return db_supplier
    except ValueError as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating supplier: {str(e)}")
        raise e

def get_supplier(db: Session, supplier_id: int):
    return db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()

def get_suppliers(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.Supplier).offset(skip).limit(limit).all()

def delete_supplier(db: Session, supplier_id: int):
    try:
        supplier = get_supplier(db, supplier_id)
        if supplier:
            db.delete(supplier)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting supplier: {str(e)}")
        raise

def create_emissions_data(db: Session, emissions_data: schemas.EmissionsDataCreate):
    try:
        # Verify company exists
        company = get_company(db, emissions_data.company_id)
        if not company:
            raise ValueError(f"Company with id {emissions_data.company_id} not found")
        
        # Verify supplier exists if provided
        if emissions_data.supplier_id:
            supplier = get_supplier(db, emissions_data.supplier_id)
            if not supplier:
                raise ValueError(f"Supplier with id {emissions_data.supplier_id} not found")
        
        db_emissions_data = models.EmissionData(**emissions_data.dict())
        db.add(db_emissions_data)
        db.commit()
        db.refresh(db_emissions_data)
        return db_emissions_data
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error while creating emissions data: {str(e)}")
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating emissions data: {str(e)}")
        raise

def get_emissions_data(db: Session, emissions_id: int):
    return db.query(models.EmissionData).filter(models.EmissionData.id == emissions_id).first()

def get_all_emissions_data(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.EmissionData).offset(skip).limit(limit).all()

def delete_emissions_data(db: Session, emissions_id: int):
    try:
        emissions_data = get_emissions_data(db, emissions_id)
        if emissions_data:
            db.delete(emissions_data)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting emissions data: {str(e)}")
        raise

def create_supply_chain(db: Session, supply_chain: schemas.SupplyChainCreate, user_id: int):
    try:
        # Create supply chain record
        db_supply_chain = models.SupplyChain(
            supplier_name=supply_chain.supplier_name,
            date=supply_chain.date,
            user_id=user_id
        )
        db.add(db_supply_chain)
        db.flush()  # Get the ID without committing

        # Create materials
        for material in supply_chain.materials:
            db_material = models.Material(
                material_type=material.material_type,
                quantity=material.quantity,
                transportation_type=material.transportation_type,
                transportation_distance=material.transportation_distance,
                transportation_date=material.transportation_date,
                notes=material.notes,
                supply_chain_id=db_supply_chain.id
            )
            db.add(db_material)

        db.commit()
        db.refresh(db_supply_chain)
        return db_supply_chain
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating supply chain: {str(e)}")
        raise

def get_user_supply_chains(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.SupplyChain)\
        .filter(models.SupplyChain.user_id == user_id)\
        .order_by(models.SupplyChain.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()

def get_supply_chain(db: Session, supply_chain_id: int, user_id: int):
    return db.query(models.SupplyChain)\
        .filter(
            models.SupplyChain.id == supply_chain_id,
            models.SupplyChain.user_id == user_id
        )\
        .first()

def delete_supply_chain(db: Session, supply_chain_id: int, user_id: int):
    try:
        supply_chain = get_supply_chain(db, supply_chain_id, user_id)
        if supply_chain:
            db.delete(supply_chain)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting supply chain: {str(e)}")
        raise

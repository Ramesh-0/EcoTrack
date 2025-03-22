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
            user_id=user_id
        )
        
        # Additional fields if needed (might need to adjust)
        if hasattr(supply_chain, 'supplier_name'):
            # Look up or create a supplier
            supplier = db.query(models.Supplier).filter(models.Supplier.name == supply_chain.supplier_name).first()
            if supplier:
                db_supply_chain.supplier_id = supplier.id
            
        if hasattr(supply_chain, 'date'):
            db_supply_chain.created_at = supply_chain.date
        
        db.add(db_supply_chain)
        db.flush()  # Get the ID without committing

        # Create materials - update to handle properly
        if supply_chain.materials and len(supply_chain.materials) > 0:
            # Get first material for now (can be updated to handle multiple later)
            material = supply_chain.materials[0]
            
            # Find or create the material
            material_name = material.material_type.value if hasattr(material, 'material_type') else "Unknown"
            db_material = db.query(models.Material).filter(models.Material.name == material_name).first()
            
            if not db_material:
                db_material = models.Material(
                    name=material_name,
                    description=material.notes if hasattr(material, 'notes') else None
                )
                db.add(db_material)
                db.flush()
            
            # Update supply chain with material ID
            db_supply_chain.material_id = db_material.id
            
            # Add quantity if available
            if hasattr(material, 'quantity'):
                db_supply_chain.quantity = material.quantity

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

def create_user(db: Session, user_data: schemas.UserCreate):
    """Create a new user"""
    try:
        # Check if user with same email or username exists
        existing_user = db.query(models.User).filter(
            (models.User.email == user_data.email) | 
            (models.User.username == user_data.username)
        ).first()
        
        if existing_user:
            if existing_user.email == user_data.email:
                raise ValueError(f"Email {user_data.email} is already registered")
            else:
                raise ValueError(f"Username {user_data.username} is already taken")

        # Check if passwords match
        if user_data.password != user_data.confirm_password:
            raise ValueError("Passwords do not match")
            
        # Create new user
        new_user = models.User(
            username=user_data.username,
            email=user_data.email,
            is_active=True,
            is_superuser=False
        )
        
        # Set password hash
        new_user.set_password(user_data.password)
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
        
    except ValueError as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user: {str(e)}")
        raise

def get_user(db: Session, user_id: int):
    """Get a user by ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    """Get a user by email"""
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    """Get a user by username"""
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 10):
    """Get all users with pagination"""
    return db.query(models.User).offset(skip).limit(limit).all()

def update_user(db: Session, user_id: int, user_data: schemas.UserUpdate, current_user_id: int):
    """Update a user"""
    try:
        # Check if user exists and is the current user or an admin
        db_user = get_user(db, user_id)
        if not db_user:
            raise ValueError(f"User with ID {user_id} not found")
            
        if user_id != current_user_id:
            current_user = get_user(db, current_user_id)
            if not current_user or current_user.role != models.ROLE_ADMIN:
                raise ValueError("You can only update your own profile")
        
        # Update username if provided and not already taken
        if user_data.username and user_data.username != db_user.username:
            existing_user = get_user_by_username(db, user_data.username)
            if existing_user and existing_user.id != user_id:
                raise ValueError(f"Username {user_data.username} is already taken")
            db_user.username = user_data.username
        
        # Update email if provided and not already taken
        if user_data.email and user_data.email != db_user.email:
            existing_user = get_user_by_email(db, user_data.email)
            if existing_user and existing_user.id != user_id:
                raise ValueError(f"Email {user_data.email} is already registered")
            db_user.email = user_data.email
        
        # Update password if provided
        if user_data.current_password and user_data.new_password:
            # Import verify_password from auth
            from app.auth import verify_password
            
            # Verify current password
            if not verify_password(user_data.current_password, db_user.hashed_password):
                raise ValueError("Current password is incorrect")
                
            # Check if new password and confirm password match
            if user_data.new_password != user_data.confirm_new_password:
                raise ValueError("New passwords do not match")
                
            # Set new password
            db_user.set_password(user_data.new_password)
        
        # Update timestamp
        db_user.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_user)
        return db_user
        
    except ValueError as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating user: {str(e)}")
        raise

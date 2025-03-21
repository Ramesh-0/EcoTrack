import os
import logging
from sqlalchemy import inspect
from app.database import Base, engine, SessionLocal
from app import models
from passlib.context import CryptContext

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password):
    return pwd_context.hash(password)

def create_tables():
    """Create database tables directly using SQLAlchemy models"""
    try:
        # Drop all tables if they exist
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        if existing_tables:
            logger.info(f"Found existing tables: {existing_tables}")
            Base.metadata.drop_all(engine)
            logger.info("Dropped existing tables")
        
        # Create all tables
        Base.metadata.create_all(engine)
        logger.info("Created database tables")
        
        return True
    except Exception as e:
        logger.error(f"Error creating tables: {str(e)}")
        return False

def create_sample_data():
    """Create sample data in the database"""
    try:
        db = SessionLocal()
        
        # Create admin user
        admin_user = models.User(
            username="admin",
            email="admin@example.com",
            hashed_password=hash_password("adminpassword"),
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        logger.info("Created admin user")
        
        # Create a regular user
        user = models.User(
            username="user",
            email="user@example.com",
            hashed_password=hash_password("userpassword"),
            role="user"
        )
        db.add(user)
        db.commit()
        logger.info("Created regular user")
        
        # Create a sample company
        company = models.Company(
            name="Sample Company",
            description="A sample company for testing",
            industry="Technology",
            location="New York, USA",
            size="Medium"
        )
        db.add(company)
        db.commit()
        logger.info("Created sample company")
        
        # Create a sample supplier
        supplier = models.Supplier(
            name="Sample Supplier",
            description="A sample supplier for testing",
            contact_info="contact@supplier.com",
            location="California, USA",
            company_id=company.id
        )
        db.add(supplier)
        db.commit()
        logger.info("Created sample supplier")
        
        # Create sample materials
        materials = [
            models.Material(
                name="Steel",
                description="Common building material",
                category="Metals",
                emission_factor=1.8,
                emission_unit="kg CO2e/kg"
            ),
            models.Material(
                name="Aluminum",
                description="Lightweight metal",
                category="Metals",
                emission_factor=8.24,
                emission_unit="kg CO2e/kg"
            ),
            models.Material(
                name="Plastic",
                description="Polymer material",
                category="Polymers",
                emission_factor=3.5,
                emission_unit="kg CO2e/kg"
            )
        ]
        for material in materials:
            db.add(material)
        db.commit()
        logger.info("Created sample materials")
        
        # Create sample emissions data
        emissions = models.EmissionsData(
            company_id=company.id,
            supplier_id=supplier.id,
            user_id=user.id,
            scope="Scope 1",
            category="Energy",
            emission_value=125.5,
            emission_unit="kg CO2e",
            reporting_period="Q1 2025",
            data_quality="High"
        )
        db.add(emissions)
        db.commit()
        logger.info("Created sample emissions data")
        
        # Create sample supply chain data
        supply_chain = models.SupplyChain(
            company_id=company.id,
            supplier_id=supplier.id,
            tier=1,
            material_id=materials[0].id,
            quantity=1000,
            unit="kg"
        )
        db.add(supply_chain)
        db.commit()
        logger.info("Created sample supply chain data")
        
        db.close()
        return True
    except Exception as e:
        logger.error(f"Error creating sample data: {str(e)}")
        return False

if __name__ == "__main__":
    if create_tables():
        create_sample_data()
        logger.info("Database setup complete")
    else:
        logger.error("Failed to create database tables") 
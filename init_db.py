#!/usr/bin/env python
import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect
from sqlalchemy.exc import SQLAlchemyError
from app.database import Base
from app import models
from app.database import engine
from passlib.context import CryptContext

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password):
    return pwd_context.hash(password)

def create_admin_user(db_session):
    """Create an admin user if one doesn't exist"""
    from sqlalchemy.orm import Session
    
    # Check if admin user exists
    admin_exists = db_session.query(models.User).filter(models.User.email == "admin@example.com").first()
    
    if not admin_exists:
        # Create admin user
        admin_user = models.User(
            username="admin",
            email="admin@example.com",
            hashed_password=hash_password("adminpassword"),
            role="admin"
        )
        db_session.add(admin_user)
        db_session.commit()
        logger.info("Admin user created")
    else:
        logger.info("Admin user already exists")

def create_sample_data(db_session):
    """Create sample data for testing"""
    from sqlalchemy.orm import Session
    
    # Check if we have any companies
    company_count = db_session.query(models.Company).count()
    
    if company_count == 0:
        # Create a sample company
        sample_company = models.Company(
            name="Sample Company",
            description="A sample company for testing",
            industry="Technology",
            location="New York, USA",
            size="Medium"
        )
        db_session.add(sample_company)
        db_session.commit()
        logger.info("Sample company created")
        
        # Create a sample supplier
        sample_supplier = models.Supplier(
            name="Sample Supplier",
            description="A sample supplier for testing",
            contact_info="contact@supplier.com",
            location="California, USA",
            company_id=sample_company.id
        )
        db_session.add(sample_supplier)
        db_session.commit()
        logger.info("Sample supplier created")
        
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
            db_session.add(material)
        
        db_session.commit()
        logger.info("Sample materials created")
    else:
        logger.info("Sample data already exists")

def init_db():
    """Initialize the database tables and create sample data"""
    try:
        # Create all tables
        Base.metadata.create_all(engine)
        logger.info("Database tables created")
        
        # Create a session
        from sqlalchemy.orm import sessionmaker
        Session = sessionmaker(bind=engine)
        db_session = Session()
        
        # Create admin user and sample data
        create_admin_user(db_session)
        create_sample_data(db_session)
        
        # Close session
        db_session.close()
        
        logger.info("Database initialization complete")
    except SQLAlchemyError as e:
        logger.error(f"Database initialization error: {str(e)}")
        raise

if __name__ == "__main__":
    init_db() 
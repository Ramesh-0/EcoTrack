#!/usr/bin/env python
"""
Database seeding script.
This script will:
1. Connect to the SQLite database
2. Seed the database with initial data for testing
"""

import os
import sys
import logging
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def create_test_users(db):
    """Create test users"""
    try:
        from app.models import User
        from app.auth import pwd_context
        
        logger.info("Creating test users...")
        
        # Check if users already exist
        existing_users = db.query(User).all()
        if existing_users:
            logger.info(f"Users already exist in the database. Skipping user creation.")
            return existing_users
        
        # Create admin user
        admin_user = User(
            username="admin",
            email="admin@example.com",
            is_active=True,
            is_superuser=True,
            hashed_password=pwd_context.hash("admin123")
        )
        
        # Create regular user
        regular_user = User(
            username="user",
            email="user@example.com",
            is_active=True,
            is_superuser=False,
            hashed_password=pwd_context.hash("user123")
        )
        
        db.add_all([admin_user, regular_user])
        db.commit()
        
        logger.info(f"Created {db.query(User).count()} test users")
        return db.query(User).all()
    except Exception as e:
        logger.error(f"Error creating test users: {str(e)}")
        logger.error(traceback.format_exc())
        db.rollback()
        return []

def create_test_companies(db):
    """Create test companies"""
    try:
        from app.models import Company
        
        logger.info("Creating test companies...")
        
        # Check if companies already exist
        existing_companies = db.query(Company).all()
        if existing_companies:
            logger.info(f"Companies already exist in the database. Skipping company creation.")
            return existing_companies
        
        companies = [
            Company(
                name="EcoTech Solutions",
                industry="Technology",
                region="North America",
                carbon_footprint=random.uniform(500, 2000),
                description="A technology company focused on sustainable solutions"
            ),
            Company(
                name="GreenEnergy Corp",
                industry="Energy",
                region="Europe",
                carbon_footprint=random.uniform(1000, 5000),
                description="Renewable energy provider"
            ),
            Company(
                name="NatureFirst Manufacturing",
                industry="Manufacturing",
                region="Asia",
                carbon_footprint=random.uniform(3000, 8000),
                description="Eco-friendly manufacturing company"
            )
        ]
        
        db.add_all(companies)
        db.commit()
        
        logger.info(f"Created {db.query(Company).count()} test companies")
        return db.query(Company).all()
    except Exception as e:
        logger.error(f"Error creating test companies: {str(e)}")
        logger.error(traceback.format_exc())
        db.rollback()
        return []

def create_test_suppliers(db):
    """Create test suppliers"""
    try:
        from app.models import Supplier
        
        logger.info("Creating test suppliers...")
        
        # Check if suppliers already exist
        existing_suppliers = db.query(Supplier).all()
        if existing_suppliers:
            logger.info(f"Suppliers already exist in the database. Skipping supplier creation.")
            return existing_suppliers
        
        suppliers = [
            Supplier(
                name="EcoMaterials Inc",
                description="Supplier of eco-friendly raw materials",
                emission_ratings=3.5,
                location="California, USA"
            ),
            Supplier(
                name="GreenComponents Ltd",
                description="Low-carbon component manufacturer",
                emission_ratings=2.8,
                location="Berlin, Germany"
            ),
            Supplier(
                name="SustainablePack",
                description="Sustainable packaging solutions",
                emission_ratings=1.9,
                location="Tokyo, Japan"
            )
        ]
        
        db.add_all(suppliers)
        db.commit()
        
        logger.info(f"Created {db.query(Supplier).count()} test suppliers")
        return db.query(Supplier).all()
    except Exception as e:
        logger.error(f"Error creating test suppliers: {str(e)}")
        logger.error(traceback.format_exc())
        db.rollback()
        return []

def seed_database():
    """Main function to seed the database"""
    logger.info("Starting database seeding...")
    
    try:
        # Import here to avoid potential circular imports
        from app.database import SessionLocal, test_db_connection
        from app.models import User, Company, Supplier, EmissionData, SupplyChain, Material
        from app.models import MaterialType, TransportationType
        
        # Test database connection
        if not test_db_connection():
            logger.error("Database connection failed. Make sure the database is initialized.")
            sys.exit(1)
        
        # Get a database session
        db = SessionLocal()
        
        try:
            # Seed the database
            users = create_test_users(db)
            if not users:
                logger.warning("No users created, skipping rest of seed data")
                return
                
            companies = create_test_companies(db)
            if not companies:
                logger.warning("No companies created, skipping related seed data")
                return
                
            suppliers = create_test_suppliers(db)
            if not suppliers:
                logger.warning("No suppliers created, skipping related seed data")
                return
            
            logger.info("Database seeding completed successfully!")
        except Exception as e:
            logger.error(f"Error seeding database: {str(e)}")
            logger.error(traceback.format_exc())
            db.rollback()
            sys.exit(1)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error during database setup: {str(e)}")
        logger.error(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    seed_database() 
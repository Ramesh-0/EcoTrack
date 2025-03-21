#!/usr/bin/env python
"""
Script to run the Carbon Footprint Tracker application.
This will:
1. Check if the PostgreSQL database exists
2. Initialize the database if needed
3. Seed the database with test data if needed
4. Start the FastAPI server
"""

import os
import sys
import logging
import subprocess
import time
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def check_database():
    """Check if PostgreSQL is running and the database exists"""
    try:
        # Run the database initialization script
        logger.info("Checking database connection...")
        from app.database import test_db_connection
        
        if test_db_connection():
            logger.info("Database connection successful")
            return True
        else:
            logger.error("Database connection failed")
            return False
    except Exception as e:
        logger.error(f"Error checking database: {str(e)}")
        return False

def initialize_database():
    """Initialize the database"""
    try:
        logger.info("Initializing database...")
        subprocess.run([sys.executable, "init_db.py"], check=True)
        logger.info("Database initialized successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Error initializing database: {str(e)}")
        return False

def seed_database():
    """Seed the database with test data"""
    try:
        logger.info("Seeding database with test data...")
        subprocess.run([sys.executable, "seed_db.py"], check=True)
        logger.info("Database seeded successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Error seeding database: {str(e)}")
        return False

def start_server():
    """Start the FastAPI server"""
    try:
        logger.info("Starting FastAPI server...")
        subprocess.run(["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"], check=True)
    except subprocess.CalledProcessError as e:
        logger.error(f"Error starting server: {str(e)}")
        sys.exit(1)
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
        sys.exit(0)

def main():
    """Main function to run the application"""
    logger.info("Starting Carbon Footprint Tracker application...")
    
    # Initialize database if needed
    if not check_database():
        if not initialize_database():
            logger.error("Failed to initialize database. Exiting.")
            sys.exit(1)
            
        # Wait a moment for the database to be ready
        time.sleep(2)
    
    # Seed database with test data if needed
    seed_database()
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main() 
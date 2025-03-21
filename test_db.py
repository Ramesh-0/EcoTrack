#!/usr/bin/env python
import os
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Database file path
DB_FILE = os.getenv("DB_FILE", "./carbon_footprint.json")

def main():
    """Test database connection and operations"""
    try:
        # Check if database file exists
        if not os.path.exists(DB_FILE):
            raise FileNotFoundError(f"Database file not found: {DB_FILE}")
        
        # Load database
        with open(DB_FILE, 'r') as f:
            db = json.load(f)
        
        # Print database contents
        logger.info(f"Database loaded from {DB_FILE}")
        
        # Check users
        users = db.get("users", [])
        logger.info(f"Found {len(users)} users")
        for user in users:
            logger.info(f"User: {user['username']}, Email: {user['email']}, Role: {user['role']}")
        
        # Add a test company
        companies = db.get("companies", [])
        company_id = len(companies) + 1
        test_company = {
            "id": company_id,
            "name": "Test Company",
            "description": "A test company for carbon footprint tracking",
            "industry": "Technology",
            "location": "Virtual",
            "size": "Small",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        companies.append(test_company)
        db["companies"] = companies
        
        # Save database
        with open(DB_FILE, 'w') as f:
            json.dump(db, f, indent=2, default=str)
        
        logger.info(f"Added test company: {test_company['name']}")
        logger.info(f"Database saved to {DB_FILE}")
        logger.info("Database tests completed successfully")
    except Exception as e:
        logger.error(f"Error testing database: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    main() 
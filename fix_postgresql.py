import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def fix_postgresql_database(database_url=None):
    try:
        # Use provided database_url or get from environment
        if not database_url:
            database_url = os.getenv("DATABASE_URL")
        
        if not database_url or not database_url.startswith("postgresql"):
            # Build connection string from components
            host = input("PostgreSQL host [localhost]: ") or "localhost"
            port = input("PostgreSQL port [5432]: ") or "5432"
            dbname = input("PostgreSQL database name [carbon_footprint]: ") or "carbon_footprint"
            user = input("PostgreSQL username [postgres]: ") or "postgres"
            password = input("PostgreSQL password: ")
            
            database_url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
        
        logger.info(f"Using database URL: {database_url}")
        
        # Create SQLAlchemy engine
        engine = create_engine(database_url)
        
        # Connect to the database
        with engine.connect() as connection:
            # Check if the column exists
            check_column_sql = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'supply_chains' AND column_name = 'user_id';
            """)
            
            result = connection.execute(check_column_sql)
            column_exists = result.fetchone()
            
            if column_exists:
                logger.info("Column 'user_id' already exists in the supply_chains table.")
            else:
                # Add the column to PostgreSQL
                logger.info("Adding user_id column to supply_chains table in PostgreSQL...")
                add_column_sql = text("""
                    ALTER TABLE supply_chains 
                    ADD COLUMN user_id INTEGER REFERENCES users(id);
                """)
                connection.execute(add_column_sql)
                connection.commit()
                logger.info("Column 'user_id' added successfully to PostgreSQL database!")
        
        return True
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Starting PostgreSQL database fix...")
    
    success = fix_postgresql_database()
    
    if success:
        logger.info("PostgreSQL database fix completed successfully.")
        sys.exit(0)
    else:
        logger.error("PostgreSQL database fix failed.")
        sys.exit(1) 
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

def add_user_id_column_to_supply_chains():
    try:
        # Get database URL from environment
        database_url = os.getenv("DATABASE_URL", "sqlite:///./carbon_footprint.db")
        logger.info(f"Using database URL: {database_url}")
        
        # Create SQLAlchemy engine
        if database_url.startswith("sqlite"):
            engine = create_engine(database_url, connect_args={"check_same_thread": False})
        else:
            engine = create_engine(database_url)
        
        # Connect to the database
        with engine.connect() as connection:
            # Check if we're using SQLite or PostgreSQL
            if database_url.startswith("sqlite"):
                # Check if the column exists in SQLite
                result = connection.execute(text("PRAGMA table_info(supply_chains)"))
                columns = [row[1] for row in result.fetchall()]
                
                if "user_id" in columns:
                    logger.info("Column 'user_id' already exists in the supply_chains table.")
                else:
                    # Add the column to SQLite
                    logger.info("Adding user_id column to supply_chains table in SQLite...")
                    connection.execute(text("ALTER TABLE supply_chains ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                    connection.commit()
                    logger.info("Column 'user_id' added successfully to SQLite database!")
            else:
                # For PostgreSQL
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
    logger.info("Starting database update...")
    
    # Always use SQLite for our fix to ensure it works
    os.environ["DATABASE_URL"] = "sqlite:///./carbon_footprint.db"
    success = add_user_id_column_to_supply_chains()
    
    if success:
        logger.info("Database update completed successfully.")
        sys.exit(0)
    else:
        logger.error("Database update failed.")
        sys.exit(1) 
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
import os
from dotenv import load_dotenv
import logging
import traceback
from sqlalchemy.ext.declarative import declarative_base

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get DATABASE_URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./carbon_footprint.db")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in environment variables")

logger.info("Database URL validated")

try:
    # Create SQLAlchemy engine with appropriate connection arguments
    connect_args = {}
    if DATABASE_URL.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    
    engine = create_engine(
        DATABASE_URL,
        echo=True,  # Log all SQL statements
        connect_args=connect_args
    )
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {str(e)}\n{traceback.format_exc()}")
    raise

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Handle SQLAlchemy 1.x and 2.x compatibility for Base
try:
    from sqlalchemy.orm import DeclarativeBase  # SQLAlchemy 2.x
    class Base(DeclarativeBase):
        pass
except ImportError:
    from sqlalchemy.ext.declarative import declarative_base  # SQLAlchemy 1.x
    Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def drop_all_tables():
    """Drop all tables in the database."""
    try:
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        logger.info("All tables dropped successfully")
    except Exception as e:
        logger.error(f"Error dropping tables: {str(e)}")
        raise

def init_db():
    """Initialize the database, creating all tables."""
    try:
        # Drop existing tables first
        drop_all_tables()
        
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

def test_db_connection():
    """Test database connection and create tables if they don't exist."""
    try:
        db = SessionLocal()
        # Try to execute a simple query
        result = db.execute(text("SELECT 1")).scalar()
        if result == 1:
            logger.info("Database connection test successful")
            return True
        else:
            raise Exception("Database connection test failed: unexpected result")
    except Exception as e:
        logger.error(f"Database connection test failed: {str(e)}\n{traceback.format_exc()}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    test_db_connection()

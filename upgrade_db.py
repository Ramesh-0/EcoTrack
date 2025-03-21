import os
import sys
import subprocess
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

def upgrade_database():
    """Apply Alembic migrations to upgrade the database"""
    try:
        # Check if alembic command is available
        try:
            subprocess.run(["alembic", "--version"], check=True, capture_output=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("Alembic command not found. Make sure alembic is installed.")
            sys.exit(1)
        
        # Apply migrations
        logger.info("Applying database migrations...")
        subprocess.run(["alembic", "upgrade", "head"], check=True)
        
        logger.info("Database migrations applied successfully")
    except Exception as e:
        logger.error(f"Error applying migrations: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    upgrade_database() 
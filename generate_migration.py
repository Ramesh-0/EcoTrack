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

def generate_migration():
    """Generate initial Alembic migration"""
    try:
        # Check if alembic command is available
        try:
            subprocess.run(["alembic", "--version"], check=True, capture_output=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("Alembic command not found. Make sure alembic is installed.")
            sys.exit(1)
        
        # Generate initial migration
        logger.info("Generating initial migration...")
        subprocess.run(["alembic", "revision", "--autogenerate", "-m", "Initial migration"], check=True)
        
        logger.info("Initial migration generated successfully")
    except Exception as e:
        logger.error(f"Error generating migration: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    generate_migration() 
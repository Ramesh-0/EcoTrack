import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

try:
    from app.main import app
    logger.info("Successfully imported app from app.main")
except Exception as e:
    logger.error(f"Error importing app: {str(e)}")
    raise

if __name__ == "__main__":
    logger.info("Starting server...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, log_level="debug") 
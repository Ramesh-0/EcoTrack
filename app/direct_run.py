import sys
import os
from pathlib import Path

# Add parent directory to path
parent_dir = str(Path(__file__).parent.parent.absolute())
sys.path.insert(0, parent_dir)

# Try to import and run the FastAPI app
try:
    import uvicorn
    
    if __name__ == "__main__":
        print("Starting server with direct access...")
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
except ImportError as e:
    print(f"Error importing required modules: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error starting server: {e}")
    sys.exit(1) 
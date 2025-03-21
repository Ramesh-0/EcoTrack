#!/usr/bin/env python
"""
Simplified script to run the Carbon Footprint Tracker backend
"""

import os
import sys
import subprocess
import sqlite3

def check_sqlite_setup():
    """Set up SQLite database"""
    try:
        print("Setting up SQLite database...")
        # Create database file
        conn = sqlite3.connect("./carbon_footprint.db")
        conn.close()
        print("SQLite database file created successfully")
        return True
    except Exception as e:
        print(f"Error setting up SQLite: {str(e)}")
        return False

def run_uvicorn():
    """Run the FastAPI server using uvicorn"""
    try:
        print("Starting the FastAPI server...")
        # Use subprocess to run uvicorn
        cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
        print(f"Running command: {' '.join(cmd)}")
        
        process = subprocess.Popen(cmd)
        process.wait()  # Wait for the process to complete
    except Exception as e:
        print(f"Error starting server: {str(e)}")
        sys.exit(1)

def main():
    """Main function to run the application"""
    print("Starting Carbon Footprint Tracker application...")
    
    # Set up SQLite database
    if not check_sqlite_setup():
        print("Failed to set up SQLite database. Exiting.")
        sys.exit(1)
    
    # Run the server
    run_uvicorn()

if __name__ == "__main__":
    main() 
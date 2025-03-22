import sqlite3
import os
import sys

def fix_supply_chains_table():
    # Connect to the database
    try:
        conn = sqlite3.connect('carbon_footprint.db')
        cursor = conn.cursor()
        print("Successfully connected to the database")
        
        # Check if the column already exists
        cursor.execute("PRAGMA table_info(supply_chains)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        print(f"Current columns in supply_chains table: {column_names}")
        
        if 'user_id' not in column_names:
            print("Adding user_id column to supply_chains table...")
            
            # Add the user_id column
            cursor.execute("ALTER TABLE supply_chains ADD COLUMN user_id INTEGER REFERENCES users(id)")
            
            # Commit the changes
            conn.commit()
            print("Column added successfully!")
        else:
            print("user_id column already exists in supply_chains table. No changes needed.")
        
        # Close the connection
        conn.close()
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("Starting database fix...")
    success = fix_supply_chains_table()
    
    if success:
        print("Database fix completed successfully.")
        sys.exit(0)
    else:
        print("Database fix failed.")
        sys.exit(1) 
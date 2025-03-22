import sys
import os
import psycopg2
from psycopg2 import sql
from configparser import ConfigParser

def get_db_config(filename='database.ini', section='postgresql'):
    parser = ConfigParser()
    # Check if the file exists
    if not os.path.isfile(filename):
        # Create a sample config file
        parser['postgresql'] = {
            'host': 'localhost',
            'database': 'carbon_footprint',
            'user': 'postgres',
            'password': 'your_password'
        }
        with open(filename, 'w') as f:
            parser.write(f)
        print(f"Created sample config file {filename}. Please update it with your database credentials.")
        sys.exit(1)
    
    parser.read(filename)
    
    # Get section
    config = {}
    if parser.has_section(section):
        params = parser.items(section)
        for param in params:
            config[param[0]] = param[1]
    else:
        raise Exception(f'Section {section} not found in the {filename} file')
    
    return config

def add_user_id_column():
    conn = None
    try:
        # Read database configuration
        params = get_db_config()
        
        # Connect to the PostgreSQL server
        print('Connecting to the PostgreSQL database...')
        conn = psycopg2.connect(**params)
        
        # Create a cursor
        cur = conn.cursor()
        
        # Check if the user_id column already exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'supply_chains' AND column_name = 'user_id';
        """)
        
        column_exists = cur.fetchone()
        
        if column_exists:
            print("Column 'user_id' already exists in the supply_chains table.")
        else:
            # Add the user_id column
            print("Adding user_id column to the supply_chains table...")
            cur.execute("""
                ALTER TABLE supply_chains 
                ADD COLUMN user_id INTEGER REFERENCES users(id);
            """)
            
            # Commit the changes
            conn.commit()
            print("Column 'user_id' added successfully!")
        
        # Close communication with the database
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error: {error}")
        return False
    finally:
        if conn is not None:
            conn.close()
            print('Database connection closed.')
    
    return True

if __name__ == '__main__':
    print("Starting database update...")
    success = add_user_id_column()
    
    if success:
        print("Database update completed successfully.")
        sys.exit(0)
    else:
        print("Database update failed.")
        sys.exit(1) 
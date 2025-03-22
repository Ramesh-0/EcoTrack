import os
import sys
from dotenv import load_dotenv
import psycopg2
from configparser import ConfigParser

# Load environment variables
load_dotenv()

def get_db_config_from_env():
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url or not database_url.startswith("postgresql"):
        print("No PostgreSQL connection string found in environment variables.")
        return None
    
    # Parse the DATABASE_URL
    # Format: postgresql://user:password@host:port/dbname
    try:
        # Remove the protocol part
        db_info = database_url.split("//")[1]
        
        # Split auth info from host info
        auth_host = db_info.split("@")
        
        if len(auth_host) > 1:
            auth = auth_host[0]
            host_db = auth_host[1]
        else:
            auth = ""
            host_db = auth_host[0]
        
        # Get user and password from auth
        if ":" in auth:
            user, password = auth.split(":")
        else:
            user = auth
            password = ""
        
        # Get host, port and dbname
        if "/" in host_db:
            host_port, dbname = host_db.split("/")
        else:
            host_port = host_db
            dbname = ""
        
        # Split host and port if port is provided
        if ":" in host_port:
            host, port = host_port.split(":")
        else:
            host = host_port
            port = "5432"  # Default PostgreSQL port
        
        return {
            "host": host,
            "database": dbname,
            "user": user,
            "password": password,
            "port": port
        }
    except Exception as e:
        print(f"Error parsing DATABASE_URL: {str(e)}")
        return None

def get_db_config_from_file(filename='database.ini', section='postgresql'):
    parser = ConfigParser()
    
    if not os.path.isfile(filename):
        print(f"Config file {filename} not found.")
        return None
    
    parser.read(filename)
    
    # Get section
    if not parser.has_section(section):
        print(f"Section {section} not found in {filename}")
        return None
    
    config = {}
    for param in parser.items(section):
        config[param[0]] = param[1]
    
    return config

def run_sql_file(sql_file):
    # Try to get connection parameters from different sources
    config = get_db_config_from_env() or get_db_config_from_file()
    
    if not config:
        print("Could not determine database connection parameters.")
        return False
    
    try:
        # Read the SQL file
        with open(sql_file, 'r') as f:
            sql = f.read()
        
        # Connect to the database
        print(f"Connecting to PostgreSQL database: {config['database']} on {config['host']}...")
        conn = psycopg2.connect(**config)
        conn.autocommit = True
        
        # Create a cursor and execute the SQL
        with conn.cursor() as cur:
            print(f"Executing SQL from file: {sql_file}")
            cur.execute(sql)
            print("SQL executed successfully!")
        
        # Close the connection
        conn.close()
        print("Database connection closed.")
        return True
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_sql.py <sql_file>")
        sys.exit(1)
    
    sql_file = sys.argv[1]
    
    if not os.path.isfile(sql_file):
        print(f"SQL file {sql_file} not found.")
        sys.exit(1)
    
    print(f"Running SQL file: {sql_file}")
    success = run_sql_file(sql_file)
    
    if success:
        print("SQL execution completed successfully.")
        sys.exit(0)
    else:
        print("SQL execution failed.")
        sys.exit(1) 
import sqlite3

# Connect to the database
conn = sqlite3.connect('carbon_footprint.db')
cursor = conn.cursor()

# Check if the column already exists
cursor.execute("PRAGMA table_info(supply_chains)")
columns = cursor.fetchall()
column_names = [column[1] for column in columns]

if 'user_id' not in column_names:
    print("Adding user_id column to supply_chains table...")
    
    # Add the user_id column
    cursor.execute("ALTER TABLE supply_chains ADD COLUMN user_id INTEGER REFERENCES users(id)")
    
    # Commit the changes
    conn.commit()
    print("Column added successfully!")
else:
    print("user_id column already exists in supply_chains table.")

# Close the connection
conn.close() 
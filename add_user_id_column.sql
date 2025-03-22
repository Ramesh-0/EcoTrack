-- Check if the user_id column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'supply_chains' AND column_name = 'user_id'
    ) THEN
        -- Add the user_id column
        ALTER TABLE supply_chains ADD COLUMN user_id INTEGER REFERENCES users(id);
    END IF;
END
$$; 
-- Add updated_at column to cubbies table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cubbies' AND column_name = 'updated_at') THEN
        ALTER TABLE cubbies ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add notes column to cubbies table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cubbies' AND column_name = 'notes') THEN
        ALTER TABLE cubbies ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Ensure status has the correct values
DO $$ 
BEGIN
    -- Check if the column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'cubbies' AND column_name = 'status') THEN
        -- Update the column type to ensure it accepts the correct values
        ALTER TABLE cubbies 
        DROP CONSTRAINT IF EXISTS cubbies_status_check;
        
        ALTER TABLE cubbies
        ADD CONSTRAINT cubbies_status_check 
        CHECK (status IN ('available', 'occupied', 'maintenance'));
    END IF;
END $$;

-- Add publication for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cubbies;

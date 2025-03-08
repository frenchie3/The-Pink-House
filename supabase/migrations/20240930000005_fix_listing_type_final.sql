-- Check if the listing_type column exists before trying to access it
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if listing_type column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cubby_rentals' AND column_name = 'listing_type'
    ) INTO column_exists;
    
    -- If column exists, handle the conversion
    IF column_exists THEN
        -- Add temporary column
        ALTER TABLE cubby_rentals ADD COLUMN listing_type_text TEXT DEFAULT 'self';
        
        -- Copy values safely
        BEGIN
            -- Try to cast to text
            UPDATE cubby_rentals SET listing_type_text = listing_type::TEXT;
        EXCEPTION WHEN OTHERS THEN
            -- If casting fails, use default
            UPDATE cubby_rentals SET listing_type_text = 'self';
        END;
        
        -- Drop the original column
        ALTER TABLE cubby_rentals DROP COLUMN listing_type;
        
        -- Rename the text column to the original name
        ALTER TABLE cubby_rentals RENAME COLUMN listing_type_text TO listing_type;
    ELSE
        -- If column doesn't exist, just add it
        ALTER TABLE cubby_rentals ADD COLUMN listing_type TEXT DEFAULT 'self';
    END IF;
    
    -- Add commission_rate if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cubby_rentals' AND column_name = 'commission_rate'
    ) THEN
        ALTER TABLE cubby_rentals ADD COLUMN commission_rate NUMERIC DEFAULT 0.15;
    END IF;
END
$$;

-- Update existing rentals with default values
UPDATE cubby_rentals
SET listing_type = 'self', commission_rate = 0.15
WHERE listing_type IS NULL OR commission_rate IS NULL;

-- Update realtime publication
alter publication supabase_realtime add table cubby_rentals;
-- Add listing_type and commission_rate columns to cubby_rentals table if they don't exist
DO $$
BEGIN
    -- Check if listing_type column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cubby_rentals' AND column_name = 'listing_type') THEN
        ALTER TABLE cubby_rentals ADD COLUMN listing_type TEXT DEFAULT 'self';
    END IF;
    
    -- Check if commission_rate column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cubby_rentals' AND column_name = 'commission_rate') THEN
        ALTER TABLE cubby_rentals ADD COLUMN commission_rate NUMERIC DEFAULT 0.15;
    END IF;
    
    -- Create indexes for faster queries if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cubby_rentals_listing_type') THEN
        CREATE INDEX idx_cubby_rentals_listing_type ON cubby_rentals(listing_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cubby_rentals_commission_rate') THEN
        CREATE INDEX idx_cubby_rentals_commission_rate ON cubby_rentals(commission_rate);
    END IF;
END
$$;

-- Update existing rentals to have default values if they don't already have them
UPDATE cubby_rentals
SET listing_type = 'self', commission_rate = 0.15
WHERE listing_type IS NULL OR commission_rate IS NULL;

-- Update realtime publication
alter publication supabase_realtime add table cubby_rentals;
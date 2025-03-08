-- Check if listing_types enum exists and create it if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_types') THEN
        CREATE TYPE listing_types AS ENUM ('self', 'staff');
    END IF;
END
$$;

-- Modify cubby_rentals table to use the enum type
ALTER TABLE cubby_rentals ALTER COLUMN listing_type TYPE listing_types USING listing_type::listing_types;

-- Set default value for listing_type
ALTER TABLE cubby_rentals ALTER COLUMN listing_type SET DEFAULT 'self'::listing_types;

-- Update existing rentals with default values
UPDATE cubby_rentals
SET listing_type = 'self'::listing_types
WHERE listing_type IS NULL;

-- Update realtime publication
alter publication supabase_realtime add table cubby_rentals;
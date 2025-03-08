-- Drop the enum type with CASCADE to handle dependencies
DROP TYPE IF EXISTS listing_types CASCADE;

-- Add listing_type as TEXT column
ALTER TABLE cubby_rentals ADD COLUMN IF NOT EXISTS listing_type_text TEXT DEFAULT 'self';

-- Copy values from old column if it exists
UPDATE cubby_rentals SET listing_type_text = listing_type::TEXT WHERE listing_type IS NOT NULL;

-- Drop the enum column
ALTER TABLE cubby_rentals DROP COLUMN IF EXISTS listing_type;

-- Rename the text column to the original name
ALTER TABLE cubby_rentals RENAME COLUMN listing_type_text TO listing_type;

-- Add commission_rate if it doesn't exist
ALTER TABLE cubby_rentals ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0.15;

-- Update existing rentals with default values
UPDATE cubby_rentals
SET listing_type = 'self', commission_rate = 0.15
WHERE listing_type IS NULL OR commission_rate IS NULL;

-- Update realtime publication
alter publication supabase_realtime add table cubby_rentals;
-- Add listing_type and commission_rate columns to cubby_rentals table
ALTER TABLE cubby_rentals ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'self';
ALTER TABLE cubby_rentals ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0.15;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cubby_rentals_listing_type ON cubby_rentals(listing_type);
CREATE INDEX IF NOT EXISTS idx_cubby_rentals_commission_rate ON cubby_rentals(commission_rate);

-- Update realtime publication
alter publication supabase_realtime add table cubby_rentals;
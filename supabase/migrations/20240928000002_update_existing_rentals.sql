-- Update existing rentals to have default values if they don't already have them
UPDATE cubby_rentals
SET listing_type = 'self', commission_rate = 0.15
WHERE listing_type IS NULL OR commission_rate IS NULL;
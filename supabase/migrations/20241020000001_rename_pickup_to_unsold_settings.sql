-- Rename pickup_settings to unsold_settings in system_settings table
UPDATE system_settings
SET setting_key = 'unsold_settings'
WHERE setting_key = 'pickup_settings';

-- Add unsold_preference column to cubby_rentals table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cubby_rentals' AND column_name = 'unsold_preference') THEN
        ALTER TABLE cubby_rentals ADD COLUMN unsold_preference text;
        
        -- Migrate data from pickup_preference to unsold_preference if pickup
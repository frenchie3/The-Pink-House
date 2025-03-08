-- Add staff_reviewed column to inventory_items if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inventory_items' AND column_name = 'staff_reviewed'
    ) THEN
        ALTER TABLE inventory_items ADD COLUMN staff_reviewed BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;

-- Update existing items to have staff_reviewed set to false if null
UPDATE inventory_items SET staff_reviewed = FALSE WHERE staff_reviewed IS NULL;
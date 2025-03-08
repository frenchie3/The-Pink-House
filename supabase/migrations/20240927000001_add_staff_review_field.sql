-- Add staff_reviewed field to inventory_items table
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS staff_reviewed BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_items_staff_reviewed ON inventory_items(staff_reviewed);

-- Update realtime publication
alter publication supabase_realtime add table inventory_items;
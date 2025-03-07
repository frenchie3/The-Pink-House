-- Add listing_preference and commission_rate fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS listing_preference text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0.15;

-- Create a function to update inventory_items commission_rate based on seller's preference
CREATE OR REPLACE FUNCTION update_item_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the commission rate based on the seller's preference
  NEW.commission_rate := (SELECT commission_rate FROM users WHERE id = NEW.seller_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically set commission rate on new inventory items
DROP TRIGGER IF EXISTS set_commission_rate ON inventory_items;
CREATE TRIGGER set_commission_rate
  BEFORE INSERT ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_item_commission();

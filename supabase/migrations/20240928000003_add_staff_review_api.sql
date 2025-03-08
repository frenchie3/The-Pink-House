-- Create a function to mark an item as reviewed by staff
CREATE OR REPLACE FUNCTION mark_item_reviewed(item_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE inventory_items
  SET staff_reviewed = TRUE
  WHERE id = item_id;
  
  RETURN FOUND;
END;
$$;
-- Test the mark_item_reviewed function
DO $$
DECLARE
  test_item_id UUID;
  result BOOLEAN;
BEGIN
  -- Get a random inventory item that is self-listed and not reviewed
  SELECT id INTO test_item_id FROM inventory_items 
  WHERE listing_type = 'self' AND (staff_reviewed IS NULL OR staff_reviewed = FALSE)
  LIMIT 1;
  
  -- If we found an item, test the function
  IF test_item_id IS NOT NULL THEN
    -- Call the function
    SELECT mark_item_reviewed(test_item_id) INTO result;
    
    -- Check the result
    RAISE NOTICE 'Function returned: %', result;
    
    -- Verify the item was updated
    IF EXISTS (SELECT 1 FROM inventory_items WHERE id = test_item_id AND staff_reviewed = TRUE) THEN
      RAISE NOTICE 'Test passed: Item was successfully marked as reviewed';
    ELSE
      RAISE NOTICE 'Test failed: Item was not marked as reviewed';
    END IF;
  ELSE
    RAISE NOTICE 'No suitable test item found';
  END IF;
END;
$$;
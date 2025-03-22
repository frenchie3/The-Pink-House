-- Implement atomic cubby extension function with proper transaction handling
-- This function handles the entire extension process in a single transaction

-- Drop the existing function if it exists to update it
DROP FUNCTION IF EXISTS extend_cubby_rental;

-- Create the improved function with atomic transaction handling
CREATE OR REPLACE FUNCTION extend_cubby_rental(
  p_rental_id UUID,
  p_new_end_date TIMESTAMP WITH TIME ZONE,
  p_new_cubby_id UUID,
  p_additional_fee NUMERIC,
  p_is_reassignment BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
DECLARE
  v_current_rental RECORD;
  v_current_cubby_id UUID;
  v_current_end_date TIMESTAMP WITH TIME ZONE;
  v_seller_id UUID;
  v_is_available BOOLEAN;
BEGIN
  -- Start transaction with serializable isolation level for maximum consistency
  -- This prevents phantom reads and other concurrency issues
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  
  -- Step 1: Lock and retrieve the current rental record
  SELECT * INTO v_current_rental 
  FROM cubby_rentals 
  WHERE id = p_rental_id 
  FOR UPDATE; -- Apply row-level lock to prevent concurrent modifications
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental with ID % not found', p_rental_id;
  END IF;
  
  -- Store important values for later use
  v_current_cubby_id := v_current_rental.cubby_id;
  v_current_end_date := v_current_rental.end_date;
  v_seller_id := v_current_rental.seller_id;
  
  -- Step 2: Validate the extension parameters
  IF p_new_end_date <= v_current_end_date THEN
    RAISE EXCEPTION 'New end date must be after the current end date';
  END IF;
  
  -- Step 3: Check availability based on whether we're keeping the same cubby or reassigning
  IF p_is_reassignment OR p_new_cubby_id != v_current_cubby_id THEN
    -- We're changing cubbies, so lock and check the new cubby's availability
    -- Lock the new cubby record
    PERFORM id FROM cubbies WHERE id = p_new_cubby_id FOR UPDATE;
    
    -- Check if the new cubby is available for the extension period
    -- Look for any overlapping rentals (excluding the current one)
    SELECT NOT EXISTS (
      SELECT 1 FROM cubby_rentals
      WHERE cubby_id = p_new_cubby_id
        AND id != p_rental_id
        AND status = 'active'
        AND (
          -- Check for any overlap between the extension period and existing rentals
          (start_date <= p_new_end_date AND end_date >= v_current_end_date)
        )
    ) INTO v_is_available;
    
    IF NOT v_is_available THEN
      RAISE EXCEPTION 'The selected cubby is not available for the requested extension period';
    END IF;
    
    -- Also check if the new cubby is in maintenance status
    PERFORM id FROM cubbies 
    WHERE id = p_new_cubby_id 
      AND status = 'maintenance';
    
    IF FOUND THEN
      RAISE EXCEPTION 'The selected cubby is currently under maintenance';
    END IF;
  ELSE
    -- We're keeping the same cubby, check if it's still available for extension
    -- Look for any other rentals for this cubby that would conflict
    SELECT NOT EXISTS (
      SELECT 1 FROM cubby_rentals
      WHERE cubby_id = v_current_cubby_id
        AND id != p_rental_id
        AND status = 'active'
        AND (
          -- Check for any overlap with the extension period
          (start_date <= p_new_end_date AND end_date >= v_current_end_date)
        )
    ) INTO v_is_available;
    
    IF NOT v_is_available THEN
      RAISE EXCEPTION 'The current cubby is not available for the requested extension period';
    END IF;
  END IF;
  
  -- Step 4: Update the rental record with the new end date and additional fee
  UPDATE cubby_rentals
  SET 
    end_date = p_new_end_date,
    rental_fee = rental_fee + p_additional_fee,
    updated_at = NOW()
  WHERE id = p_rental_id;
  
  -- Step 5: If we're reassigning to a new cubby, update the cubby_id
  IF p_is_reassignment OR p_new_cubby_id != v_current_cubby_id THEN
    -- Update the rental to point to the new cubby
    UPDATE cubby_rentals
    SET 
      cubby_id = p_new_cubby_id
    WHERE id = p_rental_id;
    
    -- Update the old cubby status to available if no other active rentals
    UPDATE cubbies
    SET status = 'available'
    WHERE id = v_current_cubby_id
      AND NOT EXISTS (
        SELECT 1 FROM cubby_rentals
        WHERE cubby_id = v_current_cubby_id
          AND status = 'active'
          AND id != p_rental_id
      );
    
    -- Update the new cubby status to occupied
    UPDATE cubbies
    SET status = 'occupied'
    WHERE id = p_new_cubby_id;
  END IF;
  
  -- Transaction will automatically commit if we reach this point
  -- or roll back if any exception occurs
END;
$$ LANGUAGE plpgsql;

-- Add a comment to the function
COMMENT ON FUNCTION extend_cubby_rental IS 'Atomically extends a cubby rental with proper transaction handling and validation';

-- Enable realtime for the affected tables if not already enabled
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE cubby_rentals, cubbies;

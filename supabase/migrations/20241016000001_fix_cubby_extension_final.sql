-- Drop the current problematic function
DROP FUNCTION IF EXISTS extend_cubby_rental;
DROP FUNCTION IF EXISTS check_cubby_extension_availability;

-- Recreate the check_cubby_extension_availability function
CREATE OR REPLACE FUNCTION check_cubby_extension_availability(
  p_cubby_id UUID,
  p_current_rental_id UUID,
  p_extension_start TIMESTAMP WITH TIME ZONE,
  p_extension_end TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Check for any conflicting rentals for this cubby during the extension period
  -- Exclude the current rental from the check
  SELECT COUNT(*) INTO conflict_count
  FROM cubby_rentals
  WHERE 
    cubby_id = p_cubby_id AND
    id != p_current_rental_id AND
    status = 'active' AND
    (
      (start_date <= p_extension_end AND end_date >= p_extension_start)
    );
  
  -- Return true if no conflicts (available), false if conflicts found
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Recreate the extend_cubby_rental function with the working version
CREATE OR REPLACE FUNCTION extend_cubby_rental(
  p_rental_id UUID,
  p_new_end_date TIMESTAMP WITH TIME ZONE,
  p_new_cubby_id UUID,
  p_additional_fee NUMERIC,
  p_is_reassignment BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
DECLARE
  v_current_rental RECORD;
  v_current_end_date TIMESTAMP WITH TIME ZONE;
  v_is_available BOOLEAN;
BEGIN
  -- Get the current rental details
  SELECT * INTO v_current_rental
  FROM cubby_rentals
  WHERE id = p_rental_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental not found';
  END IF;
  
  v_current_end_date := v_current_rental.end_date;
  
  -- Check if the current cubby is available for extension
  IF NOT p_is_reassignment THEN
    v_is_available := check_cubby_extension_availability(
      v_current_rental.cubby_id,
      p_rental_id,
      v_current_end_date,
      p_new_end_date
    );
    
    IF NOT v_is_available THEN
      RAISE EXCEPTION 'Current cubby is not available for the requested extension period';
    END IF;
    
    -- Update the current rental with the new end date
    UPDATE cubby_rentals
    SET 
      end_date = p_new_end_date,
      updated_at = NOW()
    WHERE id = p_rental_id;
  ELSE
    -- For reassignment, check if the new cubby is available
    v_is_available := check_cubby_extension_availability(
      p_new_cubby_id,
      p_rental_id,
      v_current_end_date,
      p_new_end_date
    );
    
    IF NOT v_is_available THEN
      RAISE EXCEPTION 'New cubby is not available for the requested extension period';
    END IF;
    
    -- Update the current rental with the new cubby and end date
    UPDATE cubby_rentals
    SET 
      cubby_id = p_new_cubby_id,
      end_date = p_new_end_date,
      updated_at = NOW()
    WHERE id = p_rental_id;
    
    -- Update the status of the old cubby to available
    UPDATE cubbies
    SET status = 'available'
    WHERE id = v_current_rental.cubby_id;
    
    -- Update the status of the new cubby to occupied
    UPDATE cubbies
    SET status = 'occupied'
    WHERE id = p_new_cubby_id;
  END IF;
  
  -- Update the rental fee to include the additional fee
  UPDATE cubby_rentals
  SET rental_fee = rental_fee + p_additional_fee
  WHERE id = p_rental_id;
  
  -- Return success
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Ensure the realtime publication includes the necessary tables
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE cubby_rentals, cubbies, inventory_items;

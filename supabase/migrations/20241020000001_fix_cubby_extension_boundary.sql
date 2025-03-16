-- Fix the cubby extension availability check function to handle boundary conditions properly
-- This addresses the issue where the current rental is incorrectly detected as conflicting with itself

DROP FUNCTION IF EXISTS check_cubby_extension_availability;

CREATE OR REPLACE FUNCTION check_cubby_extension_availability(
  p_cubby_id UUID,
  p_current_rental_id UUID, 
  p_extension_start TIMESTAMP WITH TIME ZONE,
  p_extension_end TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
  current_rental RECORD;
BEGIN
  -- First, get the current rental information to work with
  SELECT id, cubby_id, start_date, end_date
  INTO current_rental
  FROM cubby_rentals
  WHERE id = p_current_rental_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current rental with ID % not found', p_current_rental_id;
  END IF;
  
  -- Ensure the extension_start time is strictly after the current rental end date
  -- by adding a small offset if they match exactly
  IF p_extension_start = current_rental.end_date THEN
    -- Convert to timestamp without time zone, add 1 millisecond, then convert back
    p_extension_start := (p_extension_start::timestamp + interval '1 millisecond')::timestamptz;
  END IF;
  
  -- Check for any conflicting rentals for this cubby during the extension period
  -- Exclude the current rental from the check
  SELECT COUNT(*) INTO conflict_count
  FROM cubby_rentals
  WHERE 
    cubby_id = p_cubby_id AND
    id != p_current_rental_id AND
    status = 'active' AND
    start_date < p_extension_end AND 
    end_date > p_extension_start;
  
  -- Return true if no conflicts (available), false if conflicts found
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Update the extend_cubby_rental function to use the improved availability check
DROP FUNCTION IF EXISTS extend_cubby_rental;

CREATE OR REPLACE FUNCTION extend_cubby_rental(
  p_rental_id UUID,
  p_new_end_date TIMESTAMP WITH TIME ZONE,
  p_new_cubby_id UUID,
  p_additional_fee NUMERIC,
  p_is_reassignment BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
DECLARE
  v_current_rental RECORD;
  v_cubby_exists BOOLEAN;
  v_is_available BOOLEAN;
BEGIN
  -- Get current rental information
  SELECT *
  INTO v_current_rental
  FROM cubby_rentals
  WHERE id = p_rental_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental with ID % not found', p_rental_id;
  END IF;
  
  -- For extending the current cubby
  IF NOT p_is_reassignment AND p_new_cubby_id = v_current_rental.cubby_id THEN
    -- Check if the current cubby is available for the extension period
    v_is_available := check_cubby_extension_availability(
      v_current_rental.cubby_id,
      p_rental_id,
      v_current_rental.end_date,
      p_new_end_date
    );
    
    IF NOT v_is_available THEN
      RAISE EXCEPTION 'Current cubby is not available for the requested extension period';
    END IF;
    
    -- Update the existing rental with the new end date
    UPDATE cubby_rentals
    SET 
      end_date = p_new_end_date,
      rental_fee = rental_fee + p_additional_fee,
      updated_at = NOW()
    WHERE id = p_rental_id;
  ELSE
    -- For cubby reassignment
    -- First check if the new cubby exists
    SELECT EXISTS(SELECT 1 FROM cubbies WHERE id = p_new_cubby_id) INTO v_cubby_exists;
    
    IF NOT v_cubby_exists THEN
      RAISE EXCEPTION 'The selected cubby does not exist';
    END IF;
    
    -- Check if the new cubby is available for the extension period
    v_is_available := check_cubby_extension_availability(
      p_new_cubby_id,
      p_rental_id,
      v_current_rental.end_date,
      p_new_end_date
    );
    
    IF NOT v_is_available THEN
      RAISE EXCEPTION 'New cubby is not available for the requested extension period';
    END IF;
    
    -- Update the status of the old cubby to available
    UPDATE cubbies
    SET status = 'available'
    WHERE id = v_current_rental.cubby_id;
    
    -- Update the status of the new cubby to occupied
    UPDATE cubbies
    SET status = 'occupied'
    WHERE id = p_new_cubby_id;
    
    -- Update the existing rental with the new cubby and end date
    UPDATE cubby_rentals
    SET 
      cubby_id = p_new_cubby_id,
      end_date = p_new_end_date,
      rental_fee = rental_fee + p_additional_fee,
      updated_at = NOW()
    WHERE id = p_rental_id;
  END IF;
  
  -- Return success
  RETURN;
END;
$$ LANGUAGE plpgsql; 
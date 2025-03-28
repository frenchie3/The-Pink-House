-- Update the extend_cubby_rental function to handle open days
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
  v_extension_days INTEGER;
  v_new_editable_until_date TIMESTAMP WITH TIME ZONE;
  v_new_grace_period_date TIMESTAMP WITH TIME ZONE;
  v_open_days_count INTEGER;
  v_required_open_days INTEGER;
BEGIN
  -- Get the current rental details
  SELECT * INTO v_current_rental
  FROM cubby_rentals
  WHERE id = p_rental_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental not found';
  END IF;
  
  v_current_end_date := v_current_rental.end_date;
  
  -- Calculate the number of open days in the extension period
  v_open_days_count := calculate_open_days(v_current_end_date, p_new_end_date);
  
  -- Calculate required open days based on the rental period
  -- This is determined by the difference between the new and current end dates
  v_required_open_days := EXTRACT(DAY FROM (p_new_end_date - v_current_end_date));
  
  -- Validate that we have enough open days
  IF v_open_days_count < v_required_open_days THEN
    RAISE EXCEPTION 'The selected extension period does not provide enough open days. Required: %, Available: %', 
      v_required_open_days, v_open_days_count;
  END IF;
  
  -- Calculate the number of calendar days being added to the rental
  v_extension_days := EXTRACT(DAY FROM (p_new_end_date - v_current_end_date));
  
  -- Calculate new editable_until and grace_period dates by adding the same number of days
  IF v_current_rental.editable_until_date IS NOT NULL THEN
    v_new_editable_until_date := v_current_rental.editable_until_date + (v_extension_days * INTERVAL '1 day');
  END IF;
  
  IF v_current_rental.grace_period_date IS NOT NULL THEN
    v_new_grace_period_date := v_current_rental.grace_period_date + (v_extension_days * INTERVAL '1 day');
  END IF;
  
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
    
    -- Update the current rental with the new end date and extended editable_until/grace_period
    UPDATE cubby_rentals
    SET 
      end_date = p_new_end_date,
      editable_until_date = v_new_editable_until_date,
      grace_period_date = v_new_grace_period_date,
      updated_at = NOW()
    WHERE id = p_rental_id;
  
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
    
    -- Update the current rental with the new cubby, end date, and extended editable_until/grace_period
    UPDATE cubby_rentals
    SET 
      cubby_id = p_new_cubby_id,
      end_date = p_new_end_date,
      editable_until_date = v_new_editable_until_date,
      grace_period_date = v_new_grace_period_date,
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

-- Add a comment to the function
COMMENT ON FUNCTION extend_cubby_rental IS 'Extends a cubby rental with open days validation and proper handling of editable_until and grace_period dates';

-- Enable realtime for the affected tables
alter publication supabase_realtime add table cubby_rentals, cubbies; 
-- Add a function to check if a cubby is available for extension
-- This will help debug and fix the issue with cubby extension availability checks

CREATE OR REPLACE FUNCTION check_cubby_extension_availability(
  p_cubby_id UUID,
  p_current_rental_id UUID,
  p_extension_start TIMESTAMP WITH TIME ZONE,
  p_extension_end TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
  v_conflicts INTEGER;
BEGIN
  -- Count any conflicting rentals for this cubby during the extension period
  -- excluding the current rental being extended
  SELECT COUNT(*)
  INTO v_conflicts
  FROM cubby_rentals
  WHERE 
    cubby_id = p_cubby_id AND
    id != p_current_rental_id AND
    status = 'active' AND
    (
      (start_date <= p_extension_end AND end_date >= p_extension_start)
    );
  
  -- Return true if no conflicts (available for extension)
  RETURN v_conflicts = 0;
END;
$$ LANGUAGE plpgsql;

-- Modify the extend_cubby_rental function to use the availability check
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
  v_current_fee NUMERIC;
  v_seller_id UUID;
  v_current_end_date TIMESTAMP WITH TIME ZONE;
  v_is_available BOOLEAN;
BEGIN
  -- Get current rental information
  SELECT cubby_id, rental_fee, listing_type, commission_rate, seller_id, end_date
  INTO v_current_rental
  FROM cubby_rentals
  WHERE id = p_rental_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental with ID % not found', p_rental_id;
  END IF;
  
  v_current_cubby_id := v_current_rental.cubby_id;
  v_current_fee := v_current_rental.rental_fee;
  v_seller_id := v_current_rental.seller_id;
  v_current_end_date := v_current_rental.end_date;
  
  -- Check if the current cubby is available for extension
  IF NOT p_is_reassignment THEN
    v_is_available := check_cubby_extension_availability(
      v_current_cubby_id, 
      p_rental_id, 
      v_current_end_date, 
      p_new_end_date
    );
    
    IF NOT v_is_available THEN
      RAISE EXCEPTION 'Current cubby is not available for the requested extension period';
    END IF;
  END IF;
  
  -- Update the rental record with new end date and increased fee
  UPDATE cubby_rentals
  SET 
    end_date = p_new_end_date,
    rental_fee = v_current_fee + p_additional_fee,
    payment_status = 'paid', -- Auto-set to paid for demo purposes
    updated_at = NOW()
  WHERE id = p_rental_id;
  
  -- If this is a reassignment to a different cubby
  IF p_is_reassignment THEN
    -- Update the cubby_id in the rental record
    UPDATE cubby_rentals
    SET cubby_id = p_new_cubby_id
    WHERE id = p_rental_id;
    
    -- Update the status of the old cubby to available
    UPDATE cubbies
    SET 
      status = 'available',
      updated_at = NOW()
    WHERE id = v_current_cubby_id;
    
    -- Update the status of the new cubby to occupied
    UPDATE cubbies
    SET 
      status = 'occupied',
      updated_at = NOW()
    WHERE id = p_new_cubby_id;
  END IF;
  
  -- Create a notification for the seller about the extension
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at
  )
  VALUES (
    v_seller_id,
    CASE WHEN p_is_reassignment 
      THEN 'Cubby Rental Extended with Reassignment'
      ELSE 'Cubby Rental Extended'
    END,
    CASE WHEN p_is_reassignment 
      THEN 'Your cubby rental has been extended with a new cubby assignment. Please relocate your items to the new cubby.'
      ELSE 'Your cubby rental has been successfully extended.'
    END,
    'rental_extension',
    FALSE,
    NOW()
  );
  
END;
$$ LANGUAGE plpgsql;

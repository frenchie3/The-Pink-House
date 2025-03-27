-- Add a function to calculate the actual end date based on open days
CREATE OR REPLACE FUNCTION calculate_rental_end_date(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_rental_days INTEGER
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_open_days JSONB;
  v_current_date TIMESTAMP WITH TIME ZONE;
  v_end_date TIMESTAMP WITH TIME ZONE;
  v_active_days INTEGER := 0;
  v_day_name TEXT;
  v_is_open BOOLEAN;
BEGIN
  -- Get open days configuration from system settings
  SELECT setting_value INTO v_open_days
  FROM system_settings
  WHERE setting_key = 'shop_open_days';
  
  -- If no open days config is found, use all days as open (fallback)
  IF v_open_days IS NULL THEN
    v_open_days := '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": true}';
  END IF;
  
  -- Start counting from the start date
  v_current_date := p_start_date;
  v_end_date := p_start_date;
  
  -- Count active days until we reach the requested rental period
  WHILE v_active_days < p_rental_days LOOP
    -- Get the day of week as text (e.g., 'monday', 'tuesday', etc.)
    v_day_name := LOWER(TO_CHAR(v_current_date, 'day'));
    v_day_name := TRIM(v_day_name); -- Trim whitespace
    
    -- Check if this day is an open day
    v_is_open := v_open_days->>v_day_name = 'true';
    
    -- If it's an open day, count it as an active day
    IF v_is_open THEN
      v_active_days := v_active_days + 1;
      v_end_date := v_current_date;
    END IF;
    
    -- Move to the next day
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  -- The end date should be the last day that's counted as active
  RETURN v_end_date;
END;
$$ LANGUAGE plpgsql;

-- Modify the existing function that handles cubby rental creation to use the new open days logic
CREATE OR REPLACE FUNCTION create_cubby_rental(
  p_cubby_id UUID,
  p_seller_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_rental_days INTEGER,
  p_rental_fee NUMERIC,
  p_listing_type TEXT DEFAULT 'self',
  p_commission_rate NUMERIC DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_rental_id UUID;
  v_end_date TIMESTAMP WITH TIME ZONE;
  v_commission_rate NUMERIC;
  v_existing_rental_count INTEGER;
BEGIN
  -- Calculate the actual end date based on open days
  v_end_date := calculate_rental_end_date(p_start_date, p_rental_days);
  
  -- Set default commission rate if not provided
  IF p_commission_rate IS NULL THEN
    IF p_listing_type = 'self' THEN
      SELECT (setting_value->>'self_listed')::NUMERIC / 100 INTO v_commission_rate
      FROM system_settings
      WHERE setting_key = 'commission_rates';
    ELSE
      SELECT (setting_value->>'staff_listed')::NUMERIC / 100 INTO v_commission_rate
      FROM system_settings
      WHERE setting_key = 'commission_rates';
    END IF;
  ELSE
    v_commission_rate := p_commission_rate;
  END IF;
  
  -- Check for existing active rentals
  SELECT COUNT(*) INTO v_existing_rental_count
  FROM cubby_rentals
  WHERE cubby_id = p_cubby_id
    AND status = 'active'
    AND start_date <= v_end_date
    AND end_date >= p_start_date;
    
  IF v_existing_rental_count > 0 THEN
    RAISE EXCEPTION 'Cubby is already booked during this period';
  END IF;
  
  -- Insert new rental record
  INSERT INTO cubby_rentals (
    cubby_id,
    seller_id,
    start_date,
    end_date,
    rental_fee,
    status,
    payment_status,
    listing_type,
    commission_rate
  ) VALUES (
    p_cubby_id,
    p_seller_id,
    p_start_date,
    v_end_date,
    p_rental_fee,
    'active',
    'pending',
    p_listing_type,
    v_commission_rate
  ) RETURNING id INTO v_rental_id;
  
  -- Update cubby status to occupied
  UPDATE cubbies
  SET status = 'occupied'
  WHERE id = p_cubby_id;
  
  RETURN v_rental_id;
END;
$$ LANGUAGE plpgsql;

-- Update the extend_cubby_rental function to use the open days logic
CREATE OR REPLACE FUNCTION extend_cubby_rental(
  p_rental_id UUID,
  p_extension_days INTEGER,
  p_new_cubby_id UUID,
  p_additional_fee NUMERIC,
  p_is_reassignment BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
DECLARE
  v_current_rental RECORD;
  v_current_end_date TIMESTAMP WITH TIME ZONE;
  v_new_end_date TIMESTAMP WITH TIME ZONE;
  v_is_available BOOLEAN;
  v_extension_days INTEGER;
  v_new_editable_until_date TIMESTAMP WITH TIME ZONE;
  v_new_grace_period_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the current rental details
  SELECT * INTO v_current_rental
  FROM cubby_rentals
  WHERE id = p_rental_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental not found';
  END IF;
  
  v_current_end_date := v_current_rental.end_date;
  
  -- Calculate the new end date based on open days
  v_new_end_date := calculate_rental_end_date(v_current_end_date + INTERVAL '1 day', p_extension_days);
  
  -- Calculate the number of calendar days being added (for editable/grace periods)
  v_extension_days := EXTRACT(DAY FROM (v_new_end_date - v_current_end_date));
  
  -- Calculate new editable_until and grace_period dates by adding the same number of days
  IF v_current_rental.editable_until_date IS NOT NULL THEN
    v_new_editable_until_date := v_current_rental.editable_until_date + (v_extension_days * INTERVAL '1 day');
  END IF;
  
  IF v_current_rental.grace_period_date IS NOT NULL THEN
    v_new_grace_period_date := v_current_rental.grace_period_date + (v_extension_days * INTERVAL '1 day');
  END IF;
  
  -- For same cubby extension (no reassignment)
  IF NOT p_is_reassignment THEN
    -- Check if the current cubby is available for extension
    v_is_available := check_cubby_extension_availability(
      v_current_rental.cubby_id,
      p_rental_id,
      v_current_end_date,
      v_new_end_date
    );
    
    IF NOT v_is_available THEN
      RAISE EXCEPTION 'Current cubby is not available for the requested extension period';
    END IF;
    
    -- Update the current rental with the new end date
    UPDATE cubby_rentals
    SET 
      end_date = v_new_end_date,
      editable_until_date = v_new_editable_until_date,
      grace_period_date = v_new_grace_period_date,
      rental_fee = rental_fee + p_additional_fee,
      updated_at = NOW()
    WHERE id = p_rental_id;
  ELSE
    -- For reassignment, check if the new cubby is available
    v_is_available := check_cubby_extension_availability(
      p_new_cubby_id,
      p_rental_id,
      v_current_end_date,
      v_new_end_date
    );
    
    IF NOT v_is_available THEN
      RAISE EXCEPTION 'New cubby is not available for the requested extension period';
    END IF;
    
    -- First update the status of the cubbies
    -- Update the status of the old cubby to available
    UPDATE cubbies
    SET status = 'available'
    WHERE id = v_current_rental.cubby_id;
    
    -- Update the status of the new cubby to occupied
    UPDATE cubbies
    SET status = 'occupied'
    WHERE id = p_new_cubby_id;
    
    -- Then update the rental with the new cubby and end date
    UPDATE cubby_rentals
    SET 
      cubby_id = p_new_cubby_id,
      end_date = v_new_end_date,
      editable_until_date = v_new_editable_until_date,
      grace_period_date = v_new_grace_period_date,
      rental_fee = rental_fee + p_additional_fee,
      updated_at = NOW()
    WHERE id = p_rental_id;
  END IF;
  
  -- Return success
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Update the check_cubby_extension_availability function to handle open days
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
  -- explicitly excluding the current rental being extended
  SELECT COUNT(*)
  INTO v_conflicts
  FROM cubby_rentals
  WHERE 
    cubby_id = p_cubby_id AND
    id != p_current_rental_id AND
    status = 'active' AND
    start_date <= p_extension_end AND 
    end_date >= p_extension_start;
  
  -- Return true if no conflicts (available for extension)
  RETURN v_conflicts = 0;
END;
$$ LANGUAGE plpgsql;

-- Ensure the realtime publication includes the necessary tables
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE cubby_rentals, cubbies, inventory_items, system_settings; 
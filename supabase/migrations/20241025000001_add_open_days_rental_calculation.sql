-- Function to calculate the number of open days between two dates
CREATE OR REPLACE FUNCTION calculate_open_days(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS INTEGER AS $$
DECLARE
  v_open_days JSONB;
  v_count INTEGER;
  v_current_date TIMESTAMP WITH TIME ZONE;
  v_day_of_week TEXT;
BEGIN
  -- Get the shop open days configuration
  SELECT setting_value INTO v_open_days
  FROM system_settings
  WHERE setting_key = 'shop_open_days';
  
  -- Initialize counter
  v_count := 0;
  v_current_date := p_start_date;
  
  -- Loop through each day between start and end date
  WHILE v_current_date <= p_end_date LOOP
    -- Get the day of week (lowercase)
    v_day_of_week := LOWER(TO_CHAR(v_current_date, 'day'));
    
    -- Check if this day is an open day
    IF v_open_days->v_day_of_week = 'true' THEN
      v_count := v_count + 1;
    END IF;
    
    -- Move to next day
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate the end date needed to achieve a target number of open days
CREATE OR REPLACE FUNCTION calculate_rental_end_date(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_target_open_days INTEGER
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_open_days JSONB;
  v_current_date TIMESTAMP WITH TIME ZONE;
  v_day_of_week TEXT;
  v_open_days_count INTEGER;
  v_max_iterations INTEGER;
  v_iteration_count INTEGER;
BEGIN
  -- Get the shop open days configuration
  SELECT setting_value INTO v_open_days
  FROM system_settings
  WHERE setting_key = 'shop_open_days';
  
  -- Initialize counters
  v_open_days_count := 0;
  v_current_date := p_start_date;
  v_max_iterations := 365; -- Prevent infinite loops
  v_iteration_count := 0;
  
  -- Loop until we find enough open days or hit max iterations
  WHILE v_open_days_count < p_target_open_days AND v_iteration_count < v_max_iterations LOOP
    -- Get the day of week (lowercase)
    v_day_of_week := LOWER(TO_CHAR(v_current_date, 'day'));
    
    -- Check if this day is an open day
    IF v_open_days->v_day_of_week = 'true' THEN
      v_open_days_count := v_open_days_count + 1;
    END IF;
    
    -- Move to next day
    v_current_date := v_current_date + INTERVAL '1 day';
    v_iteration_count := v_iteration_count + 1;
  END LOOP;
  
  -- If we hit max iterations, raise an error
  IF v_iteration_count >= v_max_iterations THEN
    RAISE EXCEPTION 'Could not find enough open days within 365 days';
  END IF;
  
  -- Return the date that gives us the target number of open days
  RETURN v_current_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate a rental period against open days
CREATE OR REPLACE FUNCTION validate_rental_period(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_required_open_days INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_actual_open_days INTEGER;
BEGIN
  -- Calculate the actual number of open days in the period
  v_actual_open_days := calculate_open_days(p_start_date, p_end_date);
  
  -- Return true if we have enough open days
  RETURN v_actual_open_days >= p_required_open_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to the functions
COMMENT ON FUNCTION calculate_open_days IS 'Calculates the number of open days between two dates based on shop_open_days configuration';
COMMENT ON FUNCTION calculate_rental_end_date IS 'Calculates the end date needed to achieve a target number of open days from a start date';
COMMENT ON FUNCTION validate_rental_period IS 'Validates if a rental period contains enough open days to meet the required number';

-- Enable realtime for the affected tables
alter publication supabase_realtime add table system_settings; 
-- Add shop_open_days to system_settings table

-- First check if the setting already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'shop_open_days') THEN
    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES (
      'shop_open_days',
      '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": false}',
      'Configuration for which days of the week the shop is open'
    );
  END IF;
END
$$;

-- Create function to calculate rental end date based on open days
CREATE OR REPLACE FUNCTION calculate_open_days_end_date(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_open_days INTEGER
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_current_date TIMESTAMP WITH TIME ZONE := p_start_date;
  v_open_days_counted INTEGER := 0;
  v_day_of_week TEXT;
  v_shop_open_days JSONB;
  v_is_open BOOLEAN;
BEGIN
  -- Get shop open days configuration
  SELECT setting_value INTO v_shop_open_days
  FROM system_settings
  WHERE setting_key = 'shop_open_days';
  
  -- If no configuration found, use all days as open (fallback)
  IF v_shop_open_days IS NULL THEN
    v_shop_open_days := '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": false}'::JSONB;
  END IF;

  -- Count open days until we reach the desired number
  WHILE v_open_days_counted < p_open_days LOOP
    -- Get day of week in lowercase
    v_day_of_week := LOWER(TO_CHAR(v_current_date, 'day'));
    v_day_of_week := TRIM(v_day_of_week);
    
    -- Check if this day is an open day
    v_is_open := v_shop_open_days->>v_day_of_week;
    
    -- If shop is open on this day, count it
    IF v_is_open THEN
      v_open_days_counted := v_open_days_counted + 1;
    END IF;
    
    -- Move to next day
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  -- Return the end date (subtract 1 day because we want the last open day)
  RETURN v_current_date - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Create function to count open days between two dates
CREATE OR REPLACE FUNCTION count_open_days_between(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS INTEGER AS $$
DECLARE
  v_current_date TIMESTAMP WITH TIME ZONE := p_start_date;
  v_open_days_counted INTEGER := 0;
  v_day_of_week TEXT;
  v_shop_open_days JSONB;
  v_is_open BOOLEAN;
BEGIN
  -- Get shop open days configuration
  SELECT setting_value INTO v_shop_open_days
  FROM system_settings
  WHERE setting_key = 'shop_open_days';
  
  -- If no configuration found, use all days as open (fallback)
  IF v_shop_open_days IS NULL THEN
    v_shop_open_days := '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": false}'::JSONB;
  END IF;

  -- Count open days until we reach the end date
  WHILE v_current_date <= p_end_date LOOP
    -- Get day of week in lowercase
    v_day_of_week := LOWER(TO_CHAR(v_current_date, 'day'));
    v_day_of_week := TRIM(v_day_of_week);
    
    -- Check if this day is an open day
    v_is_open := v_shop_open_days->>v_day_of_week;
    
    -- If shop is open on this day, count it
    IF v_is_open THEN
      v_open_days_counted := v_open_days_counted + 1;
    END IF;
    
    -- Move to next day
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_open_days_counted;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for system_settings
alter publication supabase_realtime add table system_settings;

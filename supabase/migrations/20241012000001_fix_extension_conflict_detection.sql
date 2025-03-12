-- Fix the cubby extension availability check function to properly exclude the current rental

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

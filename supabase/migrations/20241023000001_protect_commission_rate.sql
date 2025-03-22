-- This migration ensures that the commission rate for cubby rentals is never updated during extensions
-- Once a seller selects their commission rate upon initial rental, it should remain unchanged

-- Add a comment to the extend_cubby_rental function to document this requirement
COMMENT ON FUNCTION extend_cubby_rental IS 
  'Extends a cubby rental by updating the end date and other time-related fields. 
  IMPORTANT: This function MUST NOT update the commission_rate field under any circumstances.
  The commission rate is set during initial rental creation and should remain unchanged for the
  entire lifecycle of the rental, including during extensions.';

-- Create a trigger to prevent direct updates to the commission_rate field after initial creation
CREATE OR REPLACE FUNCTION prevent_commission_rate_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run this check for updates (not inserts)
  IF (TG_OP = 'UPDATE') THEN
    -- If commission_rate is being changed and the record already exists
    IF (OLD.commission_rate IS NOT NULL AND NEW.commission_rate != OLD.commission_rate) THEN
      RAISE EXCEPTION 'Commission rate cannot be changed after initial rental creation';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the cubby_rentals table
DROP TRIGGER IF EXISTS prevent_commission_rate_update ON cubby_rentals;

CREATE TRIGGER prevent_commission_rate_update
BEFORE UPDATE ON cubby_rentals
FOR EACH ROW
EXECUTE FUNCTION prevent_commission_rate_change();

-- Add a comment to the trigger to document its purpose
COMMENT ON TRIGGER prevent_commission_rate_update ON cubby_rentals IS
  'This trigger prevents the commission_rate field from being changed after the initial rental creation. 
  The commission rate should remain constant throughout the entire rental lifecycle, 
  including extensions and other modifications.'; 
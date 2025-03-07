-- Fix cubby status update permissions and ensure status values are correct

-- Make sure the status constraint allows 'occupied' value
ALTER TABLE cubbies 
DROP CONSTRAINT IF EXISTS cubbies_status_check;

ALTER TABLE cubbies
ADD CONSTRAINT cubbies_status_check 
CHECK (status IN ('available', 'occupied', 'maintenance'));

-- Create a more permissive policy for updating cubbies
DROP POLICY IF EXISTS "Allow authenticated users to update cubbies" ON cubbies;
CREATE POLICY "Allow authenticated users to update cubbies"
  ON cubbies
  FOR UPDATE
  TO authenticated
  WITH CHECK (true);

-- Add a trigger to automatically update cubby status when a rental is created
CREATE OR REPLACE FUNCTION update_cubby_status_on_rental()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new active rental is created, mark the cubby as occupied
  IF NEW.status = 'active' THEN
    UPDATE cubbies SET status = 'occupied', updated_at = NOW() 
    WHERE id = NEW.cubby_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_cubby_status_trigger ON cubby_rentals;

-- Create the trigger
CREATE TRIGGER update_cubby_status_trigger
AFTER INSERT ON cubby_rentals
FOR EACH ROW
EXECUTE FUNCTION update_cubby_status_on_rental();

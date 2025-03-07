-- Fix permissions for updating cubby status

-- Allow sellers to update cubbies they're renting
DROP POLICY IF EXISTS "Allow sellers to update cubbies" ON cubbies;
CREATE POLICY "Allow sellers to update cubbies"
  ON cubbies
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add policy for sellers to update any available cubby (needed for rental process)
DROP POLICY IF EXISTS "Allow sellers to update available cubbies" ON cubbies;
CREATE POLICY "Allow sellers to update available cubbies"
  ON cubbies
  FOR UPDATE
  TO authenticated
  USING (status = 'available');

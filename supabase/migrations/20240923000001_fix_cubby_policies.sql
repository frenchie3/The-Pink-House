-- Fix RLS policies for cubbies to ensure sellers can access available cubbies

-- First, ensure we have at least one available cubby for testing
INSERT INTO cubbies (cubby_number, location, status, created_at)
VALUES ('A1', 'Main Floor', 'available', NOW())
ON CONFLICT (cubby_number) DO NOTHING;

-- Update the policy for all authenticated users to read available cubbies
DROP POLICY IF EXISTS "Allow users to read available cubbies" ON cubbies;
CREATE POLICY "Allow users to read available cubbies"
  ON cubbies
  FOR SELECT
  TO authenticated
  USING (status = 'available');

-- Allow admins to update cubbies
DROP POLICY IF EXISTS "Allow admins to update cubbies" ON cubbies;
CREATE POLICY "Allow admins to update cubbies"
  ON cubbies
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Allow staff to update cubbies
DROP POLICY IF EXISTS "Allow staff to update cubbies" ON cubbies;
CREATE POLICY "Allow staff to update cubbies"
  ON cubbies
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'staff');

-- Allow sellers to update cubbies they're renting
DROP POLICY IF EXISTS "Allow sellers to update rented cubbies" ON cubbies;
CREATE POLICY "Allow sellers to update rented cubbies"
  ON cubbies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cubby_rentals
      WHERE cubby_rentals.cubby_id = cubbies.id
      AND cubby_rentals.seller_id = auth.uid()
      AND cubby_rentals.status = 'active'
    )
  );

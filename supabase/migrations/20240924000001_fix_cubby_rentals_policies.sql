-- Fix RLS policies for cubby_rentals to ensure sellers can create rental records

-- Enable RLS for cubby_rentals table if not already enabled
ALTER TABLE cubby_rentals ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert into cubby_rentals
DROP POLICY IF EXISTS "Allow authenticated users to insert cubby rentals" ON cubby_rentals;
CREATE POLICY "Allow authenticated users to insert cubby rentals"
  ON cubby_rentals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to read their own rentals
DROP POLICY IF EXISTS "Allow users to read their own rentals" ON cubby_rentals;
CREATE POLICY "Allow users to read their own rentals"
  ON cubby_rentals
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Allow users to update their own rentals
DROP POLICY IF EXISTS "Allow users to update their own rentals" ON cubby_rentals;
CREATE POLICY "Allow users to update their own rentals"
  ON cubby_rentals
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid());

-- Allow admins to read all rentals
DROP POLICY IF EXISTS "Allow admins to read all rentals" ON cubby_rentals;
CREATE POLICY "Allow admins to read all rentals"
  ON cubby_rentals
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Allow staff to read all rentals
DROP POLICY IF EXISTS "Allow staff to read all rentals" ON cubby_rentals;
CREATE POLICY "Allow staff to read all rentals"
  ON cubby_rentals
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'staff');

-- Allow admins to update all rentals
DROP POLICY IF EXISTS "Allow admins to update all rentals" ON cubby_rentals;
CREATE POLICY "Allow admins to update all rentals"
  ON cubby_rentals
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Allow staff to update all rentals
DROP POLICY IF EXISTS "Allow staff to update all rentals" ON cubby_rentals;
CREATE POLICY "Allow staff to update all rentals"
  ON cubby_rentals
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'staff');

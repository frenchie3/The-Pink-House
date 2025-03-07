-- Create a test cubby if it doesn't exist
INSERT INTO cubbies (cubby_number, location, status, created_at)
VALUES ('C1', 'Main Floor', 'available', NOW())
ON CONFLICT (cubby_number) DO NOTHING;

-- Enable RLS for cubbies table
ALTER TABLE cubbies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read available cubbies
DROP POLICY IF EXISTS "Allow users to read available cubbies" ON cubbies;
CREATE POLICY "Allow users to read available cubbies"
  ON cubbies
  FOR SELECT
  TO authenticated
  USING (status = 'available');

-- Create policy to allow admins to read all cubbies
DROP POLICY IF EXISTS "Allow admins to read all cubbies" ON cubbies;
CREATE POLICY "Allow admins to read all cubbies"
  ON cubbies
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policy to allow staff to read all cubbies
DROP POLICY IF EXISTS "Allow staff to read all cubbies" ON cubbies;
CREATE POLICY "Allow staff to read all cubbies"
  ON cubbies
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'staff');

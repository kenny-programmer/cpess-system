/*
  # Fix User Registration RLS Policy

  ## Changes
  1. Drop existing INSERT policy on users table
  2. Create new policy that allows:
     - Authenticated users to insert their own user record during signup
     - Officers to insert other users if needed
  
  ## Security
  - Users can only create a record for themselves (matching auth.uid())
  - Prevents users from creating records for others
  - Maintains security while allowing self-registration
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Officers can insert users" ON users;

-- Create new policy that allows user self-registration
CREATE POLICY "Users can create own account during signup"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
  );

-- Allow officers to insert users if needed
CREATE POLICY "Officers can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'officer'
    )
  );

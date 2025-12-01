/*
  # Add Admin Role and Account Management
  
  ## Changes
  1. Update users table role to include 'admin'
  2. Add account status field (active/disabled)
  3. Update RLS policies for admin privileges
  4. Create admin account
  
  ## Admin Capabilities
  - Create new officer accounts
  - Reset/change passwords
  - Disable/enable accounts
  - Change user roles
  - Full system access
  
  ## Security
  - Admin has unrestricted access to users table
  - Only admin can modify other users
  - Members and officers can only view their own data
*/

-- Add disabled status to users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Update role check constraint to include admin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'officer', 'member'));

-- Update RLS policies for admin access

-- Admin can read all users
DROP POLICY IF EXISTS "Admins can read all users" ON users;
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
    OR auth.uid() = id
  );

-- Admin can update any user
DROP POLICY IF EXISTS "Admins can update any user" ON users;
CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admin can insert users
DROP POLICY IF EXISTS "Admins can insert users" ON users;
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admin can delete users
DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Update handle_new_user function to exclude admin emails from auto-assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Skip auto-insert for admin accounts (they'll be created manually)
  IF NEW.email = 'cpess.admin@gmail.com' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (id, email, role, officer_position, full_name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN NEW.email LIKE '%@ub.edu.ph' THEN 'member' ELSE 'officer' END,
    NULL,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
  # Add User Sync Trigger
  
  ## Purpose
  Automatically create a public.users record when a new user signs up through auth
  
  ## Changes
  1. Create function to sync auth.users to public.users
  2. Create trigger to call function on new user signup
  
  ## Security
  - Function runs with security definer privileges
  - Only syncs necessary fields
  - Maintains data integrity
*/

-- Function to sync new auth users to public.users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, officer_position, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN NEW.email LIKE '%@ub.edu.ph' THEN 'member' ELSE 'officer' END,
    NULL,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically sync new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync any existing auth users that don't have a public.users record
INSERT INTO public.users (id, email, role, officer_position, full_name)
SELECT 
  au.id,
  au.email,
  CASE WHEN au.email LIKE '%@ub.edu.ph' THEN 'member' ELSE 'officer' END,
  NULL,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

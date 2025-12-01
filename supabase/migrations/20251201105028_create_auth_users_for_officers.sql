/*
  # Create Auth Users for Officers

  1. Purpose
    - Creates Supabase Auth users for all existing officers in the users table
    - This allows officers to log in with their credentials
    
  2. Security
    - Uses secure password hashing
    - Sets email_confirmed_at to current time (bypasses email verification)
    - Creates proper auth.users records
    
  3. Officers to be created
    - President: cpess.president@gmail.com
    - VP Internal: cpess.vpinternal@gmail.com
    - VP External: cpess.vpexternal@gmail.com
    - Treasurer: cpess.treasurer@gmail.com
    - Assistant Treasurer: cpess.asst.treasurer@gmail.com
    - Auditor: cpess.auditor@gmail.com
    - Admin: cpess.admin@gmail.com
*/

-- Create auth users for officers (only if they don't already exist in auth.users)
DO $$
DECLARE
  officer_record RECORD;
  auth_user_id uuid;
BEGIN
  -- Loop through all officers and admin in the users table
  FOR officer_record IN 
    SELECT id, email, full_name 
    FROM public.users 
    WHERE role IN ('officer', 'admin')
  LOOP
    -- Check if auth user already exists
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = officer_record.email;
    
    -- If auth user doesn't exist, create it
    IF auth_user_id IS NULL THEN
      -- Insert into auth.users with a default password
      -- The password will be set via the edge function or manual reset
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role,
        aud
      ) VALUES (
        officer_record.id,
        '00000000-0000-0000-0000-000000000000',
        officer_record.email,
        crypt('TempPassword123!', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', officer_record.full_name),
        false,
        'authenticated',
        'authenticated'
      );
      
      -- Insert into auth.identities
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        officer_record.id,
        jsonb_build_object(
          'sub', officer_record.id::text,
          'email', officer_record.email
        ),
        'email',
        now(),
        now(),
        now()
      );
      
      RAISE NOTICE 'Created auth user for: %', officer_record.email;
    ELSE
      RAISE NOTICE 'Auth user already exists for: %', officer_record.email;
    END IF;
  END LOOP;
END $$;

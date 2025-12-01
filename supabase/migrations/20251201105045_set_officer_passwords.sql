/*
  # Set Officer Passwords

  1. Purpose
    - Sets specific passwords for each officer account
    - Allows officers to log in with their designated credentials
    
  2. Passwords
    - President: cpessPres!dent2024
    - VP Internal: cpessVPintern@l2024
    - VP External: cpessVPextern@l2024
    - Treasurer: cpessTreasur3r2024
    - Assistant Treasurer: cpessAsstTreas2024
    - Auditor: cpessAud!tor2024
    - Admin: 12341234
*/

-- Update passwords for each officer
UPDATE auth.users 
SET encrypted_password = crypt('cpessPres!dent2024', gen_salt('bf')),
    updated_at = now()
WHERE email = 'cpess.president@gmail.com';

UPDATE auth.users 
SET encrypted_password = crypt('cpessVPintern@l2024', gen_salt('bf')),
    updated_at = now()
WHERE email = 'cpess.vpinternal@gmail.com';

UPDATE auth.users 
SET encrypted_password = crypt('cpessVPextern@l2024', gen_salt('bf')),
    updated_at = now()
WHERE email = 'cpess.vpexternal@gmail.com';

UPDATE auth.users 
SET encrypted_password = crypt('cpessTreasur3r2024', gen_salt('bf')),
    updated_at = now()
WHERE email = 'cpess.treasurer@gmail.com';

UPDATE auth.users 
SET encrypted_password = crypt('cpessAsstTreas2024', gen_salt('bf')),
    updated_at = now()
WHERE email = 'cpess.asst.treasurer@gmail.com';

UPDATE auth.users 
SET encrypted_password = crypt('cpessAud!tor2024', gen_salt('bf')),
    updated_at = now()
WHERE email = 'cpess.auditor@gmail.com';

UPDATE auth.users 
SET encrypted_password = crypt('12341234', gen_salt('bf')),
    updated_at = now()
WHERE email = 'cpess.admin@gmail.com';

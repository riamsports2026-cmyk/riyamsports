-- ============================================================
-- Create a new admin account with email + password (all in SQL)
-- ============================================================
-- If the email ALREADY EXISTS: only assigns admin role + profile (no duplicate error).
-- If the email is NEW: creates user with password, then assigns admin role + profile.
--
-- 1. Replace the 4 values below (email, password, full name, mobile).
-- 2. Run this entire script in Supabase SQL Editor.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
  admin_email text := 'riamsports2026@gmail.com';
  admin_password text := 'Riyam@2026';
  admin_full_name text := 'Admin Name';
  admin_mobile text := '+911234567890';
BEGIN
  -- Check if user with this email already exists
  SELECT id INTO existing_user_id FROM auth.users WHERE email = admin_email LIMIT 1;

  IF existing_user_id IS NOT NULL THEN
    -- Email already exists: use existing user, only assign admin role + profile
    new_user_id := existing_user_id;
    RAISE NOTICE 'User already exists. Assigning admin role and profile. User ID: %, Email: %', new_user_id, admin_email;
  ELSE
    -- New email: create user in auth.users
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
    ) VALUES (
      new_user_id, '00000000-0000-0000-0000-000000000000', admin_email,
      crypt(admin_password, gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      'authenticated', 'authenticated', NOW(), NOW()
    );
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      new_user_id, new_user_id, new_user_id,
      format('{"sub": "%s", "email": "%s"}', new_user_id, admin_email)::jsonb,
      'email', NOW(), NOW(), NOW()
    );
    RAISE NOTICE 'New admin created. User ID: %, Email: %', new_user_id, admin_email;
  END IF;

  -- Assign admin role (both new and existing user)
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT new_user_id, id FROM public.roles WHERE name = 'admin'
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Create/update profile (required for admin login)
  INSERT INTO public.profiles (id, full_name, mobile_number)
  VALUES (new_user_id, admin_full_name, admin_mobile)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    mobile_number = EXCLUDED.mobile_number;

  RAISE NOTICE 'Done. Admin role and profile set for: %', admin_email;
END $$;

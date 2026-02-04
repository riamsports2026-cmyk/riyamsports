-- ============================================
-- RESET ADMIN PASSWORD - SQL QUERIES
-- ============================================
-- 
-- IMPORTANT: Passwords in Supabase are encrypted and cannot be directly updated via SQL.
-- You have two options:
--
-- OPTION 1: Use Supabase Dashboard (Recommended)
-- 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/users
-- 2. Find the admin user by email
-- 3. Click on the user
-- 4. Click "Send password reset email" or "Reset password"
--
-- OPTION 2: Use Supabase Admin API (Programmatic)
-- Use the Supabase Management API to reset the password
--
-- OPTION 3: Use this SQL to find admin and then use password reset function
-- ============================================

-- Step 1: Find admin user(s) with their email
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  r.name as role_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.roles r ON r.id = ur.role_id
WHERE r.name = 'admin'
ORDER BY u.created_at;

-- Step 2: If you know the admin email, find the user ID
-- Replace 'admin@example.com' with your admin email
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'admin@example.com';

-- Step 3: Update password using Supabase extension function
-- NOTE: This requires the pgcrypto extension and proper permissions
-- Replace 'YOUR_USER_ID' with the actual user ID from Step 1 or 2
-- Replace 'NewPassword123!' with your desired password
-- 
-- IMPORTANT: This function may not be available in all Supabase instances.
-- If it doesn't work, use Option 1 (Dashboard) instead.

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update password (this uses Supabase's internal password hashing)
-- WARNING: This may not work depending on your Supabase setup
-- It's safer to use the Dashboard or Admin API
UPDATE auth.users
SET 
  encrypted_password = crypt('Riyam@2026', gen_salt('bf')),
  updated_at = NOW()
WHERE id = '4ce2b33c-724c-4a49-8422-45e55a7dafc2';

-- ============================================
-- ALTERNATIVE: Create a new admin user if needed
-- ============================================
-- If you can't reset the password, you can create a new admin user
-- (This requires using Supabase Auth API or Dashboard)

-- After creating a new user via Dashboard/API, assign admin role:
-- Replace 'NEW_USER_ID' with the new user's ID
INSERT INTO public.user_roles (user_id, role_id)
SELECT 
  'NEW_USER_ID',
  id
FROM public.roles
WHERE name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Verify admin role assignment
SELECT 
  u.email,
  r.name as role_name
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE u.id = 'NEW_USER_ID' AND r.name = 'admin';




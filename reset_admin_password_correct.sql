-- ============================================
-- CORRECT WAY TO RESET ADMIN PASSWORD IN SUPABASE
-- ============================================
-- 
-- The standard PostgreSQL crypt() function doesn't work with Supabase
-- because Supabase uses a different password hashing format.
--
-- SOLUTION: Use Supabase Admin API or Dashboard
-- ============================================

-- Step 1: Find your admin user ID and email
SELECT 
  u.id,
  u.email,
  u.created_at,
  r.name as role_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.roles r ON r.id = ur.role_id
WHERE r.name = 'admin'
ORDER BY u.created_at;

-- ============================================
-- OPTION 1: Use Supabase Dashboard (EASIEST)
-- ============================================
-- 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users
-- 2. Find user with ID: bd4dafdc-d96b-4f58-a458-45f9c456ae65
-- 3. Click on the user
-- 4. Click "Send password reset email" OR
-- 5. Click "Reset password" and enter new password directly
--
-- This is the RECOMMENDED method as it uses Supabase's proper password hashing.

-- ============================================
-- OPTION 2: Use Supabase Management API
-- ============================================
-- You can use the Supabase Management API to update the password.
-- This requires your service_role key (keep it secret!)
--
-- Example using curl:
-- curl -X PUT 'https://api.supabase.com/v1/projects/YOUR_PROJECT_ID/auth/users/bd4dafdc-d96b-4f58-a458-45f9c456ae65' \
--   -H "apikey: YOUR_SERVICE_ROLE_KEY" \
--   -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{"password": "NewPassword123!"}'

-- ============================================
-- OPTION 3: SQL with Supabase's password format (ADVANCED)
-- ============================================
-- WARNING: This is complex and may not work in all Supabase versions.
-- Supabase uses a specific format: $2a$10$... (bcrypt with specific encoding)
--
-- The password hash format in Supabase is:
-- $2a$10$[22 character salt][31 character hash]
--
-- This is very difficult to generate correctly. It's better to use Option 1 or 2.

-- ============================================
-- OPTION 4: Create a temporary password reset function
-- ============================================
-- You can create a server action in your Next.js app to reset the password
-- using Supabase's Admin client with service_role key.

-- ============================================
-- RECOMMENDED: Use Dashboard Password Reset
-- ============================================
-- This is the safest and most reliable method.
-- The password will be properly hashed and stored.




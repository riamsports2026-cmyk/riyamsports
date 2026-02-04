-- Fix infinite recursion in roles RLS policy
-- The previous policy joined roles to itself, causing recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;

-- Keep only the SELECT policy for authenticated users
-- Roles table is mostly read-only, admin operations should use service role
DROP POLICY IF EXISTS "Authenticated users can view roles" ON roles;
CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  USING (auth.role() = 'authenticated');

-- For admin write operations, we'll use service role client in the app
-- which bypasses RLS. This avoids the recursion issue entirely.

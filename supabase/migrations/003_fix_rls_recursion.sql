-- Fix RLS policy recursion issue
-- Run this after 001_initial_schema.sql

-- Drop the problematic user_roles policies that cause recursion
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

-- Recreate with a simpler approach that doesn't cause recursion
-- Allow users to see their own roles directly
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- For admin management, we'll use service role or a different approach
-- Admins can manage user roles (but this requires service role in practice)
-- We'll handle admin operations via service role key in the application

-- Also fix the locations policy - remove the redundant employee policy
-- since "Everyone can view active locations" already covers it
DROP POLICY IF EXISTS "Employees can view assigned locations" ON locations;

-- The "Everyone can view active locations" policy is sufficient
-- All authenticated users can see active locations



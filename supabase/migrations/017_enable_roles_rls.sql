-- Enable RLS on the roles table
-- The table has policies defined but RLS was not enabled, causing security warnings

-- Enable Row Level Security on roles table
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Ensure the policy exists (recreate if needed for idempotency)
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
CREATE POLICY "Admins can manage roles"
  ON roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'sub_admin')
    )
  );

-- Allow all authenticated users to read roles (needed for role selection dropdowns)
DROP POLICY IF EXISTS "Authenticated users can view roles" ON roles;
CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  USING (auth.role() = 'authenticated');

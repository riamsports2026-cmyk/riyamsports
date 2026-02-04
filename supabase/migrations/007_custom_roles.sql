-- Allow custom role names by removing the CHECK constraint
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_check;

-- Add a unique constraint on name (if not already exists)
CREATE UNIQUE INDEX IF NOT EXISTS roles_name_unique ON roles(name);

-- Add description field to roles for better management
ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system_role BOOLEAN DEFAULT false;

-- Mark existing roles as system roles
UPDATE roles SET is_system_role = true WHERE name IN ('admin', 'employee', 'customer', 'manager', 'sub_admin', 'account_manager');



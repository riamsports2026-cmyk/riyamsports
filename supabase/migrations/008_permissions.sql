-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
  ('manage_roles', 'Can add, edit, and remove roles'),
  ('manage_users', 'Can create and manage user accounts'),
  ('manage_bookings', 'Can view and manage all bookings'),
  ('manage_locations', 'Can manage locations'),
  ('manage_services', 'Can manage services/sports'),
  ('book_turf', 'Can book turfs'),
  ('view_bookings', 'Can view own bookings')
ON CONFLICT (name) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Enable RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permissions (everyone can view)
DROP POLICY IF EXISTS "Anyone can view permissions" ON permissions;
CREATE POLICY "Anyone can view permissions"
  ON permissions FOR SELECT
  USING (true);

-- RLS Policies for role_permissions
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;
CREATE POLICY "Admins can manage role permissions"
  ON role_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS "Anyone can view role permissions" ON role_permissions;
CREATE POLICY "Anyone can view role permissions"
  ON role_permissions FOR SELECT
  USING (true);

-- Grant default permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Grant default permissions to customer role (book and view bookings)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'customer'
AND p.name IN ('book_turf', 'view_bookings')
ON CONFLICT DO NOTHING;

-- Grant default permissions to staff roles (only manage bookings for their locations, NOT book_turf or view_bookings)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('manager', 'sub_admin', 'account_manager', 'employee')
AND p.name IN ('manage_bookings')
ON CONFLICT DO NOTHING;


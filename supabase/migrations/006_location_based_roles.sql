-- Add new roles
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_check;
ALTER TABLE roles ADD CONSTRAINT roles_name_check 
  CHECK (name IN ('admin', 'employee', 'customer', 'manager', 'sub_admin', 'account_manager'));

-- Insert new roles
INSERT INTO roles (name) VALUES ('manager'), ('sub_admin'), ('account_manager')
ON CONFLICT (name) DO NOTHING;

-- Create user_role_locations table for location-based role assignments
CREATE TABLE IF NOT EXISTS user_role_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id, location_id)
);

-- Indexes for user_role_locations
CREATE INDEX IF NOT EXISTS idx_user_role_locations_user_id ON user_role_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_locations_role_id ON user_role_locations(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_locations_location_id ON user_role_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_user_role_locations_user_location ON user_role_locations(user_id, location_id);

-- Enable RLS
ALTER TABLE user_role_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_role_locations
DROP POLICY IF EXISTS "Admins can manage user role locations" ON user_role_locations;
CREATE POLICY "Admins can manage user role locations"
  ON user_role_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view own role locations" ON user_role_locations;
CREATE POLICY "Users can view own role locations"
  ON user_role_locations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Managers can view role locations at their locations" ON user_role_locations;
CREATE POLICY "Managers can view role locations at their locations"
  ON user_role_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_role_locations url
      JOIN roles r ON url.role_id = r.id
      WHERE url.user_id = auth.uid() 
      AND r.name IN ('manager', 'sub_admin')
      AND url.location_id = user_role_locations.location_id
    )
  );



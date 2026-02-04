-- Optional: Create location_services junction table for explicit service availability
-- This allows admins to control which services are available at which locations
-- even before creating turfs

CREATE TABLE IF NOT EXISTS location_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_location_services_location_id ON location_services(location_id);
CREATE INDEX IF NOT EXISTS idx_location_services_service_id ON location_services(service_id);

-- Enable RLS
ALTER TABLE location_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Everyone can view active location services" ON location_services;
CREATE POLICY "Everyone can view active location services"
  ON location_services FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage location services" ON location_services;
CREATE POLICY "Admins can manage location services"
  ON location_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );



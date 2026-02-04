-- Service hourly pricing table
-- This allows defining base hourly pricing at the service level
-- Individual turfs can override these prices if needed
CREATE TABLE IF NOT EXISTS service_hourly_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, hour)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_hourly_pricing_service_id ON service_hourly_pricing(service_id);
CREATE INDEX IF NOT EXISTS idx_service_hourly_pricing_hour ON service_hourly_pricing(hour);

-- Enable RLS
ALTER TABLE service_hourly_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_hourly_pricing
DROP POLICY IF EXISTS "Everyone can view service pricing" ON service_hourly_pricing;
CREATE POLICY "Everyone can view service pricing"
  ON service_hourly_pricing FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage service pricing" ON service_hourly_pricing;
CREATE POLICY "Admins can manage service pricing"
  ON service_hourly_pricing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_service_hourly_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_hourly_pricing_updated_at
  BEFORE UPDATE ON service_hourly_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_service_hourly_pricing_updated_at();






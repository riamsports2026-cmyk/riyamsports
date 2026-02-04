-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  mobile_number TEXT,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('admin', 'employee', 'customer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name) VALUES ('admin'), ('employee'), ('customer')
ON CONFLICT (name) DO NOTHING;

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee locations table
CREATE TABLE IF NOT EXISTS employee_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, location_id)
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turfs table
CREATE TABLE IF NOT EXISTS turfs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hourly pricing table
CREATE TABLE IF NOT EXISTS hourly_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turf_id UUID NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(turf_id, hour)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  turf_id UUID NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  advance_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (payment_status IN ('pending_payment', 'partial', 'paid', 'refunded')),
  booking_status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (booking_status IN ('pending_payment', 'confirmed', 'completed', 'cancelled')),
  payment_gateway TEXT CHECK (payment_gateway IN ('razorpay', 'payglobal')),
  payment_gateway_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking slots table
CREATE TABLE IF NOT EXISTS booking_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, hour)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('advance', 'full', 'remaining')),
  payment_gateway TEXT NOT NULL CHECK (payment_gateway IN ('razorpay', 'payglobal')),
  gateway_order_id TEXT NOT NULL,
  gateway_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment gateway settings (single-row table)
CREATE TABLE IF NOT EXISTS payment_gateway_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  active_gateway TEXT NOT NULL CHECK (active_gateway IN ('razorpay', 'payglobal')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one row
CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_gateway_settings_singleton
  ON payment_gateway_settings ((true));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_employee_locations_employee_id ON employee_locations(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_locations_location_id ON employee_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_turfs_location_id ON turfs(location_id);
CREATE INDEX IF NOT EXISTS idx_turfs_service_id ON turfs(service_id);
CREATE INDEX IF NOT EXISTS idx_hourly_pricing_turf_id ON hourly_pricing(turf_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_turf_id ON bookings(turf_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_booking_slots_booking_id ON booking_slots(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id ON payments(gateway_order_id);

-- RLS Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE turfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateway_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Roles policies (admin only)
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
CREATE POLICY "Admins can manage roles"
  ON roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- User roles policies (fixed - removed problematic policy)
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Employee locations policies
DROP POLICY IF EXISTS "Admins can manage employee locations" ON employee_locations;
CREATE POLICY "Admins can manage employee locations"
  ON employee_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS "Employees can view own locations" ON employee_locations;
CREATE POLICY "Employees can view own locations"
  ON employee_locations FOR SELECT
  USING (auth.uid() = employee_id);

-- Locations policies (simplified - removed redundant policy)
DROP POLICY IF EXISTS "Everyone can view active locations" ON locations;
CREATE POLICY "Everyone can view active locations"
  ON locations FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage locations" ON locations;
CREATE POLICY "Admins can manage locations"
  ON locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS "Employees can view assigned locations" ON locations;

-- Services policies
DROP POLICY IF EXISTS "Everyone can view active services" ON services;
CREATE POLICY "Everyone can view active services"
  ON services FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage services" ON services;
CREATE POLICY "Admins can manage services"
  ON services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Turfs policies
DROP POLICY IF EXISTS "Everyone can view available turfs" ON turfs;
CREATE POLICY "Everyone can view available turfs"
  ON turfs FOR SELECT
  USING (is_available = true);

DROP POLICY IF EXISTS "Admins can manage turfs" ON turfs;
CREATE POLICY "Admins can manage turfs"
  ON turfs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS "Employees can view turfs at assigned locations" ON turfs;

-- Hourly pricing policies
DROP POLICY IF EXISTS "Everyone can view pricing" ON hourly_pricing;
CREATE POLICY "Everyone can view pricing"
  ON hourly_pricing FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage pricing" ON hourly_pricing;
CREATE POLICY "Admins can manage pricing"
  ON hourly_pricing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;
CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS "Employees can view bookings at assigned locations" ON bookings;
CREATE POLICY "Employees can view bookings at assigned locations"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employee_locations el
      JOIN turfs t ON el.location_id = t.location_id
      WHERE el.employee_id = auth.uid() AND t.id = bookings.turf_id
    )
  );

DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
CREATE POLICY "Admins can update bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Booking slots policies
DROP POLICY IF EXISTS "Users can view slots for own bookings" ON booking_slots;
CREATE POLICY "Users can view slots for own bookings"
  ON booking_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_slots.booking_id AND bookings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create slots for own bookings" ON booking_slots;
CREATE POLICY "Users can create slots for own bookings"
  ON booking_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_slots.booking_id AND bookings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all booking slots" ON booking_slots;
CREATE POLICY "Admins can view all booking slots"
  ON booking_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Payments policies
DROP POLICY IF EXISTS "Users can view payments for own bookings" ON payments;
CREATE POLICY "Users can view payments for own bookings"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id AND bookings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update payments" ON payments;
CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Payment gateway settings policies (admin only)
DROP POLICY IF EXISTS "Admins can manage gateway settings" ON payment_gateway_settings;
CREATE POLICY "Admins can manage gateway settings"
  ON payment_gateway_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Function to update updated_at timestamp (must be created before triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_gateway_settings_updated_at ON payment_gateway_settings;
CREATE TRIGGER update_payment_gateway_settings_updated_at
  BEFORE UPDATE ON payment_gateway_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


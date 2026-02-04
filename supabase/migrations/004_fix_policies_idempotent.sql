-- Fix: Make all policies idempotent
-- Run this to drop and recreate all policies safely

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Roles policies
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;

-- User roles policies
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

-- Employee locations policies
DROP POLICY IF EXISTS "Admins can manage employee locations" ON employee_locations;
DROP POLICY IF EXISTS "Employees can view own locations" ON employee_locations;

-- Locations policies
DROP POLICY IF EXISTS "Everyone can view active locations" ON locations;
DROP POLICY IF EXISTS "Admins can manage locations" ON locations;
DROP POLICY IF EXISTS "Employees can view assigned locations" ON locations;

-- Services policies
DROP POLICY IF EXISTS "Everyone can view active services" ON services;
DROP POLICY IF EXISTS "Admins can manage services" ON services;

-- Turfs policies
DROP POLICY IF EXISTS "Everyone can view available turfs" ON turfs;
DROP POLICY IF EXISTS "Admins can manage turfs" ON turfs;
DROP POLICY IF EXISTS "Employees can view turfs at assigned locations" ON turfs;

-- Hourly pricing policies
DROP POLICY IF EXISTS "Everyone can view pricing" ON hourly_pricing;
DROP POLICY IF EXISTS "Admins can manage pricing" ON hourly_pricing;

-- Bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Employees can view bookings at assigned locations" ON bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;

-- Booking slots policies
DROP POLICY IF EXISTS "Users can view slots for own bookings" ON booking_slots;
DROP POLICY IF EXISTS "Users can create slots for own bookings" ON booking_slots;
DROP POLICY IF EXISTS "Admins can view all booking slots" ON booking_slots;

-- Payments policies
DROP POLICY IF EXISTS "Users can view payments for own bookings" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;

-- Payment gateway settings policies
DROP POLICY IF EXISTS "Admins can manage gateway settings" ON payment_gateway_settings;

-- Now recreate all policies (copy from 001_initial_schema.sql after line 166)

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Roles policies (admin only)
CREATE POLICY "Admins can manage roles"
  ON roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- User roles policies (fixed - removed recursion)
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Employee locations policies
CREATE POLICY "Admins can manage employee locations"
  ON employee_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY "Employees can view own locations"
  ON employee_locations FOR SELECT
  USING (auth.uid() = employee_id);

-- Locations policies (simplified - removed redundant policy)
CREATE POLICY "Everyone can view active locations"
  ON locations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage locations"
  ON locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Services policies
CREATE POLICY "Everyone can view active services"
  ON services FOR SELECT
  USING (is_active = true);

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
CREATE POLICY "Everyone can view available turfs"
  ON turfs FOR SELECT
  USING (is_available = true);

CREATE POLICY "Admins can manage turfs"
  ON turfs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Hourly pricing policies
CREATE POLICY "Everyone can view pricing"
  ON hourly_pricing FOR SELECT
  USING (true);

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
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY "Employees can view bookings at assigned locations"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employee_locations el
      JOIN turfs t ON el.location_id = t.location_id
      WHERE el.employee_id = auth.uid() AND t.id = bookings.turf_id
    )
  );

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
CREATE POLICY "Users can view slots for own bookings"
  ON booking_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_slots.booking_id AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create slots for own bookings"
  ON booking_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_slots.booking_id AND bookings.user_id = auth.uid()
    )
  );

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
CREATE POLICY "Users can view payments for own bookings"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

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
CREATE POLICY "Admins can manage gateway settings"
  ON payment_gateway_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );



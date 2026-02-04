-- Make all policies idempotent by adding DROP IF EXISTS before each CREATE POLICY
-- This allows the migration to be run multiple times safely

-- Run this to fix existing policies, then update the migration file

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



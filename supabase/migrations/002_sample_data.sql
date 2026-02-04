-- Sample data for testing the booking system
-- Run this after 001_initial_schema.sql

-- Insert sample locations
INSERT INTO locations (name, address, city, state, pincode, is_active)
VALUES
  ('RIAM Sports Center - Main', '123 Sports Avenue', 'Bangalore', 'Karnataka', '560001', true),
  ('RIAM Sports Center - North', '456 Stadium Road', 'Bangalore', 'Karnataka', '560002', true),
  ('RIAM Sports Center - South', '789 Ground Street', 'Bangalore', 'Karnataka', '560003', true)
ON CONFLICT DO NOTHING;

-- Insert sample services (sports)
INSERT INTO services (name, description, is_active)
VALUES
  ('Football', '11-a-side football turf', true),
  ('Cricket', 'Cricket net practice and matches', true),
  ('Basketball', 'Full court basketball', true),
  ('Tennis', 'Tennis court booking', true),
  ('Badminton', 'Indoor badminton courts', true),
  ('Volleyball', 'Volleyball court', true)
ON CONFLICT DO NOTHING;

-- Get location and service IDs (assuming they exist)
-- Insert sample turfs
INSERT INTO turfs (location_id, service_id, name, is_available)
SELECT 
  l.id,
  s.id,
  s.name || ' - ' || l.name,
  true
FROM locations l
CROSS JOIN services s
WHERE l.is_active = true AND s.is_active = true
ON CONFLICT DO NOTHING;

-- Insert hourly pricing (6 AM to 11 PM, ₹500-₹2000 per hour)
INSERT INTO hourly_pricing (turf_id, hour, price)
SELECT 
  t.id,
  hour,
  CASE 
    WHEN hour BETWEEN 6 AND 9 THEN 500  -- Early morning discount
    WHEN hour BETWEEN 10 AND 17 THEN 1000  -- Day time
    WHEN hour BETWEEN 18 AND 21 THEN 1500  -- Evening peak
    WHEN hour BETWEEN 22 AND 23 THEN 1200  -- Late evening
    ELSE 800  -- Other hours
  END
FROM turfs t
CROSS JOIN generate_series(6, 23) AS hour
WHERE t.is_available = true
ON CONFLICT (turf_id, hour) DO NOTHING;

-- Set default payment gateway (Razorpay)
INSERT INTO payment_gateway_settings (active_gateway)
VALUES ('razorpay')
ON CONFLICT (id) DO UPDATE SET active_gateway = 'razorpay';



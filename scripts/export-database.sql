-- Database Export Script
-- Run this in your OLD Supabase project's SQL Editor
-- This will generate JSON data for all tables

-- Export Roles (excluding system roles that will be recreated)
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT id, name, description, is_system_role, created_at
  FROM roles
  WHERE is_system_role = false OR is_system_role IS NULL
) t;

-- Export Permissions (excluding system permissions that will be recreated)
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT id, name, description, created_at
  FROM permissions
) t;

-- Export Role Permissions
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT rp.id, rp.role_id, rp.permission_id, rp.created_at,
         r.name as role_name, p.name as permission_name
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  JOIN permissions p ON rp.permission_id = p.id
) t;

-- Export Locations
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT id, name, address, city, state, pincode, is_active, created_at
  FROM locations
) t;

-- Export Services
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT id, name, description, is_active, created_at
  FROM services
) t;

-- Export Profiles
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT id, full_name, mobile_number, profile_image, created_at
  FROM profiles
) t;

-- Export User Roles
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT ur.id, ur.user_id, ur.role_id, ur.created_at,
         r.name as role_name,
         p.email as user_email
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  LEFT JOIN auth.users u ON ur.user_id = u.id
  LEFT JOIN profiles p ON u.id = p.id
) t;

-- Export User Role Locations
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT url.id, url.user_id, url.role_id, url.location_id, url.created_at,
         r.name as role_name,
         l.name as location_name,
         p.email as user_email
  FROM user_role_locations url
  JOIN roles r ON url.role_id = r.id
  JOIN locations l ON url.location_id = l.id
  LEFT JOIN auth.users u ON url.user_id = u.id
  LEFT JOIN profiles p ON u.id = p.id
) t;

-- Export Employee Locations
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT el.id, el.employee_id, el.location_id, el.created_at,
         l.name as location_name,
         p.email as employee_email
  FROM employee_locations el
  JOIN locations l ON el.location_id = l.id
  LEFT JOIN auth.users u ON el.employee_id = u.id
  LEFT JOIN profiles p ON u.id = p.id
) t;

-- Export Turfs
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT t.id, t.location_id, t.service_id, t.name, t.is_available, t.created_at,
         l.name as location_name,
         s.name as service_name
  FROM turfs t
  JOIN locations l ON t.location_id = l.id
  JOIN services s ON t.service_id = s.id
) t;

-- Export Hourly Pricing
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT hp.id, hp.turf_id, hp.hour, hp.price, hp.created_at,
         t.name as turf_name
  FROM hourly_pricing hp
  JOIN turfs t ON hp.turf_id = t.id
) t;

-- Export Bookings
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT b.id, b.booking_id, b.user_id, b.turf_id, b.booking_date,
         b.total_amount, b.advance_amount, b.payment_status, b.booking_status,
         b.payment_gateway, b.payment_gateway_order_id, b.created_at, b.updated_at,
         p.email as user_email,
         t.name as turf_name
  FROM bookings b
  LEFT JOIN auth.users u ON b.user_id = u.id
  LEFT JOIN profiles p ON u.id = p.id
  JOIN turfs t ON b.turf_id = t.id
) t;

-- Export Booking Slots
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT bs.id, bs.booking_id, bs.hour, bs.created_at,
         b.booking_id as booking_reference
  FROM booking_slots bs
  JOIN bookings b ON bs.booking_id = b.id
) t;

-- Export Payments
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT p.id, p.booking_id, p.amount, p.payment_type, p.payment_gateway,
         p.gateway_order_id, p.gateway_payment_id, p.status, p.created_at, p.updated_at,
         b.booking_id as booking_reference
  FROM payments p
  JOIN bookings b ON p.booking_id = b.id
) t;

-- Export Payment Gateway Settings
SELECT json_agg(row_to_json(t)) as data
FROM (
  SELECT id, active_gateway, created_at, updated_at
  FROM payment_gateway_settings
) t;

-- Note: To export all at once, you can create a function or use the Node.js script
-- The Node.js script (export-database.js) will handle this more elegantly


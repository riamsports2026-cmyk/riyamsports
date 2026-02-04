/**
 * Script to create a test manager user
 * 
 * This script creates a user with:
 * - Email: testmanager@gmail.com
 * - Password: TestManager123! (change after first login)
 * - Name: Test Manager
 * - Mobile: 9876543210
 * - Role: Manager (only one role)
 * - Location: Abc
 * 
 * Run this in Node.js or use it as a reference for manual creation via admin panel.
 */

const userDetails = {
  email: 'testmanager@gmail.com',
  password: 'TestManager123!', // User should change this after first login
  full_name: 'Test Manager',
  mobile_number: '9876543210',
  roleName: 'manager',
  locationName: 'Abc', // Location name to find
};

console.log('========================================');
console.log('Create Test Manager User');
console.log('========================================');
console.log('');
console.log('User Details:');
console.log(`  Email: ${userDetails.email}`);
console.log(`  Password: ${userDetails.password}`);
console.log(`  Name: ${userDetails.full_name}`);
console.log(`  Mobile: ${userDetails.mobile_number}`);
console.log(`  Role: ${userDetails.roleName}`);
console.log(`  Location: ${userDetails.locationName}`);
console.log('');
console.log('========================================');
console.log('SQL to Create User Manually');
console.log('========================================');
console.log('');
console.log('Step 1: Find the location ID for "Abc":');
console.log(`
SELECT id, name FROM locations WHERE name ILIKE '%Abc%' OR name ILIKE '%abc%';
`);
console.log('');
console.log('Step 2: Find the Manager role ID:');
console.log(`
SELECT id, name FROM roles WHERE name = 'manager';
`);
console.log('');
console.log('Step 3: Create the user via Supabase Auth (use Supabase Dashboard or API):');
console.log(`
-- Go to Supabase Dashboard > Authentication > Users > Add User
-- Email: ${userDetails.email}
-- Password: ${userDetails.password}
-- Auto Confirm Email: Yes
`);
console.log('');
console.log('Step 4: After user is created, get the user ID and run:');
console.log(`
-- Replace <USER_ID> with the actual user ID from auth.users
-- Replace <LOCATION_ID> with the location ID from Step 1
-- Replace <ROLE_ID> with the role ID from Step 2

-- Create profile
INSERT INTO profiles (id, full_name, mobile_number)
VALUES (
  '<USER_ID>',
  '${userDetails.full_name}',
  '${userDetails.mobile_number}'
)
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    mobile_number = EXCLUDED.mobile_number;

-- Remove any existing roles (ensure only one role)
DELETE FROM user_roles WHERE user_id = '<USER_ID>';
DELETE FROM user_role_locations WHERE user_id = '<USER_ID>';

-- Assign Manager role to Abc location (only role)
INSERT INTO user_role_locations (user_id, role_id, location_id)
VALUES (
  '<USER_ID>',
  '<ROLE_ID>',
  '<LOCATION_ID>'
)
ON CONFLICT (user_id, role_id, location_id) DO NOTHING;
`);
console.log('');
console.log('========================================');
console.log('Alternative: Use Admin Panel');
console.log('========================================');
console.log('');
console.log('1. Go to /admin/users');
console.log('2. Click "Create User" button');
console.log('3. Fill in the form:');
console.log(`   - Email: ${userDetails.email}`);
console.log(`   - Password: ${userDetails.password}`);
console.log(`   - Full Name: ${userDetails.full_name}`);
console.log(`   - Mobile Number: ${userDetails.mobile_number}`);
console.log(`   - Role: Manager`);
console.log(`   - Location: Abc`);
console.log('4. Submit the form');
console.log('');
console.log('Note: The create user function ensures only one role is assigned.');
console.log('If the user already has roles, they will be removed before assigning the new role.');
console.log('');



/**
 * Script to assign admin role to a user
 * 
 * Usage:
 * 1. Get your user ID from Supabase Dashboard → Authentication → Users
 * 2. Update USER_EMAIL or USER_ID below
 * 3. Run: node scripts/assign-admin-role.js
 * 
 * This will output SQL that you can run in Supabase SQL Editor
 */

// Option 1: Find user by email
const USER_EMAIL = 'your-email@example.com'; // Replace with your email

// Option 2: Use user ID directly (if you know it)
const USER_ID = null; // Replace with your user ID if you have it

console.log('📝 SQL to assign admin role:\n');
console.log('-- Copy and paste this in Supabase SQL Editor\n');

if (USER_ID) {
  // If you have the user ID directly
  console.log(`-- Assign admin role to user: ${USER_ID}`);
  console.log(`
-- Remove any existing roles
DELETE FROM user_roles WHERE user_id = '${USER_ID}';
DELETE FROM user_role_locations WHERE user_id = '${USER_ID}';

-- Assign admin role
INSERT INTO user_roles (user_id, role_id)
SELECT 
  '${USER_ID}',
  id
FROM roles
WHERE name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Verify the assignment
SELECT 
  u.email,
  r.name as role_name
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.id = '${USER_ID}';
`);
} else {
  // Find user by email and assign admin role
  console.log(`-- Assign admin role to user with email: ${USER_EMAIL}`);
  console.log(`
-- Step 1: Find your user ID (run this first to get your user ID)
SELECT id, email FROM auth.users WHERE email = '${USER_EMAIL}';

-- Step 2: Replace YOUR_USER_ID_HERE with the ID from Step 1, then run:
-- Remove any existing roles
DELETE FROM user_roles WHERE user_id = 'YOUR_USER_ID_HERE';
DELETE FROM user_role_locations WHERE user_id = 'YOUR_USER_ID_HERE';

-- Assign admin role
INSERT INTO user_roles (user_id, role_id)
SELECT 
  'YOUR_USER_ID_HERE',
  id
FROM roles
WHERE name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Step 3: Verify the assignment
SELECT 
  u.email,
  r.name as role_name
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = '${USER_EMAIL}';
`);
}

console.log('\n✅ After running the SQL:');
console.log('   1. Try logging in at /admin/login again');
console.log('   2. You should now have admin access!');






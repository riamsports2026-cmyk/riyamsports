# How to Assign Admin Role to Your Account

## Problem
You created an account via `/admin/login`, but the account doesn't have admin privileges. The admin login page only logs in existing admin users - it doesn't create admin accounts.

## Solution: Assign Admin Role Manually

You have two options:

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Get your user ID:**
   - Go to: https://supabase.com/dashboard/project/txjoamolqaltmvczetcp/auth/users
   - Find your account (by email)
   - Copy your User ID (UUID)

2. **Run SQL in Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/txjoamolqaltmvczetcp/sql/new
   - Paste and run this SQL (replace `YOUR_USER_ID_HERE` with your actual user ID):

```sql
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

-- Verify the assignment
SELECT 
  u.email,
  r.name as role_name
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.id = 'YOUR_USER_ID_HERE';
```

3. **Test:**
   - Go to http://localhost:3000/admin/login
   - Log in with your credentials
   - You should now have admin access!

### Option 2: Using the Helper Script

1. **Update the script:**
   - Edit `scripts/assign-admin-role.js`
   - Set `USER_EMAIL` to your email address

2. **Run the script:**
   ```bash
   node scripts/assign-admin-role.js
   ```

3. **Copy the SQL output** and run it in Supabase SQL Editor

### Option 3: Find User by Email (If you don't know your User ID)

If you only know your email, use this SQL:

```sql
-- Step 1: Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: Use the ID from Step 1 in the SQL from Option 1
```

## Alternative: Create Admin Account via Admin Panel

If you already have admin access (from another account):

1. Go to: http://localhost:3000/admin/users
2. Click "+ Create User Account"
3. Fill in the form:
   - Email: your email
   - Password: your password
   - Full Name: your name
   - Mobile Number: your mobile
   - Role: **Admin** (select from dropdown)
   - Location: Not needed for admin (leave empty)
4. Click "Create User"
5. Now you can log in at `/admin/login` with admin privileges

## Important Notes

- **Admin role is global** - it doesn't require a location assignment
- **Only one role per user** - assigning admin will remove any other roles
- **Admin has full access** - can manage users, roles, locations, bookings, etc.

## Verify Admin Access

After assigning the role, you should be able to:
- Log in at `/admin/login`
- Access `/admin` dashboard
- See all admin features (Users, Roles, Locations, etc.)






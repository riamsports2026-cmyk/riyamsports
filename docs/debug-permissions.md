# Debugging Staff Permissions

If permissions are not reflecting for staff users, follow these steps:

## 1. Check User Permissions Page

Staff users can now view their permissions at:
- **URL**: `/staff/permissions`
- This page shows:
  - All assigned roles
  - All permissions from those roles
  - Permissions grouped by role
  - Debug information

## 2. Verify Permission Assignment

1. Go to **Admin → Roles**
2. Find the role assigned to the staff user
3. Check the "Permissions" section for that role
4. Ensure the required permissions are checked:
   - `manage_bookings` - Required for staff access
   - `book_turf` - If staff should be able to book
   - `view_bookings` - If staff should view bookings
   - Other permissions as needed

## 3. Verify Role Assignment

1. Go to **Admin → Users & Roles**
2. Find the staff user
3. Verify they have the correct role assigned
4. If location-based role, verify the location is correct

## 4. Check Database Directly

Run this SQL in Supabase SQL Editor to check a user's permissions:

```sql
-- Replace 'user_email@example.com' with the actual email
WITH user_info AS (
  SELECT id, email 
  FROM auth.users 
  WHERE email = 'user_email@example.com'
),
user_roles AS (
  SELECT ur.role_id, r.name as role_name
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  JOIN user_info u ON ur.user_id = u.id
  
  UNION
  
  SELECT url.role_id, r.name as role_name
  FROM user_role_locations url
  JOIN roles r ON url.role_id = r.id
  JOIN user_info u ON url.user_id = u.id
)
SELECT 
  p.name as permission_name,
  p.description,
  STRING_AGG(DISTINCT ur.role_name, ', ') as from_roles
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
GROUP BY p.name, p.description
ORDER BY p.name;
```

## 5. Common Issues

### Issue: Permissions assigned but not working

**Solution**: 
- Clear browser cache
- Log out and log back in
- Check that permissions are saved in `role_permissions` table

### Issue: Role assigned but permissions not showing

**Solution**:
- Verify the role has permissions assigned in Admin → Roles
- Check that `role_permissions` table has entries for that role
- Ensure role name matches exactly (case-sensitive, lowercase)

### Issue: Location-based role not working

**Solution**:
- Verify role is assigned in `user_role_locations` table (not just `user_roles`)
- Check that location_id is correct
- Ensure the role has `manage_bookings` permission

## 6. Permission Names Reference

- `book_turf` - Can book turfs
- `view_bookings` - Can view own bookings
- `manage_bookings` - Can view and manage all bookings (required for staff)
- `manage_locations` - Can manage locations
- `manage_services` - Can manage services/sports
- `manage_roles` - Can add, edit, and remove roles
- `manage_users` - Can create and manage user accounts

## 7. Testing Permissions

After assigning permissions:
1. Staff user should log out and log back in
2. Check `/staff/permissions` page to verify permissions are showing
3. Try accessing staff features to verify they work






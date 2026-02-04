# Login, Roles & Permissions Flow - Complete Guide

## 📊 Database Structure

### Core Tables

```
┌─────────────────┐
│   auth.users    │  ← Supabase Auth (email, password)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    profiles     │  ← User profile (full_name, mobile_number)
└─────────────────┘

┌─────────────────┐
│     roles       │  ← Available roles (admin, manager, sub_admin, etc.)
└─────────────────┘

┌─────────────────┐
│   permissions   │  ← Available permissions (manage_bookings, etc.)
└─────────────────┘

┌─────────────────┐      ┌──────────────────────┐
│   user_roles    │      │ user_role_locations   │
│ (Global Roles)  │      │ (Location-based)      │
└─────────────────┘      └──────────────────────┘
         │                        │
         └────────┬───────────────┘
                  ▼
         ┌─────────────────┐
         │ role_permissions│  ← Links roles to permissions
         └─────────────────┘
```

### Key Relationships

1. **Global Roles** (`user_roles`): 
   - `admin` → Access to all locations
   - Stored in `user_roles` table
   - No location restriction

2. **Location-Based Roles** (`user_role_locations`):
   - `manager`, `sub_admin`, `account_manager`, etc.
   - Stored in `user_role_locations` table
   - Requires a `location_id` (scoped to specific location)

3. **Permissions** (`role_permissions`):
   - Links roles to permissions
   - Example: `manager` role → `manage_bookings` permission

---

## 🔐 Login Flow

### 1. Customer Login (`/login`)

```
User visits /login
    ↓
Google OAuth OR Email/Password
    ↓
Supabase Auth validates credentials
    ↓
Check if user is admin/sub-admin?
    ├─ YES → Redirect to /admin
    └─ NO → Continue
    ↓
Check if profile complete?
    ├─ NO → Redirect to /complete-profile
    └─ YES → Redirect to /book
```

**Code Flow:**
- `app/login/page.tsx` → `components/login-form.tsx`
- `lib/actions/auth.ts` → `signInWithGoogle()` or `signInWithPassword()`
- `middleware.ts` → Checks role and redirects

---

### 2. Admin/Sub-Admin Login (`/admin/login`)

```
User visits /admin/login
    ↓
Enter email & password
    ↓
Supabase Auth validates
    ↓
Check: isAdminOrSubAdmin(userId)?
    ├─ NO → Sign out, show error
    └─ YES → Continue
    ↓
Check if profile complete?
    ├─ NO → Redirect to /complete-profile
    └─ YES → Redirect to /admin
```

**Sub-Admin Roles:**
- `admin` (global)
- `sub_admin` (location-based)
- `manager` (location-based)
- `account_manager` (location-based)

**Code Flow:**
- `app/admin/login/page.tsx` → `components/admin/admin-login-form.tsx`
- `lib/actions/auth/admin.ts` → `signInWithEmail()`
- Checks: `isAdminOrSubAdmin()` from `lib/utils/roles.ts`

---

### 3. Staff Login (`/staff/login`)

```
User visits /staff/login
    ↓
Enter email & password
    ↓
Supabase Auth validates
    ↓
Check: hasPermission(userId, 'manage_bookings') OR isAdmin?
    ├─ NO → Sign out, show error
    └─ YES → Continue
    ↓
Check if profile complete?
    ├─ NO → Redirect to /complete-profile
    └─ YES → Redirect to /staff
```

**Code Flow:**
- `app/staff/login/page.tsx` → `components/staff/staff-login-form.tsx`
- `lib/actions/auth/staff.ts` → `signInWithEmail()`
- Checks: `isStaff()` which calls `hasPermission(userId, 'manage_bookings')`

---

## 🎭 Role Assignment Flow

### How Roles Are Assigned

#### 1. Global Role (Admin)
```
Admin Panel → Users → Assign Role
    ↓
Select User
    ↓
Select Role: "admin"
    ↓
No location needed (global)
    ↓
Insert into: user_roles table
    ├─ user_id
    ├─ role_id (admin)
    └─ created_at
```

#### 2. Location-Based Role (Manager, Sub-Admin, etc.)
```
Admin Panel → Users → Assign Role
    ↓
Select User
    ↓
Select Role: "manager" or "sub_admin"
    ↓
Select Location: "RIAM Sports Center - South"
    ↓
Insert into: user_role_locations table
    ├─ user_id
    ├─ role_id (manager)
    ├─ location_id
    └─ created_at
```

**Code:**
- `lib/actions/admin/user-roles.ts` → `assignLocationRole()`
- Handles both global and location-based assignments

---

## 🔑 Permission Checking Flow

### How Permissions Work

```
User Action (e.g., "View Bookings")
    ↓
Check: hasPermission(userId, 'manage_bookings')
    ↓
1. Get all user's roles
   ├─ From user_roles (global)
   └─ From user_role_locations (location-based)
    ↓
2. Get role IDs
    ↓
3. Check role_permissions table
   └─ Does any role have this permission?
    ↓
4. Return true/false
```

### Permission Check Example

```typescript
// In your component or server action
import { hasPermission } from '@/lib/utils/permissions';

const canManageBookings = await hasPermission(userId, 'manage_bookings');

if (canManageBookings) {
  // Show booking management UI
} else {
  // Hide or disable features
}
```

### Available Permissions

1. **`manage_roles`** - Can add, edit, remove roles
2. **`manage_users`** - Can create and manage user accounts
3. **`manage_bookings`** - Can view and manage all bookings (required for staff)
4. **`manage_locations`** - Can manage locations
5. **`manage_services`** - Can manage services/sports
6. **`book_turf`** - Can book turfs (customers)
7. **`view_bookings`** - Can view own bookings

---

## 🛡️ Access Control Flow (Middleware)

### Route Protection

```
User requests /admin/bookings
    ↓
Middleware intercepts
    ↓
Check: Is user authenticated?
    ├─ NO → Redirect to /admin/login
    └─ YES → Continue
    ↓
Check: Is profile complete?
    ├─ NO → Redirect to /complete-profile
    └─ YES → Continue
    ↓
Check: isAdminOrSubAdmin(userId)?
    ├─ NO → Redirect to /admin/login
    └─ YES → Allow access
```

### Staff Route Protection

```
User requests /staff
    ↓
Middleware intercepts
    ↓
Check: Is user authenticated?
    ├─ NO → Redirect to /staff/login
    └─ YES → Continue
    ↓
Check: Is profile complete?
    ├─ NO → Redirect to /complete-profile
    └─ YES → Continue
    ↓
Check: isAdmin() OR hasPermission('manage_bookings')?
    ├─ NO → Redirect to /staff/login?error=no_permission
    └─ YES → Allow access
```

---

## 📋 Complete User Journey Example

### Scenario: Creating a Manager for a Location

#### Step 1: Admin Creates User
```
Admin → Users → Create User Account
    ↓
Enter: email, password, name, mobile
    ↓
User created in auth.users
    ↓
Profile created in profiles table
```

#### Step 2: Admin Assigns Role
```
Admin → Roles → Assign Role
    ↓
Select User: "John Doe"
    ↓
Select Role: "manager"
    ↓
Select Location: "RIAM Sports Center - South"
    ↓
Save
    ↓
Insert into user_role_locations:
    - user_id: john's-id
    - role_id: manager-role-id
    - location_id: south-location-id
```

#### Step 3: Admin Assigns Permissions to Role
```
Admin → Roles → Select "manager" role
    ↓
Permissions section
    ↓
Check: manage_bookings ✓
    ↓
Check: view_bookings ✓
    ↓
Save
    ↓
Insert into role_permissions:
    - role_id: manager-role-id
    - permission_id: manage_bookings-id
```

#### Step 4: Manager Logs In
```
Manager visits /staff/login
    ↓
Enters email & password
    ↓
System checks:
    1. getUserRoles() → Returns ['manager']
    2. hasPermission('manage_bookings') → 
       - Gets manager role_id
       - Checks role_permissions
       - Finds manage_bookings permission
       - Returns TRUE
    ↓
Redirect to /staff
```

---

## 🔍 Key Functions Reference

### Role Functions (`lib/utils/roles.ts`)

```typescript
// Get all roles for a user (global + location-based)
getUserRoles(userId): Promise<UserRoleName[]>

// Check if user has specific role
hasRole(userId, 'admin'): Promise<boolean>

// Check if user is admin
isAdmin(userId): Promise<boolean>

// Check if user is admin or sub-admin (can access /admin)
isAdminOrSubAdmin(userId): Promise<boolean>

// Check if user is staff (has manage_bookings permission)
isStaff(userId): Promise<boolean>

// Get location IDs for staff user
getStaffLocationIds(userId): Promise<string[]>
```

### Permission Functions (`lib/utils/permissions.ts`)

```typescript
// Check if user has specific permission
hasPermission(userId, 'manage_bookings'): Promise<boolean>

// Get all permissions for a user
getUserPermissions(userId): Promise<string[]>
```

---

## 🎯 Common Use Cases

### 1. Check if user can access admin panel
```typescript
import { isAdminOrSubAdmin } from '@/lib/utils/roles';

if (await isAdminOrSubAdmin(userId)) {
  // Show admin navigation
}
```

### 2. Check if user can manage bookings
```typescript
import { hasPermission } from '@/lib/utils/permissions';

if (await hasPermission(userId, 'manage_bookings')) {
  // Show booking management features
}
```

### 3. Get user's accessible locations
```typescript
import { getStaffLocationIds } from '@/lib/utils/roles';

const locationIds = await getStaffLocationIds(userId);
// Returns: ['location-id-1', 'location-id-2']
```

### 4. Filter bookings by user's locations
```typescript
const locationIds = await getStaffLocationIds(userId);
const bookings = await getBookingsForLocations(locationIds);
```

---

## ⚠️ Important Notes

1. **Global vs Location-Based Roles:**
   - `admin` → Always global (no location)
   - `manager`, `sub_admin` → Location-based (requires location)

2. **Permission Inheritance:**
   - User gets permissions from ALL their roles
   - If user has multiple roles, permissions are combined

3. **Default Role:**
   - If user has no roles → Defaults to `customer`
   - Customer can only book turfs

4. **Sub-Admin Access:**
   - `admin`, `sub_admin`, `manager`, `account_manager` can all access `/admin/login`
   - They all use the same admin panel
   - Permissions control what they can do

5. **Staff Access:**
   - Any role with `manage_bookings` permission can access `/staff/login`
   - Doesn't need to be a specific "staff" role

---

## 🐛 Debugging

### Check User's Roles
```sql
SELECT 
  u.email,
  r.name as role_name,
  CASE 
    WHEN ur.id IS NOT NULL THEN 'Global'
    WHEN url.id IS NOT NULL THEN 'Location-based'
  END as role_type,
  l.name as location_name
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN user_role_locations url ON url.user_id = u.id
LEFT JOIN roles r ON (r.id = ur.role_id OR r.id = url.role_id)
LEFT JOIN locations l ON l.id = url.location_id
WHERE u.email = 'user@example.com';
```

### Check User's Permissions
```sql
WITH user_roles AS (
  SELECT role_id FROM user_roles WHERE user_id = 'user-id'
  UNION
  SELECT role_id FROM user_role_locations WHERE user_id = 'user-id'
)
SELECT DISTINCT p.name as permission
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id;
```

---

## 📝 Summary

1. **Login** → Authenticates user via Supabase Auth
2. **Role Check** → Determines user's roles (global + location-based)
3. **Permission Check** → Checks if user's roles have required permissions
4. **Access Control** → Middleware protects routes based on roles/permissions
5. **UI Rendering** → Components show/hide features based on permissions

The system is flexible: you can create custom roles, assign permissions, and users get access based on their role assignments!




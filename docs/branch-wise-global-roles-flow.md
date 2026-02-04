# Branch-wise and Global Roles - Complete Flow Documentation

## 📋 Overview

The system supports **two types of role assignments** for ANY role (CEO, Employee, Manager, etc.):

1. **Branch-wise (Location-based)**: Role is tied to a specific location/branch
2. **Global**: Role has access to all locations/branches

## 🗄️ Database Structure

### Tables

```
┌─────────────────┐
│     roles       │  ← Available roles (ceo, manager, employee, etc.)
└─────────────────┘

┌─────────────────┐      ┌──────────────────────┐
│   user_roles    │      │ user_role_locations   │
│ (Global Roles)  │      │ (Branch-wise Roles)   │
│                 │      │                       │
│ - user_id       │      │ - user_id            │
│ - role_id       │      │ - role_id            │
│ - created_at    │      │ - location_id         │
└─────────────────┘      │ - created_at          │
                          └──────────────────────┘
```

### Key Points

- **Global Roles** (`user_roles` table):
  - No `location_id` field
  - User has access to ALL locations
  - Example: Global CEO, Global Manager

- **Branch-wise Roles** (`user_role_locations` table):
  - Has `location_id` field
  - User has access to ONLY that specific location
  - Example: Branch CEO (South), Branch Manager (North)

## 🔄 Complete Flow

### 1. Creating a User with Role Assignment

**Path**: `/admin/users` → "Create User Account"

**Steps**:
1. Fill in user details (email, password, full name, mobile)
2. Select a role (CEO, Manager, Employee, etc.)
3. Choose **Assignment Type**:
   - **Global**: Access to all locations
   - **Branch-wise**: Access to specific location
4. If Branch-wise selected → Choose location from dropdown
5. Submit form

**What Happens**:
- If **Global**: 
  - Record inserted into `user_roles` table
  - `location_id` = NULL
  - User can access all locations

- If **Branch-wise**:
  - Record inserted into `user_role_locations` table
  - `location_id` = Selected location ID
  - User can only access that specific location

### 2. Assigning Role to Existing User

**Path**: `/admin/users` → "Assign Role" button

**Steps**:
1. Select user from dropdown
2. Select role (CEO, Manager, Employee, etc.)
3. Choose **Assignment Type**:
   - **Global**: Access to all locations
   - **Branch-wise**: Access to specific location
4. If Branch-wise selected → Choose location from dropdown
5. Submit form

**What Happens**:
- System removes any existing assignment of the same role (global or branch-wise)
- Creates new assignment based on selected type
- If switching from global to branch-wise (or vice versa), old assignment is removed

### 3. Updating User Role

**Path**: `/admin/users` → User row → Role dropdown

**Steps**:
1. Select new role from dropdown
2. Choose **Assignment Type** (Global or Branch)
3. If Branch selected → Choose location
4. Click "Update"

**What Happens**:
- Old role assignment is removed
- New role assignment is created based on selected type

## 🔐 Access Control Flow

### Role Retrieval (`getUserRoles`)

**Function**: `lib/utils/roles.ts` → `getUserRoles(userId)`

**Process**:
1. Fetches **global roles** from `user_roles` table
2. Fetches **location-based roles** from `user_role_locations` table
3. Combines both into a single array
4. Returns all roles the user has

**Example**:
- User has: Global CEO role + Branch Manager (South) role
- Returns: `['ceo', 'manager']`

### Location Access Control

**For Branch-wise Roles**:
- `getStaffLocationIds(userId)` fetches location IDs from `user_role_locations`
- User can only access bookings/data for those specific locations

**For Global Roles**:
- No location restriction
- User can access all locations

### Permission Checks

**Function**: `lib/utils/permissions.ts` → `hasPermission(userId, permission)`

**Process**:
1. Gets all user roles (global + branch-wise)
2. Checks if any role has the required permission
3. Returns true/false

**Note**: Permissions are role-based, not location-based. If a user has a role with a permission, they have that permission regardless of location assignment.

## 📊 Examples

### Example 1: Global CEO

**Assignment**:
- Role: CEO
- Type: Global
- Location: None

**Database**:
```sql
INSERT INTO user_roles (user_id, role_id) VALUES (...);
```

**Access**:
- ✅ All locations
- ✅ Admin panel access
- ✅ All permissions assigned to CEO role

### Example 2: Branch Manager (South Location)

**Assignment**:
- Role: Manager
- Type: Branch-wise
- Location: "RIAM Sports Center - South"

**Database**:
```sql
INSERT INTO user_role_locations (user_id, role_id, location_id) VALUES (...);
```

**Access**:
- ✅ Only "RIAM Sports Center - South" location
- ✅ Admin panel access (if manager role has permissions)
- ✅ Manager permissions for that location only

### Example 3: Branch Employee (North Location)

**Assignment**:
- Role: Employee
- Type: Branch-wise
- Location: "RIAM Sports Center - North"

**Database**:
```sql
INSERT INTO user_role_locations (user_id, role_id, location_id) VALUES (...);
```

**Access**:
- ✅ Only "RIAM Sports Center - North" location
- ✅ Staff panel access
- ✅ Employee permissions for that location only

### Example 4: User with Multiple Roles

**Scenario**: User is Global CEO AND Branch Manager (South)

**Database**:
```sql
-- Global role
INSERT INTO user_roles (user_id, role_id) VALUES (..., ceo_role_id);

-- Branch-wise role
INSERT INTO user_role_locations (user_id, role_id, location_id) 
VALUES (..., manager_role_id, south_location_id);
```

**Access**:
- ✅ All locations (from CEO role)
- ✅ Specific location access (from Manager role)
- ✅ Combined permissions from both roles

## 🎯 Key Features

### 1. Flexible Role Assignment
- **Any role** can be assigned as global or branch-wise
- No hardcoding - works for CEO, Manager, Employee, or any custom role

### 2. Automatic Conflict Resolution
- When assigning a role, system automatically removes conflicting assignments
- If assigning "Global CEO", removes any "Branch CEO" assignments
- If assigning "Branch Manager (South)", removes "Global Manager" assignment

### 3. Multiple Role Support
- User can have multiple roles
- Can mix global and branch-wise roles
- Example: Global CEO + Branch Manager (South)

### 4. Dynamic Admin Panel Access
- Any role except `employee` and `customer` can access admin panel
- Works for CEO, CTO, Manager, etc. without code changes

## 🔧 Technical Implementation

### Server Actions

**File**: `lib/actions/admin/user-roles.ts`

**Function**: `assignLocationRole(formData)`

**Logic**:
```typescript
const isBranchWise = !!validated.locationId;

if (isBranchWise) {
  // Store in user_role_locations
  // Remove global assignment of same role
} else {
  // Store in user_roles
  // Remove branch-wise assignments of same role
}
```

### UI Components

**Forms**:
1. `components/admin/create-user-form.tsx` - Create user with role
2. `components/admin/user-role-assignment-form.tsx` - Assign role to user
3. `components/admin/user-role-form.tsx` - Update user role

**All forms have**:
- Role selection dropdown
- Assignment Type radio buttons (Global / Branch-wise)
- Location dropdown (shown only when Branch-wise selected)

## 📝 Best Practices

### 1. Role Assignment Strategy

**Use Global Roles for**:
- Top-level executives (CEO, CTO)
- System administrators
- Roles that need access to all locations

**Use Branch-wise Roles for**:
- Location-specific managers
- Branch employees
- Roles that should be limited to specific locations

### 2. Multiple Assignments

- A user can have multiple roles
- Can mix global and branch-wise roles
- System combines permissions from all roles

### 3. Switching Assignment Types

- When switching from Global to Branch-wise (or vice versa):
  - Old assignment is automatically removed
  - New assignment is created
  - No manual cleanup needed

## 🔐 Login URLs by Role Type

### Admin Panel Access (`/admin/login`)

**Who can use**: Any role **except** `employee` and `customer`

**Examples**:
- ✅ Global CEO → `/admin/login`
- ✅ Branch-wise Manager → `/admin/login`
- ✅ Global Admin → `/admin/login`
- ✅ Branch-wise Account Manager → `/admin/login`
- ✅ Global CTO → `/admin/login`
- ❌ Employee → Cannot use `/admin/login`
- ❌ Customer → Cannot use `/admin/login`

**After Login**: Redirects to `/admin` dashboard

**Access Logic**:
- Uses `isAdminOrSubAdmin(userId)` function
- Dynamically checks if user's role is NOT `employee` and NOT `customer`
- Works for any custom role (CEO, CTO, Manager, etc.) without code changes

### Staff Panel Access (`/staff/login`)

**Who can use**: Users with `manage_bookings` permission OR `employee` role

**Examples**:
- ✅ Employee (branch-wise or global) → `/staff/login`
- ✅ Manager with `manage_bookings` permission → `/staff/login`
- ✅ Any role with `manage_bookings` permission → `/staff/login`
- ❌ Customer without permissions → Cannot use `/staff/login`

**After Login**: Redirects to `/staff` dashboard

**Access Logic**:
- Uses `isStaff(userId)` function
- Checks if user has `manage_bookings` permission
- OR checks if user has `employee` role

### Customer Login (`/login`)

**Who can use**: All users (including customers, employees, managers, etc.)

**Examples**:
- ✅ Customer → `/login`
- ✅ Employee → `/login` (but will redirect based on role)
- ✅ Manager → `/login` (but will redirect based on role)

**After Login Redirect Logic**:
1. If user is admin/sub-admin → Redirects to `/admin`
2. If user is staff → Redirects to `/staff` (if they access staff routes)
3. If user is customer → Redirects to `/book`
4. If profile incomplete → Redirects to `/complete-profile`

**Note**: This is the default login page. Users with admin/staff roles will be automatically redirected to their respective dashboards.

## 📍 Login URL Summary Table

| Role Type | Assignment | Login URL | Redirects To |
|-----------|-----------|-----------|--------------|
| **CEO** | Global | `/admin/login` | `/admin` |
| **CEO** | Branch-wise | `/admin/login` | `/admin` |
| **Manager** | Global | `/admin/login` | `/admin` |
| **Manager** | Branch-wise | `/admin/login` | `/admin` |
| **Account Manager** | Global | `/admin/login` | `/admin` |
| **Account Manager** | Branch-wise | `/admin/login` | `/admin` |
| **Admin** | Global | `/admin/login` | `/admin` |
| **Employee** | Global | `/staff/login` | `/staff` |
| **Employee** | Branch-wise | `/staff/login` | `/staff` |
| **Customer** | N/A | `/login` | `/book` |
| **Any Custom Role** (except employee/customer) | Global/Branch | `/admin/login` | `/admin` |

## 🚀 Summary

The system provides **complete flexibility** for role assignments:

✅ **Any role** can be global or branch-wise  
✅ **Automatic conflict resolution** when switching types  
✅ **Multiple roles** support (mix global + branch-wise)  
✅ **Dynamic access control** based on assignment type  
✅ **No code changes** needed for new roles (CEO, CTO, etc.)  
✅ **Dynamic login URLs** - Admin panel accessible to any role except employee/customer  

This allows you to create complex organizational structures while maintaining clear access control boundaries.


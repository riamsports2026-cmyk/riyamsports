import { createClient } from '@/lib/supabase/server';
import { UserRoleName } from '@/lib/types';
import { cache } from 'react';

export const getUserRoles = cache(async (userId: string): Promise<UserRoleName[]> => {
  // Use service client to bypass RLS for reliable role retrieval
  const { createServiceClient } = await import('@/lib/supabase/server');
  const serviceClient = await createServiceClient();
  
  const rolesSet = new Set<UserRoleName>();

  // Get global roles (from user_roles table - like admin)
  const { data: globalRoles, error: globalError } = await serviceClient
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId);

  if (!globalError && globalRoles) {
    globalRoles.forEach((item: any) => {
      const roleName = item.roles?.name;
      if (roleName) {
        rolesSet.add(roleName as UserRoleName);
      }
    });
  }

  // Get location-based roles (from user_role_locations table - like manager, sub_admin, etc.)
  const { data: locationRoles, error: locationError } = await serviceClient
    .from('user_role_locations')
    .select('roles(name)')
    .eq('user_id', userId);

  // Only log if there's an error or if location roles are found (to reduce noise)
  if (locationError) {
    console.error(`[getUserRoles] Error fetching location roles for user ${userId}:`, locationError);
  }

  if (!locationError && locationRoles) {
    locationRoles.forEach((item: any) => {
      const roleName = item.roles?.name;
      if (roleName) {
        rolesSet.add(roleName as UserRoleName);
      }
    });
    
    // Removed logging to reduce console noise
  }

  const roles = Array.from(rolesSet);
  
  // Removed logging to reduce console noise - only log errors

  // If no roles found, default to customer
  if (roles.length === 0) {
    return ['customer'];
  }

  return roles;
});

export async function hasRole(userId: string, role: UserRoleName): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}

export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, 'admin');
}

// Check if user is admin or sub-admin (can access admin panel)
// Dynamic: Any role except 'employee' and 'customer' can access admin panel
// This allows flexibility to create new roles (ceo, cto, etc.) without code changes
export async function isAdminOrSubAdmin(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  
  // Exclude employee and customer - all other roles can access admin panel
  const excludedRoles: UserRoleName[] = ['employee', 'customer'];
  
  return roles.some(role => !excludedRoles.includes(role));
}

export async function isEmployee(userId: string): Promise<boolean> {
  return hasRole(userId, 'employee');
}

export async function getEmployeeLocationIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('employee_locations')
    .select('location_id')
    .eq('employee_id', userId);

  if (error || !data) {
    return [];
  }

  return (data as { location_id: string }[]).map((item) => item.location_id);
}

// Get location IDs for staff members (from user_role_locations table)
export async function getStaffLocationIds(userId: string): Promise<string[]> {
  // Use service client to bypass RLS for reliable access
  const { createServiceClient } = await import('@/lib/supabase/server');
  const serviceClient = await createServiceClient();
  
  const { data, error } = await serviceClient
    .from('user_role_locations')
    .select('location_id, location:locations(id, name)')
    .eq('user_id', userId);

  if (error || !data) {
    console.error('[getStaffLocationIds] Error fetching staff location IDs:', error);
    return [];
  }

  return (data as { location_id: string }[]).map((item) => item.location_id);
}

// Check if user is staff (has manage_bookings permission)
// This allows custom roles to be recognized as staff if they have the permission
export async function isStaff(userId: string): Promise<boolean> {
  const { hasPermission } = await import('@/lib/utils/permissions');
  return hasPermission(userId, 'manage_bookings');
}

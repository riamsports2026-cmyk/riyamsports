import { getUserRoles } from './roles';
import { cache } from 'react';

export const hasPermission = cache(async (userId: string, permissionName: string): Promise<boolean> => {
  // Use service client to bypass RLS for reliable permission checks
  const { createServiceClient } = await import('@/lib/supabase/server');
  const serviceClient = await createServiceClient();
  
  const roles = await getUserRoles(userId);

  if (roles.length === 0) {
    return false;
  }

  // Normalize role names to lowercase (database stores them as lowercase)
  const normalizedRoles = roles.map(r => r.toLowerCase().trim());

  // Get role IDs using service client
  const { data: roleData, error: roleError } = await serviceClient
    .from('roles')
    .select('id, name')
    .in('name', normalizedRoles);

  if (roleError) {
    console.error(`[hasPermission] Error fetching roles:`, roleError);
    return false;
  }

  if (!roleData || roleData.length === 0) {
    return false;
  }

  const roleIds = (roleData as { id: string }[]).map((r) => r.id);

  const { data: perm, error: permError } = await serviceClient
    .from('permissions')
    .select('id')
    .eq('name', permissionName)
    .single();

  if (permError || !perm) {
    console.error(`[hasPermission] Permission '${permissionName}' not found:`, permError);
    return false;
  }

  const permission = perm as { id: string };
  const { data: rolePermissions, error: rpError } = await serviceClient
    .from('role_permissions')
    .select('role_id')
    .in('role_id', roleIds)
    .eq('permission_id', permission.id)
    .limit(1);

  if (rpError) {
    console.error(`[hasPermission] Error checking role permissions:`, rpError);
    return false;
  }

  const hasPerm = (rolePermissions?.length || 0) > 0;
  
  // Don't log missing permissions - it's expected behavior for customers
  // Only log actual errors (which are logged above)
  
  return hasPerm;
});

export const getUserPermissions = cache(async (userId: string): Promise<string[]> => {
  // Use service client to bypass RLS for reliable permission checks
  const { createServiceClient } = await import('@/lib/supabase/server');
  const serviceClient = await createServiceClient();
  
  const roleNames = await getUserRoles(userId);

  if (roleNames.length === 0) {
    return [];
  }

  const normalizedRoles = roleNames.map((r) => r.toLowerCase().trim());

  const { data: roleData } = await serviceClient
    .from('roles')
    .select('id, name')
    .in('name', normalizedRoles);

  const roleRows = (roleData ?? []) as { id: string; name: string }[];
  if (roleRows.length === 0) {
    return [];
  }

  const roleIds = roleRows.map((r) => r.id);

  // Get all permissions for these roles using service client
  const { data: rp } = await serviceClient
    .from('role_permissions')
    .select('permission:permissions(name)')
    .in('role_id', roleIds);

  const rolePermissions = rp as { permission: { name: string } | null }[] | null;
  if (!rolePermissions) {
    return [];
  }

  const permissionsSet = new Set<string>();
  rolePermissions.forEach((rp: any) => {
    if (rp.permission?.name) {
      permissionsSet.add(rp.permission.name);
    }
  });

  return Array.from(permissionsSet);
});



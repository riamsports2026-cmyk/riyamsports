'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const assignLocationRoleSchema = z.object({
  userId: z.string().uuid(),
  roleName: z.string().min(1, 'Role name is required'),
  locationId: z.string().uuid().optional(),
});

export async function getUserRoleLocations(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return [];
  }

  const serviceClient = await createServiceClient();

  const { data, error } = await serviceClient
    .from('user_role_locations')
    .select('*, role:roles(name), location:locations(id, name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getUserRolesWithLocations(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { globalRoles: [], locationRoles: [] };
  }

  const serviceClient = await createServiceClient();

  // Get global roles
  const { data: globalRoles } = await serviceClient
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId);

  // Get location-based roles
  const { data: locationRoles } = await serviceClient
    .from('user_role_locations')
    .select('roles(name), location:locations(id, name)')
    .eq('user_id', userId);

  return {
    globalRoles: globalRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [],
    locationRoles: locationRoles?.map((url: any) => ({
      role: url.roles?.name,
      location: url.location?.name,
      locationId: url.location?.id,
    })) || [],
  };
}

export async function getAllRoleLocations(filters?: { 
  page?: number; 
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { data: [], total: 0, page: 1, totalPages: 0 };
  }

  const serviceClient = await createServiceClient();
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const sortBy = filters?.sortBy || 'created_at';
  const sortOrder = filters?.sortOrder || 'desc';

  // Get location-based roles - fetch separately and join manually for reliability
  const { data: locationRolesData, error: locationError } = await serviceClient
    .from('user_role_locations')
    .select('*')
    .order('created_at', { ascending: false });

  if (locationError) {
    console.error('[getAllRoleLocations] Error fetching location roles:', locationError);
  }

  // Get global roles (from user_roles table, like admin)
  const { data: globalRolesData, error: globalError } = await serviceClient
    .from('user_roles')
    .select('*')
    .order('created_at', { ascending: false });

  if (globalError) {
    console.error('[getAllRoleLocations] Error fetching global roles:', globalError);
  }

  // Fetch all related data separately
  const userIds = new Set<string>();
  const roleIds = new Set<string>();
  const locationIds = new Set<string>();

  if (locationRolesData) {
    locationRolesData.forEach((rl: any) => {
      userIds.add(rl.user_id);
      roleIds.add(rl.role_id);
      locationIds.add(rl.location_id);
    });
  }

  if (globalRolesData) {
    globalRolesData.forEach((ur: any) => {
      userIds.add(ur.user_id);
      roleIds.add(ur.role_id);
    });
  }

  // Fetch profiles, roles, and locations in parallel
  const [profilesResult, rolesResult, locationsResult] = await Promise.all([
    userIds.size > 0 ? serviceClient.from('profiles').select('id, full_name').in('id', Array.from(userIds)) : Promise.resolve({ data: [], error: null }),
    roleIds.size > 0 ? serviceClient.from('roles').select('id, name').in('id', Array.from(roleIds)) : Promise.resolve({ data: [], error: null }),
    locationIds.size > 0 ? serviceClient.from('locations').select('id, name').in('id', Array.from(locationIds)) : Promise.resolve({ data: [], error: null }),
  ]);

  const profilesMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p]));
  const rolesMap = new Map((rolesResult.data || []).map((r: any) => [r.id, r]));
  const locationsMap = new Map((locationsResult.data || []).map((l: any) => [l.id, l]));

  // Combine both types of roles
  const allRoles: any[] = [];

  // Add location-based roles
  if (locationRolesData && !locationError) {
    allRoles.push(...locationRolesData.map((rl: any) => {
      const profile = profilesMap.get(rl.user_id);
      const role = rolesMap.get(rl.role_id);
      const location = locationsMap.get(rl.location_id);
      
      return {
        ...rl,
        user: profile ? { id: profile.id, full_name: profile.full_name } : { id: rl.user_id, full_name: null },
        role: role ? { name: role.name } : { name: null },
        location: location ? { id: location.id, name: location.name } : null,
      };
    }));
  }

  // Add global roles (admin roles without location)
  if (globalRolesData && !globalError) {
    allRoles.push(...globalRolesData.map((ur: any) => {
      const profile = profilesMap.get(ur.user_id);
      const role = rolesMap.get(ur.role_id);
      
      return {
        ...ur,
        location_id: null,
        location: null,
        user: profile ? { id: profile.id, full_name: profile.full_name } : { id: ur.user_id, full_name: null },
        role: role ? { name: role.name } : { name: null },
      };
    }));
  }

  // Sort by created_at descending
  allRoles.sort((a, b) => {
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bDate - aDate;
  });

  return allRoles;
}

export async function assignLocationRole(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const data = {
    userId: formData.get('user_id') as string,
    roleName: formData.get('role_name') as string,
    locationId: formData.get('location_id') as string | null,
  };

  try {
    const validated = assignLocationRoleSchema.parse({
      userId: data.userId,
      roleName: data.roleName,
      locationId: data.locationId && data.locationId.trim() !== '' ? data.locationId : undefined,
    });

    const serviceClient = await createServiceClient();

    // Get role ID
    const normalizedRoleName = validated.roleName.toLowerCase().trim().replace(/\s+/g, '_');
    const { data: roleRow, error: roleError } = await serviceClient
      .from('roles')
      .select('id')
      .eq('name', normalizedRoleName)
      .single();

    if (roleError || !roleRow) {
      return { error: 'Role not found' };
    }

    const role = roleRow as { id: string };

    // Check if this is a branch-wise (location-based) or global assignment
    const isBranchWise = !!validated.locationId;

    if (isBranchWise) {
      // Branch-wise assignment: Store in user_role_locations
      if (!validated.locationId) {
        return { error: 'Location is required for branch-wise role assignment' };
      }

      // Remove existing location-based role assignments for this user, role, and location
      await serviceClient
        .from('user_role_locations')
        .delete()
        .eq('user_id', validated.userId)
        .eq('role_id', role.id)
        .eq('location_id', validated.locationId);

      // Also remove any global assignment of the same role for this user
      await serviceClient
        .from('user_roles')
        .delete()
        .eq('user_id', validated.userId)
        .eq('role_id', role.id);

      // Insert into user_role_locations (location-based)
      const { error: insertError } = await (serviceClient.from('user_role_locations') as any).insert({
        user_id: validated.userId,
        role_id: role.id,
        location_id: validated.locationId,
      });

      if (insertError) {
        // If duplicate, that's okay
        if (insertError.code !== '23505') {
          return { error: insertError.message };
        }
      }
    } else {
      // Global assignment: Store in user_roles
      // Remove existing location-based roles for this user and role (from all locations)
      await serviceClient
        .from('user_role_locations')
        .delete()
        .eq('user_id', validated.userId)
        .eq('role_id', role.id);

      // Check if user already has this role globally
      const { data: existingRoleRow } = await serviceClient
        .from('user_roles')
        .select('id')
        .eq('user_id', validated.userId)
        .eq('role_id', role.id)
        .maybeSingle();

      const existingRole = existingRoleRow as { id: string } | null;

      if (!existingRole) {
        // Add to user_roles for global role
        const { error: insertError } = await (serviceClient.from('user_roles') as any).insert({
          user_id: validated.userId,
          role_id: role.id,
        });

        if (insertError) {
          return { error: insertError.message };
        }
      }
    }

    revalidatePath('/admin/users');
    revalidatePath('/admin/roles');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues && error.issues.length > 0 ? error.issues[0] : null;
      return { error: firstError?.message || 'Validation failed' };
    }
    return { error: 'Failed to assign role' };
  }
}

export async function removeLocationRole(
  userId: string,
  roleId: string,
  locationId: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const serviceClient = await createServiceClient();

  // If locationId is provided, it's a branch-wise (location-based) role
  // If locationId is null, it's a global role
  if (locationId) {
    // Branch-wise role: remove from user_role_locations
    const { error } = await serviceClient
      .from('user_role_locations')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId)
      .eq('location_id', locationId);

    if (error) {
      return { error: error.message };
    }
  } else {
    // Global role: remove from user_roles
    const { error } = await serviceClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath('/admin/users');
  revalidatePath('/admin/roles');
  return { success: true };
}

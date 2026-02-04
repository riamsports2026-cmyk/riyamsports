'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleName: z.enum(['admin', 'employee', 'customer']),
});

/** Single query to get total user count (e.g. for dashboard). No list fetch, no while loop. */
export async function getTotalUsersCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return 0;
  }

  const serviceClient = await createServiceClient();
  const { count } = await serviceClient
    .from('profiles')
    .select('id', { count: 'exact', head: true });
  return count ?? 0;
}

export async function getAllUsers(
  page: number = 1, 
  limit: number = 20,
  filters?: {
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    role?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { data: [], total: 0, page: 1, totalPages: 0 };
  }

  const serviceClient = await createServiceClient();

  // Build roles map from user_roles and user_role_locations (used for both auth and fallback)
  type UserRoleRow = { user_id: string; roles?: { name?: string } | null };
  type UserRoleLocationRow = { user_id: string; roles?: { name?: string } | null };
  const buildRolesMap = (
    userRolesData: UserRoleRow[] | null,
    userRoleLocsData: UserRoleLocationRow[] | null
  ) => {
    const map = new Map<string, string[]>();
    userRolesData?.forEach((ur) => {
      const userId = ur.user_id;
      const roleName = ur.roles?.name;
      if (roleName) {
        if (!map.has(userId)) map.set(userId, []);
        map.get(userId)!.push(roleName);
      }
    });
    userRoleLocsData?.forEach((url) => {
      const userId = url.user_id;
      const roleName = url.roles?.name;
      if (roleName) {
        if (!map.has(userId)) map.set(userId, []);
        if (!map.get(userId)!.includes(roleName)) map.get(userId)!.push(roleName);
      }
    });
    return map;
  };

  // Get global roles (from user_roles table)
  const { data: userRoles } = await serviceClient
    .from('user_roles')
    .select('user_id, roles(name)');

  // Get location-based roles (from user_role_locations table)
  const { data: userRoleLocations } = await serviceClient
    .from('user_role_locations')
    .select('user_id, roles(name)');

  // Build rolesMap (used for role filter and for building response)
  const rolesMap = buildRolesMap(
    userRoles as UserRoleRow[] | null,
    userRoleLocations as UserRoleLocationRow[] | null
  );

  // Single source: profiles table. Date filter in DB; role filter via id list. No Auth loop.
  const sortOrder = filters?.sortOrder || 'desc';
  type ProfileRow = { id: string; full_name?: string | null; mobile_number?: string | null; profile_image?: string | null; created_at?: string | null };

  let profileIdsFilter: string[] | null = null;
  if (filters?.role) {
    if (filters.role === 'customer') {
      const nonCustomerIds = new Set(
        Array.from(rolesMap.entries())
          .filter(([, r]) => r.some((role) => role !== 'customer'))
          .map(([id]) => id)
      );
      const { data: allProfileIds } = await serviceClient.from('profiles').select('id');
      const allIds = (allProfileIds as { id: string }[] | null)?.map((p) => p.id) ?? [];
      profileIdsFilter = allIds.filter((id) => !nonCustomerIds.has(id));
    } else {
      profileIdsFilter = Array.from(rolesMap.entries())
        .filter(([, r]) => r.includes(filters.role!))
        .map(([id]) => id);
    }
    if (profileIdsFilter.length === 0) {
      return { data: [], total: 0, page, totalPages: 0 };
    }
  }

  let query = serviceClient
    .from('profiles')
    .select('id, full_name, mobile_number, profile_image, created_at', { count: 'exact' })
    .order('created_at', { ascending: sortOrder === 'asc' });

  if (filters?.startDate) {
    const start = new Date(filters.startDate);
    start.setHours(0, 0, 0, 0);
    query = query.gte('created_at', start.toISOString());
  }
  if (filters?.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    query = query.lte('created_at', end.toISOString());
  }
  if (profileIdsFilter && profileIdsFilter.length > 0) {
    query = query.in('id', profileIdsFilter);
  }

  const from = (page - 1) * limit;
  const { data: profileList, count: totalCount } = await query.range(from, from + limit - 1);
  const list = (profileList as ProfileRow[] | null) ?? [];
  const total = totalCount ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const data = list.map((p) => ({
    id: p.id,
    email: '—',
    created_at: p.created_at ?? undefined,
    profile: { full_name: p.full_name, mobile_number: p.mobile_number, profile_image: p.profile_image },
    roles: rolesMap.get(p.id) || ['customer'],
  }));

  return { data, total, page, totalPages };
}

export type UserDetail = {
  id: string;
  email: string;
  created_at?: string;
  profile?: { full_name?: string | null; mobile_number?: string | null; profile_image?: string | null };
  roles: string[];
  locationRoles: Array<{ role: string; location: string; locationId?: string }>;
};

export async function getUserById(userId: string): Promise<UserDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return null;
  }

  const serviceClient = await createServiceClient();

  const { data: authUser, error: authError } = await serviceClient.auth.admin.getUserById(userId);
  if (authError || !authUser?.user) {
    return null;
  }

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('id, full_name, mobile_number, profile_image')
    .eq('id', userId)
    .single();

  const { getUserRolesWithLocations } = await import('./user-roles');
  const roleDetails = await getUserRolesWithLocations(userId);

  const authUserData = authUser.user as { id: string; email?: string; created_at?: string };
  const allRoles = [...roleDetails.globalRoles];
  roleDetails.locationRoles.forEach((lr) => {
    if (lr.role && !allRoles.includes(lr.role)) allRoles.push(lr.role);
  });
  if (allRoles.length === 0) allRoles.push('customer');

  return {
    id: authUserData.id,
    email: authUserData.email ?? '',
    created_at: authUserData.created_at,
    profile: profile ?? undefined,
    roles: allRoles,
    locationRoles: roleDetails.locationRoles,
  };
}

export async function assignRole(
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
    roleName: formData.get('role_name') as 'admin' | 'employee' | 'customer',
  };

  try {
    const validated = assignRoleSchema.parse(data);
    const serviceClient = await createServiceClient();

    const { data: roleRow } = await serviceClient
      .from('roles')
      .select('id')
      .eq('name', validated.roleName)
      .single();

    if (!roleRow) {
      return { error: 'Role not found' };
    }

    const role = roleRow as { id: string };

    await serviceClient
      .from('user_roles')
      .delete()
      .eq('user_id', validated.userId);

    const { error: insertError } = await (serviceClient.from('user_roles') as any).insert({
      user_id: validated.userId,
      role_id: role.id,
    });

    if (insertError) {
      return { error: insertError.message };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || 'Validation failed' };
    }
    return { error: 'Failed to assign role' };
  }
}


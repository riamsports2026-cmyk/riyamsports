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

export async function getAllUsers(
  page: number = 1, 
  limit: number = 20,
  filters?: {
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
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

  // Get global roles (from user_roles table)
  const { data: userRoles } = await serviceClient
    .from('user_roles')
    .select('user_id, roles(name)');

  // Get location-based roles (from user_role_locations table)
  const { data: userRoleLocations } = await serviceClient
    .from('user_role_locations')
    .select('user_id, roles(name)');

  const { data: authUsers } = await serviceClient.auth.admin.listUsers();

  if (!authUsers || !authUsers.users) {
    return { data: [], total: 0, page, totalPages: 0 };
  }

  type AuthUser = { id?: string; email?: string; created_at?: string };
  let filteredUsers = authUsers.users as AuthUser[];
  if (filters?.startDate || filters?.endDate) {
    filteredUsers = (authUsers.users as AuthUser[]).filter((u) => {
      if (!u.created_at) return false;
      const userDate = new Date(u.created_at);
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (userDate < startDate) return false;
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (userDate > endDate) return false;
      }
      
      return true;
    });
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'created_at';
  const sortOrder = filters?.sortOrder || 'desc';
  
  type SortUser = AuthUser & { email?: string };
  const sortedUsers = [...(filteredUsers as SortUser[])].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;
    switch (sortBy) {
      case 'email':
        aValue = a.email || '';
        bValue = b.email || '';
        break;
      case 'created_at':
      default:
        aValue = new Date(a.created_at || 0).getTime();
        bValue = new Date(b.created_at || 0).getTime();
        break;
    }
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    }
    return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
  });

  // Get total count after filtering and sorting
  const total = sortedUsers.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // Paginate sorted users
  const paginatedUsers = sortedUsers.slice(offset, offset + limit);

  // Get profiles for paginated users
  type UserWithId = SortUser & { id: string };
  const userIds = (paginatedUsers as UserWithId[]).map((u) => u.id);
  const { data: profiles } = await serviceClient
    .from('profiles')
    .select('id, full_name, mobile_number, profile_image')
    .in('id', userIds);

  type ProfileRow = { id: string; full_name?: string | null; mobile_number?: string | null; profile_image?: string | null };
  const profileMap = new Map<string, ProfileRow>(
    (profiles as ProfileRow[] | null)?.map((p) => [p.id, p]) ?? []
  );
  const rolesMap = new Map<string, string[]>();

  type UserRoleRow = { user_id: string; roles?: { name?: string } | null };
  (userRoles as UserRoleRow[] | null)?.forEach((ur) => {
    const userId = ur.user_id;
    const roleName = ur.roles?.name;
    if (roleName) {
      if (!rolesMap.has(userId)) {
        rolesMap.set(userId, []);
      }
      rolesMap.get(userId)!.push(roleName);
    }
  });

  type UserRoleLocationRow = { user_id: string; roles?: { name?: string } | null };
  (userRoleLocations as UserRoleLocationRow[] | null)?.forEach((url) => {
    const userId = url.user_id;
    const roleName = url.roles?.name;
    if (roleName) {
      if (!rolesMap.has(userId)) {
        rolesMap.set(userId, []);
      }
      // Only add if not already present (avoid duplicates)
      if (!rolesMap.get(userId)!.includes(roleName)) {
        rolesMap.get(userId)!.push(roleName);
      }
    }
  });

  const data = (paginatedUsers as UserWithId[]).map((u) => ({
    id: u.id,
    email: (u as SortUser).email || '',
    created_at: u.created_at,
    profile: profileMap.get(u.id) ?? undefined,
    roles: rolesMap.get(u.id) || ['customer'],
  }));

  return { data, total, page, totalPages };
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


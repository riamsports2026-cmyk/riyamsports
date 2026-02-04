'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Role } from '@/lib/types';

const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name too long'),
  description: z.string().optional().nullable(),
  is_system_role: z.boolean().default(false),
});

export async function getAllRoles(filters?: { 
  page?: number; 
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
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
  const offset = (page - 1) * limit;

  // Build query for count
  let countQuery = serviceClient
    .from('roles')
    .select('*', { count: 'exact', head: true });

  // Build query for data
  let query = serviceClient
    .from('roles')
    .select('id, name, description, is_system_role, created_at');

  // Apply filters
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    countQuery = countQuery.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
    query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
  }

  // Get total count
  const { count, error: _countError } = await countQuery;
  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  // Apply sorting
  const sortBy = filters?.sortBy || 'name';
  const sortOrder = filters?.sortOrder || 'asc';
  
  // Map sortBy to actual column names
  let orderColumn = 'name';
  switch (sortBy) {
    case 'name':
      orderColumn = 'name';
      break;
    case 'created_at':
      orderColumn = 'created_at';
      break;
    default:
      orderColumn = 'name';
      break;
  }

  // Always sort system roles first, then apply user sorting
  if (sortBy === 'name') {
    query = query.order('is_system_role', { ascending: false })
                  .order('name', { ascending: sortOrder === 'asc' });
  } else {
    query = query.order('is_system_role', { ascending: false })
                  .order(orderColumn, { ascending: sortOrder === 'asc' });
  }

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error || !data) {
    return { data: [], total: 0, page, totalPages: 0 };
  }

  return { data: data as Role[], total, page, totalPages };
}

export async function createRole(
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
    name: formData.get('name') as string,
    description: formData.get('description') as string | null,
    is_system_role: false, // Custom roles are never system roles
  };

  try {
    const validated = roleSchema.parse(data);
    const serviceClient = await createServiceClient();

    // Normalize role name (lowercase, replace spaces with underscores)
    const normalizedName = validated.name.toLowerCase().trim().replace(/\s+/g, '_');

    const { error: insertError } = await (serviceClient.from('roles') as any).insert({
      name: normalizedName,
      description: validated.description,
      is_system_role: false,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return { error: 'Role name already exists' };
      }
      return { error: insertError.message };
    }

    revalidatePath('/admin/roles');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || 'Validation failed' };
    }
    return { error: 'Failed to create role' };
  }
}

export async function updateRole(
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

  const id = formData.get('id') as string;
  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string | null,
  };

  try {
    const serviceClient = await createServiceClient();

    // Check if role is system role (can't modify system roles)
    const { data: existingRoleRow } = await serviceClient
      .from('roles')
      .select('is_system_role')
      .eq('id', id)
      .single();

    const existingRole = existingRoleRow as { is_system_role?: boolean } | null;
    if (existingRole?.is_system_role) {
      return { error: 'Cannot modify system roles' };
    }

    const normalizedName = data.name.toLowerCase().trim().replace(/\s+/g, '_');

    const { error: updateError } = await (serviceClient.from('roles') as any)
      .update({
        name: normalizedName,
        description: data.description,
      })
      .eq('id', id);

    if (updateError) {
      if (updateError.code === '23505') {
        return { error: 'Role name already exists' };
      }
      return { error: updateError.message };
    }

    revalidatePath('/admin/roles');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || 'Validation failed' };
    }
    return { error: 'Failed to update role' };
  }
}

export async function deleteRole(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const serviceClient = await createServiceClient();

  // Check if role is system role (can't delete system roles)
  const { data: existingRoleRow } = await serviceClient
    .from('roles')
    .select('is_system_role')
    .eq('id', id)
    .single();

  const existingRole = existingRoleRow as { is_system_role?: boolean } | null;
  if (existingRole?.is_system_role) {
    return { error: 'Cannot delete system roles' };
  }

  // Check if role is in use
  const { data: userRolesData } = await serviceClient
    .from('user_roles')
    .select('id')
    .eq('role_id', id)
    .limit(1);

  const { data: roleLocationsData } = await serviceClient
    .from('user_role_locations')
    .select('id')
    .eq('role_id', id)
    .limit(1);

  const userRoles = (userRolesData ?? []) as { id: string }[];
  const roleLocations = (roleLocationsData ?? []) as { id: string }[];
  if (userRoles.length > 0) {
    return { error: 'Cannot delete role that is assigned to users' };
  }
  if (roleLocations.length > 0) {
    return { error: 'Cannot delete role that is assigned to users' };
  }

  const { error } = await serviceClient.from('roles').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/roles');
  return { success: true };
}


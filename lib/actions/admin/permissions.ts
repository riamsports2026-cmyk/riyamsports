'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { revalidatePath } from 'next/cache';

export async function getAllPermissions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return [];
  }

  const serviceClient = await createServiceClient();

  const { data, error } = await serviceClient
    .from('permissions')
    .select('*')
    .order('name');

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getRolePermissions(roleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return [];
  }

  const serviceClient = await createServiceClient();

  const { data, error } = await serviceClient
    .from('role_permissions')
    .select('permission_id, permission:permissions(*)')
    .eq('role_id', roleId);

  if (error || !data) {
    return [];
  }

  return data.map((rp: any) => rp.permission_id);
}

export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const serviceClient = await createServiceClient();

  // Remove all existing permissions
  await serviceClient
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId);

  // Add new permissions
  if (permissionIds.length > 0) {
    const rolePermissions = permissionIds.map(permissionId => ({
      role_id: roleId,
      permission_id: permissionId,
    }));

    const { error: insertError } = await (serviceClient.from('role_permissions') as any).insert(rolePermissions);

    if (insertError) {
      return { error: insertError.message };
    }
  }

  revalidatePath('/admin/roles');
  return { success: true };
}



'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { validateMobileNumber } from '@/lib/utils/phone';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  mobileNumber: z.string().superRefine((v, ctx) => {
    const result = validateMobileNumber(v, { normalize: false });
    if (!result.valid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error ?? 'Invalid mobile number' });
    }
  }),
  roleName: z.string().min(1, 'Role is required'),
  locationId: z.string().uuid().optional(),
});

export async function createUserWithRole(
  prevState: { error?: string; success?: boolean; userId?: string } | null,
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
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    fullName: formData.get('full_name') as string,
    mobileNumber: formData.get('mobile_number') as string,
    roleName: formData.get('role_name') as string,
    locationId: formData.get('location_id') as string | null,
  };

  try {
    const validated = createUserSchema.parse({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      mobileNumber: data.mobileNumber,
      roleName: data.roleName,
      locationId: data.locationId && data.locationId.trim() !== '' ? data.locationId : undefined,
    });

    const serviceClient = await createServiceClient();

    // Create user in auth
    const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError || !authUser.user) {
      return { error: authError?.message || 'Failed to create user' };
    }

    const userId = authUser.user.id;

    const mobileNormalized = validateMobileNumber(validated.mobileNumber, { normalize: true }).normalized ?? validated.mobileNumber;
    // Create profile
    const { error: profileError } = await (serviceClient.from('profiles') as any).insert({
      id: userId,
      full_name: validated.fullName,
      mobile_number: mobileNormalized,
    });

    if (profileError) {
      // Try to delete the auth user if profile creation fails
      await serviceClient.auth.admin.deleteUser(userId);
      return { error: profileError.message };
    }

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

    // Remove any existing roles to ensure only one role is assigned
    await serviceClient.from('user_roles').delete().eq('user_id', userId);
    await serviceClient.from('user_role_locations').delete().eq('user_id', userId);

    // Check if this is a branch-wise (location-based) or global assignment
    const isBranchWise = !!validated.locationId;

    if (isBranchWise) {
      // Branch-wise assignment: Store in user_role_locations
      if (!validated.locationId) {
        return { error: 'Location is required for branch-wise role assignment' };
      }

      const { error: roleLocationError } = await (serviceClient.from('user_role_locations') as any).insert({
        user_id: userId,
        role_id: role.id,
        location_id: validated.locationId,
      });

      if (roleLocationError) {
        return { error: roleLocationError.message };
      }
    } else {
      // Global assignment: Store in user_roles
      const { error: roleAssignError } = await (serviceClient.from('user_roles') as any).insert({
        user_id: userId,
        role_id: role.id,
      });

      if (roleAssignError) {
        return { error: roleAssignError.message };
      }
    }

    revalidatePath('/admin/users');
    revalidatePath('/admin/roles');
    return { success: true, userId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || 'Validation failed' };
    }
    return { error: 'Failed to create user' };
  }
}


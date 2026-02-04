'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signInWithEmail(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Check if user has staff permission (manage_bookings) or is admin
    // Use service client to bypass RLS during login check
    const { createServiceClient } = await import('@/lib/supabase/server');
    const serviceClient = await createServiceClient();
    
    // Check if user is admin
    const { data: adminRoles } = await serviceClient
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', data.user.id);
    
    const isAdmin = adminRoles?.some((ur: any) => ur.roles?.name === 'admin');
    
    // Check if user has manage_bookings permission (staff)
    const { data: allRoles } = await serviceClient
      .from('user_roles')
      .select('role_id')
      .eq('user_id', data.user.id);
    
    const { data: locationRoles } = await serviceClient
      .from('user_role_locations')
      .select('role_id')
      .eq('user_id', data.user.id);
    
    const roleIds = [
      ...(allRoles?.map((r: any) => r.role_id) || []),
      ...(locationRoles?.map((r: any) => r.role_id) || [])
    ];
    
    let hasStaffPermission = false;
    if (roleIds.length > 0) {
      // Check if any role has manage_bookings permission
      const { data: permission } = await serviceClient
        .from('permissions')
        .select('id')
        .eq('name', 'manage_bookings')
        .single();
      
      const perm = permission as { id: string } | null;
      if (perm) {
        const { data: rolePermissions } = await serviceClient
          .from('role_permissions')
          .select('role_id')
          .in('role_id', roleIds)
          .eq('permission_id', perm.id)
          .limit(1);
        hasStaffPermission = (rolePermissions?.length || 0) > 0;
      }
    }

    if (!hasStaffPermission && !isAdmin) {
      await supabase.auth.signOut();
      return { error: 'Access denied. Staff privileges required. Your role must have the "manage_bookings" permission.' };
    }

    const { data: prof } = await supabase
      .from('profiles')
      .select('mobile_number')
      .eq('id', data.user.id)
      .maybeSingle();
    const profile = prof as { mobile_number: string | null } | null;
    if (!profile?.mobile_number) {
      redirect('/complete-profile');
    } else {
      // Redirect to appropriate page based on role
      if (isAdmin) {
        redirect('/admin');
      } else {
        // Staff members go to staff dashboard to manage bookings
        redirect('/staff');
      }
    }
  }

  return { error: 'Failed to sign in' };
}

export async function signOutStaff() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/staff/login');
}

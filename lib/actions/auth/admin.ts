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
    // Check if user is admin or sub-admin
    const { isAdminOrSubAdmin } = await import('@/lib/utils/roles');
    const userIsAdminOrSubAdmin = await isAdminOrSubAdmin(data.user.id);
    
    if (!userIsAdminOrSubAdmin) {
      await supabase.auth.signOut();
      return { error: 'Access denied. Admin or sub-admin privileges required.' };
    }

    // Check if profile is complete
    const { data: prof } = await supabase
      .from('profiles')
      .select('mobile_number')
      .eq('id', data.user.id)
      .maybeSingle();
    const profile = prof as { mobile_number: string | null } | null;
    if (!profile?.mobile_number) {
      redirect('/complete-profile');
    } else {
      redirect('/admin');
    }
  }

  return { error: 'Failed to sign in' };
}

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}


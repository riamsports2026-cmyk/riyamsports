'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';

export async function signInWithGoogle(
  _prevState: { error?: string; success?: boolean } | null,
  _formData: FormData
) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
  return { error: 'Something went wrong during sign-in.' };
}

// Customer email/password login removed - customers use Google OAuth only
// Admin login: /admin/login (uses lib/actions/auth/admin.ts)
// Staff login: /staff/login (uses lib/actions/auth/staff.ts)

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}


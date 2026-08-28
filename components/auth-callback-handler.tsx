'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { consumeAuthRedirect } from '@/lib/utils/auth-redirect';

function lockKey(code: string) {
  return `riam_oauth_${code}`;
}

async function redirectAfterLogin() {
  const supabase = createClient();
  const redirectPath = consumeAuthRedirect() || '/book';

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.replace(
      '/login?error=' + encodeURIComponent('Failed to authenticate')
    );
    return;
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('mobile_number')
    .eq('id', user.id)
    .maybeSingle();

  const profile = profileData as { mobile_number: string | null } | null;

  if (!profile?.mobile_number) {
    window.location.replace(
      `/complete-profile?redirect=${encodeURIComponent(redirectPath)}`
    );
    return;
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch('/api/check-admin', { credentials: 'same-origin' });
    if (res.ok) {
      const data = (await res.json()) as { isAdminOrSubAdmin?: boolean };
      if (data.isAdminOrSubAdmin) {
        window.location.replace('/admin');
        return;
      }
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
  }

  window.location.replace(redirectPath);
}

async function waitForOAuthLock(code: string): Promise<'done' | 'timeout'> {
  const key = lockKey(code);
  for (let i = 0; i < 40; i++) {
    const state = sessionStorage.getItem(key);
    if (state === 'done') return 'done';
    if (state !== 'processing') return 'timeout';
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return 'timeout';
}

/**
 * Exchanges the OAuth code in the browser where the PKCE verifier cookie lives.
 */
export function AuthCallbackHandler() {
  useEffect(() => {
    async function completeAuth() {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        const message = errorDescription || error;
        window.location.replace(`/login?error=${encodeURIComponent(message)}`);
        return;
      }

      const code = params.get('code');
      if (!code) {
        window.location.replace(
          '/login?error=' + encodeURIComponent('No authorization code provided')
        );
        return;
      }

      const supabase = createClient();
      const key = lockKey(code);
      const existing = sessionStorage.getItem(key);

      if (existing === 'done') {
        await redirectAfterLogin();
        return;
      }

      if (existing === 'processing') {
        const result = await waitForOAuthLock(code);
        if (result === 'done') {
          await redirectAfterLogin();
        }
        return;
      }

      sessionStorage.setItem(key, 'processing');

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          sessionStorage.setItem(key, 'done');
          await redirectAfterLogin();
          return;
        }
        sessionStorage.removeItem(key);
        window.location.replace(
          `/login?error=${encodeURIComponent(exchangeError.message)}`
        );
        return;
      }

      sessionStorage.setItem(key, 'done');
      await redirectAfterLogin();
    }

    void completeAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className="text-[#1E3A5F]/70 text-sm sm:text-base">Signing you in…</p>
    </div>
  );
}

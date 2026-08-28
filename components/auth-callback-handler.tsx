'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { consumeAuthRedirect } from '@/lib/utils/auth-redirect';

const CALLBACK_LOCK_KEY = 'riam_oauth_callback_lock';

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

  // Admin check needs server cookies — retry briefly after client session is set
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

      // Prevent double exchange (React Strict Mode remounts the component)
      const lockValue = sessionStorage.getItem(CALLBACK_LOCK_KEY);
      if (lockValue === code) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          await redirectAfterLogin();
        }
        return;
      }
      sessionStorage.setItem(CALLBACK_LOCK_KEY, code);

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        sessionStorage.removeItem(CALLBACK_LOCK_KEY);
        window.location.replace(
          `/login?error=${encodeURIComponent(exchangeError.message)}`
        );
        return;
      }

      sessionStorage.removeItem(CALLBACK_LOCK_KEY);
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

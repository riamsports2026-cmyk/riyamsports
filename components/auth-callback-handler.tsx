'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const CALLBACK_LOCK_KEY = 'riam_oauth_callback_lock';

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

      // Prevent double exchange (React Strict Mode remounts the component)
      const lockValue = sessionStorage.getItem(CALLBACK_LOCK_KEY);
      if (lockValue === code) return;
      sessionStorage.setItem(CALLBACK_LOCK_KEY, code);

      const supabase = createClient();
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
      window.location.replace('/api/auth/finish-login');
    }

    void completeAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className="text-[#1E3A5F]/70 text-sm sm:text-base">Signing you in…</p>
    </div>
  );
}

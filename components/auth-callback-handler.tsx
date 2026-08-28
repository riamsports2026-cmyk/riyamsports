'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Exchanges the OAuth code in the browser where the PKCE verifier cookie lives.
 * Server-side exchange often fails on Netlify/CDN hosts.
 */
export function AuthCallbackHandler() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

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
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        window.location.replace(
          `/login?error=${encodeURIComponent(exchangeError.message)}`
        );
        return;
      }

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

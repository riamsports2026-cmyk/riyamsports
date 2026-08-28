'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { saveAuthRedirect } from '@/lib/utils/auth-redirect';
import { clearLegacySupabaseAuthStorage } from '@/lib/utils/clear-legacy-auth-storage';

interface GoogleSignInButtonProps {
  redirect?: string;
}

/**
 * Client-side OAuth — stores PKCE verifier in browser cookies via document.cookie.
 * Server-side /api/auth/login redirect often fails on Netlify (PKCE verifier not found).
 */
export function GoogleSignInButton({ redirect }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (loading) return;
    setLoading(true);

    try {
      clearLegacySupabaseAuthStorage();

      const returnPath = redirect?.startsWith('/') ? redirect : '/book';
      saveAuthRedirect(returnPath);

      await fetch(
        `/api/auth/prepare-redirect?redirect=${encodeURIComponent(returnPath)}`,
        { credentials: 'same-origin' }
      );

      const supabase = createClient();
      const callbackUrl = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        window.location.href = `/login?error=${encodeURIComponent(error.message)}`;
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      window.location.href = '/login?error=' + encodeURIComponent('Could not start Google sign-in');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      window.location.href = `/login?error=${encodeURIComponent(message)}`;
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={loading}
      className="w-full flex justify-center items-center gap-2 sm:gap-3 py-3.5 sm:py-4 px-5 sm:px-6 rounded-xl text-sm sm:text-base font-semibold text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/25 transition-all duration-200 hover:shadow-lg hover:shadow-[#FF6B35]/20 hover:-translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {loading ? 'Redirecting to Google…' : 'Continue with Google'}
    </button>
  );
}

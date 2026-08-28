'use client';

import { useEffect, useState } from 'react';
import { getOAuthCallbackUrl, isLocalDevOrigin } from '@/lib/utils/oauth-callback';

/**
 * Shown on /login during local dev to prevent OAuth redirecting to production Site URL
 * when localhost callback is missing from Supabase Redirect URLs.
 */
export function LoginDevHint() {
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (!isLocalDevOrigin(window.location.origin)) return;
    setCallbackUrl(getOAuthCallbackUrl(window.location.origin));
  }, []);

  if (!callbackUrl) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-left text-xs text-amber-950">
      <p className="font-semibold mb-1">Local development — Google sign-in</p>
      <p className="mb-2">
        If sign-in sends you to <strong>booking.riamsportsarena.com</strong> instead of localhost,
        add this URL in Supabase → Authentication → URL Configuration → <strong>Redirect URLs</strong>:
      </p>
      <code className="block break-all rounded bg-white/80 px-2 py-1.5 text-[11px] border border-amber-100">
        {callbackUrl}
      </code>
      <p className="mt-2 text-amber-800/80">
        You can also use <code className="text-[10px]">http://localhost:3000/**</code> as a wildcard.
      </p>
    </div>
  );
}

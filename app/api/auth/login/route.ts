import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Start OAuth flow from a Route Handler so the PKCE code verifier is stored
 * in cookies on the redirect response. Starting from a server action can
 * miss those cookies and cause "PKCE code verifier not found" on callback.
 *
 * Uses the request origin for redirectTo so the callback goes to the same
 * host the user is on (e.g. https://riyamsports.vercel.app on Vercel),
 * instead of relying on NEXT_PUBLIC_APP_URL which may be unset or localhost.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const { searchParams } = requestUrl;
  const provider = searchParams.get('provider') ?? 'google';

  if (provider !== 'google') {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Unsupported provider')}`, request.url)
    );
  }

  const callbackUrl = `${origin}/api/auth/callback`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  if (data.url) {
    return NextResponse.redirect(data.url);
  }

  return NextResponse.redirect(
    new URL('/login?error=Something went wrong during sign-in.', request.url)
  );
}

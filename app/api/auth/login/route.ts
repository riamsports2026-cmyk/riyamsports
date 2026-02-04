import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

/**
 * Start OAuth flow from a Route Handler so the PKCE code verifier is stored
 * in cookies on the redirect response. Starting from a server action can
 * miss those cookies and cause "PKCE code verifier not found" on callback.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') ?? 'google';

  if (provider !== 'google') {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Unsupported provider')}`, request.url)
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
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

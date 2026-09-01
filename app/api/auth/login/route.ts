import { NextRequest, NextResponse } from 'next/server';
import {
  applyCookiesToResponse,
  createRouteHandlerClient,
  type RouteHandlerCookie,
} from '@/lib/supabase/route-handler';

/**
 * Start OAuth from a route handler and attach PKCE verifier cookies to the
 * redirect response. Using createClient() + cookies() alone drops those cookies
 * on the Google redirect, causing "PKCE code verifier not found" on repeat logins.
 */
function isValidRedirect(path: string | null): path is string {
  if (!path || typeof path !== 'string') return false;
  const trimmed = path.trim();
  return trimmed.startsWith('/') && !trimmed.startsWith('//');
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const { searchParams } = requestUrl;
  const provider = searchParams.get('provider') ?? 'google';
  const redirectParam = searchParams.get('redirect');

  if (provider !== 'google') {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Unsupported provider')}`, request.url)
    );
  }

  const nextPath = isValidRedirect(redirectParam) ? redirectParam : '/book';
  const callbackUrl = `${origin}/api/auth/callback`;

  const cookiesToSet: RouteHandlerCookie[] = [];
  const supabase = createRouteHandlerClient(request, cookiesToSet);

  // Clear stale PKCE/session cookies from prior OAuth attempts (e.g. after logout)
  await supabase.auth.signOut({ scope: 'local' });

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
    const response = NextResponse.redirect(data.url);
    applyCookiesToResponse(response, cookiesToSet);
    response.cookies.set('auth_redirect', nextPath, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    });
    return response;
  }

  return NextResponse.redirect(
    new URL('/login?error=Something went wrong during sign-in.', request.url)
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { getOAuthCallbackUrl } from '@/lib/utils/oauth-callback';
import {
  applyCookiesToResponse,
  createRouteHandlerClient,
  type RouteHandlerCookie,
} from '@/lib/supabase/route-handler';

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
  const callbackUrl = getOAuthCallbackUrl(origin);

  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[auth/login] OAuth redirectTo (add to Supabase Auth → Redirect URLs if missing):',
      callbackUrl
    );
  }

  const cookiesToSet: RouteHandlerCookie[] = [];
  const supabase = createRouteHandlerClient(request, cookiesToSet);

  // Clear stale session/PKCE cookies so a fresh OAuth flow works in normal browser tabs
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

  if (!data.url) {
    return NextResponse.redirect(
      new URL('/login?error=Something went wrong during sign-in.', request.url)
    );
  }

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

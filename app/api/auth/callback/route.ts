import { NextRequest, NextResponse } from 'next/server';
import {
  parseAuthRedirectCookie,
  resolvePostLoginRedirect,
} from '@/lib/utils/auth-redirect';
import {
  applyCookiesToResponse,
  createRouteHandlerClient,
  type RouteHandlerCookie,
} from '@/lib/supabase/route-handler';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  if (error) {
    const errorMessage = errorDescription || error;
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMessage)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=No authorization code provided`);
  }

  const cookiesToSet: RouteHandlerCookie[] = [];
  const supabase = createRouteHandlerClient(request, cookiesToSet);

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('Error exchanging code for session:', exchangeError);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user:', userError);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Failed to authenticate')}`
    );
  }

  const { isAdminOrSubAdmin } = await import('@/lib/utils/roles');
  const userIsAdminOrSubAdmin = await isAdminOrSubAdmin(user.id);

  const redirectPath = resolvePostLoginRedirect(
    requestUrl.searchParams.get('next'),
    parseAuthRedirectCookie(request.headers.get('cookie'))
  );

  let destination: string;
  if (userIsAdminOrSubAdmin) {
    destination = `${origin}/admin`;
  } else {
    // Land on home (/book) or the pending-booking deep path. Proxy handles
    // complete-profile once the session cookie is present — sending users
    // directly to /complete-profile here races session setup and bounces to /login.
    destination = `${origin}${redirectPath || '/book'}`;
  }

  const response = NextResponse.redirect(destination);
  applyCookiesToResponse(response, cookiesToSet);
  response.cookies.set('auth_redirect', '', { maxAge: 0, path: '/' });

  return response;
}

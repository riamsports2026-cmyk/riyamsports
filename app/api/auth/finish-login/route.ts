import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  parseAuthRedirectCookie,
  resolvePostLoginRedirect,
} from '@/lib/utils/auth-redirect';

/** Post-OAuth routing once the browser has established the session. */
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Failed to authenticate')}`
    );
  }

  const { isAdminOrSubAdmin } = await import('@/lib/utils/roles');
  const userIsAdminOrSubAdmin = await isAdminOrSubAdmin(user.id);

  const { data: profileData } = await supabase
    .from('profiles')
    .select('mobile_number')
    .eq('id', user.id)
    .maybeSingle();

  const profile = profileData as { mobile_number: string | null } | null;

  const redirectPath = resolvePostLoginRedirect(
    request.nextUrl.searchParams.get('next'),
    parseAuthRedirectCookie(request.headers.get('cookie'))
  );

  let destination: string;
  if (!profile || !profile.mobile_number) {
    const completeProfileUrl = new URL('/complete-profile', origin);
    if (redirectPath) {
      completeProfileUrl.searchParams.set('redirect', redirectPath);
    }
    destination = completeProfileUrl.toString();
  } else if (userIsAdminOrSubAdmin) {
    destination = `${origin}/admin`;
  } else {
    destination = `${origin}${redirectPath || '/book'}`;
  }

  const response = NextResponse.redirect(destination);
  response.cookies.set('auth_redirect', '', { maxAge: 0, path: '/' });
  return response;
}

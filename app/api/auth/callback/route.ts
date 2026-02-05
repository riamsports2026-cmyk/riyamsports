import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  // Handle OAuth errors from Google
  if (error) {
    const errorMessage = errorDescription || error;
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMessage)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }

    // Get user after session exchange
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

    // Check if user is admin or sub-admin
    const { isAdminOrSubAdmin } = await import('@/lib/utils/roles');
    const userIsAdminOrSubAdmin = await isAdminOrSubAdmin(user.id);

    // Check if profile exists and is complete
    const { data: profileData } = await supabase
      .from('profiles')
      .select('mobile_number')
      .eq('id', user.id)
      .maybeSingle();

    const profile = profileData as { mobile_number: string | null } | null;
    if (!profile || !profile.mobile_number) {
      return NextResponse.redirect(`${origin}/complete-profile`);
    }

    // If admin or sub-admin, redirect to admin panel, otherwise respect auth_redirect or /book
    const redirectCookie = request.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('auth_redirect='));
    const redirectPath = redirectCookie?.split('=')[1]?.trim();
    const safeRedirect = redirectPath?.startsWith('/') && !redirectPath.startsWith('//') ? redirectPath : null;

    const destination = userIsAdminOrSubAdmin
      ? `${origin}/admin`
      : `${origin}${safeRedirect || '/book'}`;
    const response = NextResponse.redirect(destination);
    response.cookies.set('auth_redirect', '', { maxAge: 0, path: '/' });
    return response;
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${origin}/login?error=No authorization code provided`);
}


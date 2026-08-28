import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

function safeRedirectPath(path: string | null): string | null {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  return trimmed.startsWith('/') && !trimmed.startsWith('//') ? trimmed : null;
}

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
    // Collect cookies so we can set them on the final redirect response.
    // Using response-based cookie handling ensures session cookies are set even when
    // returning a custom redirect (fixes intermittent "session lost after login" on production).
    const cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];

    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.headers.get('cookie')?.split(';').map((c) => {
              const [name, ...v] = c.trim().split('=');
              return { name, value: v.join('=').trim() };
            }) ?? [];
          },
          setAll(cookies) {
            cookies.forEach((c) => cookiesToSet.push(c));
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
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

    // Redirect: next query param (most reliable) > auth_redirect cookie > /book
    const nextParam = safeRedirectPath(requestUrl.searchParams.get('next'));
    const redirectCookie = request.headers.get('cookie')?.split(';').find((c) => c.trim().startsWith('auth_redirect='));
    const cookiePath = redirectCookie?.split('=')[1]?.trim();
    const redirectPath = nextParam ?? safeRedirectPath(cookiePath ?? null);

    let destination: string;
    if (!profile || !profile.mobile_number) {
      destination = `${origin}/complete-profile`;
    } else if (userIsAdminOrSubAdmin) {
      destination = `${origin}/admin`;
    } else {
      destination = `${origin}${redirectPath || '/book'}`;
    }

    const response = NextResponse.redirect(destination);
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    );
    response.cookies.set('auth_redirect', '', { maxAge: 0, path: '/' });

    return response;
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${origin}/login?error=No authorization code provided`);
}


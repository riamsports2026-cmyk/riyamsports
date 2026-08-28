import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getOAuthCallbackUrl } from '@/lib/utils/oauth-callback';

function isValidRedirect(path: string | null): path is string {
  if (!path || typeof path !== 'string') return false;
  const trimmed = path.trim();
  return trimmed.startsWith('/') && !trimmed.startsWith('//');
}

export async function GET(request: Request) {
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
  // No query params — return path is in auth_redirect cookie (see lib/utils/oauth-callback.ts)
  const callbackUrl = getOAuthCallbackUrl(origin);

  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[auth/login] OAuth redirectTo (add to Supabase Auth → Redirect URLs if missing):',
      callbackUrl
    );
  }

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
    const response = NextResponse.redirect(data.url);
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

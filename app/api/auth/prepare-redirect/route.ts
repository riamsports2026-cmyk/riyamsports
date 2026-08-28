import { NextRequest, NextResponse } from 'next/server';

function isValidRedirect(path: string | null): path is string {
  if (!path || typeof path !== 'string') return false;
  const trimmed = path.trim();
  return trimmed.startsWith('/') && !trimmed.startsWith('//');
}

/** Sets the post-login redirect cookie before client-side OAuth starts. */
export async function GET(request: NextRequest) {
  const redirect = request.nextUrl.searchParams.get('redirect');
  const nextPath = isValidRedirect(redirect) ? redirect : '/book';

  const response = NextResponse.json({ ok: true });
  response.cookies.set('auth_redirect', nextPath, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });
  return response;
}

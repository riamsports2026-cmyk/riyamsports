import { NextRequest, NextResponse } from 'next/server';

/**
 * Supabase redirect URL may point here. Forward to the client callback page
 * so PKCE exchange runs in the browser (verifier cookie is not reliably
 * available to the server on Netlify/CDN).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const clientCallback = new URL('/auth/callback', requestUrl.origin);
  clientCallback.search = requestUrl.search;
  return NextResponse.redirect(clientCallback);
}

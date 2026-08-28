/**
 * OAuth callback URL for Supabase signInWithOAuth redirectTo.
 * Must match an entry in Supabase Dashboard → Auth → URL Configuration → Redirect URLs.
 *
 * We intentionally omit query params so only one URL per environment needs to be allow-listed
 * (e.g. http://localhost:3000/auth/callback). Legacy /api/auth/callback forwards here.
 */
export function getOAuthCallbackUrl(origin: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/auth/callback`;
}

export function isLocalDevOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/** Safe internal redirect paths for post-login navigation. */
export function safeRedirectPath(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.startsWith('/admin') || trimmed.startsWith('/staff')) return null;
  return trimmed;
}

export const AUTH_REDIRECT_STORAGE_KEY = 'riam_auth_redirect';

export function saveAuthRedirect(path: string): void {
  if (typeof window === 'undefined') return;
  const safe = safeRedirectPath(path);
  if (!safe) return;
  sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, safe);
}

export function peekAuthRedirect(): string | null {
  if (typeof window === 'undefined') return null;
  return safeRedirectPath(sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY));
}

export function consumeAuthRedirect(): string | null {
  const path = peekAuthRedirect();
  if (path && typeof window !== 'undefined') {
    sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
  }
  return path;
}

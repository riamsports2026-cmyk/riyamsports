/** Safe internal redirect paths for post-login navigation. */
export function safeRedirectPath(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.startsWith('/admin') || trimmed.startsWith('/staff')) return null;
  return trimmed;
}

export function isDeepBookPath(path: string | null | undefined): boolean {
  return !!path && path.startsWith('/book/');
}

export function parseAuthRedirectCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const entry = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('auth_redirect='));
  if (!entry) return null;
  const value = entry.slice('auth_redirect='.length);
  try {
    return safeRedirectPath(decodeURIComponent(value));
  } catch {
    return safeRedirectPath(value);
  }
}

/** Prefer a specific /book/location/service path over generic /book. */
export function resolvePostLoginRedirect(
  nextParam: string | null | undefined,
  cookieParam: string | null | undefined
): string {
  const next = safeRedirectPath(nextParam);
  const cookie = safeRedirectPath(cookieParam);

  if (isDeepBookPath(next)) return next!;
  if (isDeepBookPath(cookie)) return cookie!;

  const candidates = [next, cookie].filter(Boolean) as string[];
  const nonGeneric = candidates.find((p) => p !== '/book' && p !== '/');
  return nonGeneric || next || cookie || '/book';
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

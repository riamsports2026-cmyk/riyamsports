import { safeRedirectPath } from '@/lib/utils/public-routes';

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

export function isDeepBookPath(path: string | null | undefined): boolean {
  return !!path && path.startsWith('/book/');
}

/**
 * Pick the best post-login destination. Prefers a specific /book/location/service
 * path over the generic /book listing when OAuth drops the deep link.
 */
export function resolvePostLoginRedirect(
  nextParam: string | null | undefined,
  cookieParam: string | null | undefined,
  pathnameFallback?: string | null
): string {
  const next = safeRedirectPath(nextParam);
  const cookie = safeRedirectPath(
    cookieParam ? decodeURIComponent(cookieParam) : null
  );
  const fallback = safeRedirectPath(pathnameFallback);

  const candidates = [next, cookie, fallback].filter(Boolean) as string[];

  const specificBook = candidates.find((p) => isDeepBookPath(p));
  if (specificBook) return specificBook;

  const nonGeneric = candidates.find((p) => p !== '/book' && p !== '/');
  if (nonGeneric) return nonGeneric;

  return next || cookie || fallback || '/book';
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

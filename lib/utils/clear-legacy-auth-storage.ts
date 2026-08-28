/**
 * Remove legacy Supabase localStorage entries and stale auth cookies from
 * older flows. Mixed storage causes "PKCE code verifier not found" errors.
 */
export function clearLegacySupabaseAuthStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore private browsing / storage errors
  }

  try {
    const cookieNames = document.cookie
      .split(';')
      .map((part) => part.trim().split('=')[0])
      .filter((name) => name.startsWith('sb-'));

    cookieNames.forEach((name) => {
      document.cookie = `${name}=; Max-Age=0; path=/`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
    });
  } catch {
    // ignore
  }
}

/** @deprecated Use clearLegacySupabaseAuthStorage */
export function clearLegacySupabaseLocalStorage(): void {
  clearLegacySupabaseAuthStorage();
}

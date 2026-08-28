/**
 * Remove legacy Supabase localStorage entries from older auth flows.
 * Server-side OAuth uses cookies; leftover localStorage PKCE keys cause
 * "code verifier not found" in normal browser tabs (incognito has none).
 */
export function clearLegacySupabaseLocalStorage(): void {
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
}

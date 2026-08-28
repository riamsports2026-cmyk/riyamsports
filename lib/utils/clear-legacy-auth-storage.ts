/**
 * Remove legacy Supabase localStorage entries from older auth flows.
 * Do not clear sb-* cookies here — that removes the PKCE verifier mid-OAuth.
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
}

/** @deprecated Use clearLegacySupabaseAuthStorage */
export function clearLegacySupabaseLocalStorage(): void {
  clearLegacySupabaseAuthStorage();
}

'use client';

import { useEffect } from 'react';
import { clearLegacySupabaseAuthStorage } from '@/lib/utils/clear-legacy-auth-storage';

/** Clears stale Supabase localStorage on login page load (fixes PKCE in normal Chrome tabs). */
export function LoginAuthStorageCleanup() {
  useEffect(() => {
    clearLegacySupabaseAuthStorage();
  }, []);
  return null;
}

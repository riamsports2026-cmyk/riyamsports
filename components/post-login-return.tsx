'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { consumeAuthRedirect, isDeepBookPath } from '@/lib/utils/auth-redirect';

/**
 * If OAuth sends the user to generic /book instead of their booking page,
 * restore the saved return path from sessionStorage.
 */
export function PostLoginReturn() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== '/book') return;
    const returnPath = consumeAuthRedirect();
    if (returnPath && isDeepBookPath(returnPath)) {
      router.replace(returnPath);
    }
  }, [pathname, router]);

  return null;
}

'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { loadBookingDraft } from '@/lib/utils/booking-draft';
import { isDeepBookPath, peekAuthRedirect } from '@/lib/utils/auth-redirect';

/**
 * After OAuth, the server may land on /book instead of /book/location/service.
 * sessionStorage + booking draft hold the deep path — redirect client-side.
 */
export function PostLoginReturn() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/book' && pathname !== '/') return;

    const draft = loadBookingDraft();
    const storedRedirect = peekAuthRedirect();

    const target =
      (draft?.returnPath && isDeepBookPath(draft.returnPath)
        ? draft.returnPath
        : null) ||
      (isDeepBookPath(storedRedirect) ? storedRedirect : null);

    if (target) {
      router.replace(target);
    }
  }, [pathname, router]);

  return null;
}

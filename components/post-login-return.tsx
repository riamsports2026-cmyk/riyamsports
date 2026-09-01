'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  loadBookingDraft,
  markContinuationPendingResume,
  shouldRedirectAfterAuth,
} from '@/lib/utils/booking-draft';
import { consumeAuthRedirect, isDeepBookPath } from '@/lib/utils/auth-redirect';

/**
 * After OAuth, the server may land on /book instead of /book/location/service.
 * Only redirect when an active pending_auth continuation exists — never stale drafts.
 */
export function PostLoginReturn() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/book' && pathname !== '/') return;

    const draft = loadBookingDraft();
    if (!shouldRedirectAfterAuth(draft)) return;

    const storedRedirect = consumeAuthRedirect();
    const target =
      (draft!.returnPath && isDeepBookPath(draft!.returnPath)
        ? draft!.returnPath
        : null) ||
      (isDeepBookPath(storedRedirect) ? storedRedirect : null);

    if (target) {
      markContinuationPendingResume();
      router.replace(target);
    }
  }, [pathname, router]);

  return null;
}

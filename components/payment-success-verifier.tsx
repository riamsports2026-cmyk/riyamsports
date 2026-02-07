'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { verifyRazorpayPaymentOnReturn } from '@/lib/actions/payments';

interface PaymentSuccessVerifierProps {
  bookingId: string;
  paymentParam: string | undefined;
}

/**
 * Runs payment verification in the background when user lands with ?payment=success.
 * Does not block initial page render; calls verifyRazorpayPaymentOnReturn then refreshes.
 */
export function PaymentSuccessVerifier({ bookingId, paymentParam }: PaymentSuccessVerifierProps) {
  const router = useRouter();
  const didRun = useRef(false);

  useEffect(() => {
    if (paymentParam !== 'success' || !bookingId || didRun.current) return;
    didRun.current = true;
    verifyRazorpayPaymentOnReturn(bookingId).then(() => {
      router.refresh();
    });
  }, [bookingId, paymentParam, router]);

  return null;
}

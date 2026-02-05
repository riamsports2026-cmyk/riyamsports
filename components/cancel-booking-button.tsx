'use client';

import { cancelBooking } from '@/lib/actions/bookings';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

const CANCELLABLE_STATUSES = ['pending_payment', 'confirmed'];

export function CancelBookingButton({
  bookingId,
  bookingStatus,
  variant = 'button',
  className = '',
}: {
  bookingId: string;
  bookingStatus: string;
  variant?: 'button' | 'link';
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!CANCELLABLE_STATUSES.includes(bookingStatus)) {
    return null;
  }

  const handleCancel = () => {
    if (!confirm('Are you sure you want to cancel this booking? This cannot be undone.')) {
      return;
    }
    startTransition(async () => {
      const result = await cancelBooking(bookingId);
      if (result?.success) {
        router.refresh();
      } else {
        alert(result?.error ?? 'Failed to cancel booking');
      }
    });
  };

  const baseClass = variant === 'link'
    ? 'text-sm font-semibold text-red-600 hover:text-red-700 underline focus:outline-none focus:ring-2 focus:ring-red-500/30 rounded'
    : 'inline-flex items-center justify-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={isPending}
      className={`${baseClass} ${className}`}
    >
      {isPending ? 'Cancelling…' : 'Cancel booking'}
    </button>
  );
}

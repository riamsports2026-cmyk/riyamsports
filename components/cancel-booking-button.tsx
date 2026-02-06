'use client';

import { cancelBooking } from '@/lib/actions/bookings';
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Toast } from '@/components/ui/toast';

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  if (!CANCELLABLE_STATUSES.includes(bookingStatus)) {
    return null;
  }

  const handleConfirmCancel = () => {
    setShowConfirm(false);
    startTransition(async () => {
      const result = await cancelBooking(bookingId);
      if (result?.success) {
        setToast({ isOpen: true, message: 'Booking cancelled.', type: 'success' });
        router.refresh();
      } else {
        setToast({ isOpen: true, message: result?.error ?? 'Failed to cancel booking', type: 'error' });
      }
    });
  };

  const baseClass = variant === 'link'
    ? 'text-sm font-semibold text-red-600 hover:text-red-700 underline focus:outline-none focus:ring-2 focus:ring-red-500/30 rounded cursor-pointer'
    : 'inline-flex items-center justify-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className={`${baseClass} ${className}`}
      >
        {isPending ? 'Cancelling…' : 'Cancel booking'}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Cancel booking"
        message="Are you sure you want to cancel this booking? This cannot be undone."
        confirmText="Yes, cancel"
        cancelText="Keep booking"
        variant="danger"
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowConfirm(false)}
      />

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, isOpen: false }))}
      />
    </>
  );
}

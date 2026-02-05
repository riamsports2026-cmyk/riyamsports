'use client';

import { updateBookingStatus } from '@/lib/actions/admin/bookings';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui/toast';

interface BookingStatusFormProps {
  bookingId: string;
  currentStatus: string;
}

export function BookingStatusForm({ bookingId, currentStatus }: BookingStatusFormProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });
  const router = useRouter();

  const handleStatusChange = async (newStatus: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled') => {
    setIsUpdating(true);
    const result = await updateBookingStatus(bookingId, newStatus);
    setIsUpdating(false);

    if (result.success) {
      setToast({ isOpen: true, message: 'Booking status updated successfully', type: 'success' });
      router.refresh();
    } else {
      setToast({ isOpen: true, message: result.error || 'Failed to update status', type: 'error' });
    }
  };

  const isCancelled = currentStatus === 'cancelled';

  return (
    <>
      <div className="relative w-full min-w-[140px] z-10">
        {isCancelled ? (
          <span className="block w-full min-w-[140px] pl-3 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 font-medium">
            Cancelled (cannot change)
          </span>
        ) : (
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            disabled={isUpdating}
            className="block w-full min-w-[140px] pl-3 pr-10 py-2.5 text-sm border-2 border-[#1E3A5F]/20 focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] rounded-xl disabled:opacity-50 cursor-pointer bg-white font-medium text-[#1E3A5F]"
            style={{ 
              maxHeight: 'none', 
              minWidth: '140px'
            }}
          >
            <option value="pending_payment">Pending Payment</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}
      </div>

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </>
  );
}



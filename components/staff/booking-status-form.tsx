'use client';

import { updateBookingStatus } from '@/lib/actions/staff/bookings';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState, useEffect } from 'react';
import { Toast } from '@/components/ui/toast';

interface BookingStatusFormProps {
  bookingId: string;
  currentStatus: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-lg hover:shadow-xl"
    >
      {pending ? 'Updating...' : 'Update'}
    </button>
  );
}

export function BookingStatusForm({ bookingId, currentStatus }: BookingStatusFormProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });
  const [state, formAction] = useActionState(
    async (prevState: { error?: string; success?: boolean } | null, formData: FormData) => {
      const status = formData.get('status') as string;
      const result = await updateBookingStatus(bookingId, status as any);
      return result;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      setToast({ isOpen: true, message: state.error, type: 'error' });
    } else if (state?.success) {
      setToast({ isOpen: true, message: 'Booking status updated successfully', type: 'success' });
    }
  }, [state]);

  return (
    <>
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="status" value={selectedStatus} />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="block w-full pl-3 pr-10 py-2.5 text-sm border-2 border-[#1E3A5F]/20 focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] rounded-xl cursor-pointer bg-white font-medium text-[#1E3A5F]"
          style={{ maxHeight: 'none', overflow: 'visible' }}
        >
          <option value="pending_payment" className="py-2">Pending Payment</option>
          <option value="confirmed" className="py-2">Confirmed</option>
          <option value="completed" className="py-2">Completed</option>
          <option value="cancelled" className="py-2">Cancelled</option>
        </select>
        <SubmitButton />
      </form>

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </>
  );
}



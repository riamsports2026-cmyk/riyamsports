import { createServiceClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/utils/roles';
import { createClient } from '@/lib/supabase/server';
import { PaymentHistory } from '@/components/admin/payment-history';
import { BalanceUpdateForm } from '@/components/admin/balance-update-form';
import { BookingStatusForm } from '@/components/admin/booking-status-form';
import { format } from 'date-fns';
import { formatTimeSlots } from '@/lib/utils/time-format';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user.id))) {
    notFound();
  }

  const serviceClient = await createServiceClient();

  const { data: booking, error } = await serviceClient
    .from('bookings')
    .select(`
      *,
      turf:turfs(
        *,
        location:locations(*),
        service:services(*)
      ),
      slots:booking_slots(*),
      payments:payments(*)
    `)
    .eq('id', id)
    .single();

  if (error || !booking) {
    notFound();
  }

  type BookingRow = {
    id: string;
    booking_id?: string;
    booking_date?: string;
    booking_status?: string;
    payment_status?: string;
    total_amount?: number | null;
    received_amount?: number | null;
    payments?: { id: string; amount: number; created_at?: string; payment_type?: string; payment_gateway?: string }[];
    turf?: { name?: string; location?: { name?: string }; service?: { name?: string } };
    slots?: { hour: number }[];
  };
  const bookingData = booking as BookingRow;
  const payments: { id: string; amount: number; created_at?: string; payment_type?: string; payment_gateway?: string }[] = bookingData.payments || [];
  const receivedAmount = Number(bookingData.received_amount || 0);

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="mb-6">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center text-sm text-[#1E3A5F] hover:text-[#FF6B35] mb-4 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Bookings
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
          Booking Details
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Information */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 p-6">
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Booking Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Booking ID</div>
                <div className="font-bold text-[#1E3A5F]">#{bookingData.booking_id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Date</div>
                <div className="font-semibold">{bookingData.booking_date ? format(new Date(bookingData.booking_date), 'MMM dd, yyyy') : 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Location</div>
                <div className="font-semibold">{bookingData.turf?.location?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Service</div>
                <div className="font-semibold">{bookingData.turf?.service?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Turf</div>
                <div className="font-semibold">{bookingData.turf?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Time Slots</div>
                <div className="font-semibold">{formatTimeSlots(bookingData.slots || [])}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Booking Status</div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  bookingData.booking_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  bookingData.booking_status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                  bookingData.booking_status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {bookingData.booking_status}
                </span>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Payment Status</div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  bookingData.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                  bookingData.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {bookingData.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <PaymentHistory
            payments={payments}
            totalAmount={Number(bookingData.total_amount ?? 0)}
            receivedAmount={receivedAmount}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Balance Update */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 p-6">
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Update Balance</h3>
            <BalanceUpdateForm
              bookingId={bookingData.id}
              totalAmount={Number(bookingData.total_amount ?? 0)}
              currentReceived={receivedAmount}
            />
          </div>

          {/* Booking Status */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 p-6">
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Update Status</h3>
            <BookingStatusForm
              bookingId={bookingData.id}
              currentStatus={bookingData.booking_status ?? 'pending_payment'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}




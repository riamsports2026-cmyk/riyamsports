import { getBooking } from '@/lib/actions/bookings';
import { verifyRazorpayPaymentOnReturn } from '@/lib/actions/payments';
import { formatTimeSlots } from '@/lib/utils/time-format';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { CancelBookingButton } from '@/components/cancel-booking-button';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Booking ${id} | RIAM Sports`,
  };
}

export default async function BookingDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { payment: paymentParam } = await searchParams;

  if (paymentParam === 'success') {
    await verifyRazorpayPaymentOnReturn(id);
  }

  const booking = await getBooking(id);

  if (!booking) {
    notFound();
  }

  const showPaymentSuccess =
    paymentParam === 'success' &&
    (booking.booking_status === 'confirmed' || booking.payment_status === 'paid' || booking.payment_status === 'partial');
  const showPaymentPending =
    paymentParam === 'success' && booking.booking_status === 'pending_payment';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {showPaymentSuccess && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
            <p className="font-medium">Payment successful</p>
            <p className="text-sm mt-0.5">Your booking is confirmed. You will receive a confirmation message shortly.</p>
          </div>
        )}
        {showPaymentPending && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800">
            <p className="font-medium">Verifying payment</p>
            <p className="text-sm mt-0.5">If you completed the payment, your booking will update shortly. Refresh the page in a moment.</p>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Booking Confirmation
          </h1>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Booking ID</p>
              <p className="text-lg font-semibold">{booking.booking_id}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="text-lg">{booking.turf.location.name}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                <p className="text-sm text-gray-600">
                  {booking.turf.location.address}, {booking.turf.location.city}, {booking.turf.location.state} - {booking.turf.location.pincode}
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((booking.turf.location as any).google_maps_address || `${booking.turf.location.address}, ${booking.turf.location.city}, ${booking.turf.location.state} ${booking.turf.location.pincode}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF6B35] hover:text-[#E55A2B] transition-colors group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Get Directions</span>
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Sport</p>
              <p className="text-lg">{booking.turf.service.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Turf</p>
              <p className="text-lg">{booking.turf.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="text-lg">
                {format(new Date(booking.booking_date), 'MMMM dd, yyyy')}
              </p>
              <p className="text-lg mt-2">
                {formatTimeSlots(booking.slots)}
              </p>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold">₹{booking.total_amount}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Advance Amount:</span>
                <span className="font-semibold">₹{booking.advance_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-semibold ${
                    booking.booking_status === 'confirmed'
                      ? 'text-green-600'
                      : booking.booking_status === 'cancelled'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}
                >
                  {booking.booking_status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          {(booking.booking_status === 'pending_payment' || booking.booking_status === 'confirmed') && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Need to cancel this booking?</p>
              <CancelBookingButton
                bookingId={booking.id}
                bookingStatus={booking.booking_status}
                variant="button"
                className="inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



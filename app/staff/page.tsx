import { getStaffBookings } from '@/lib/actions/staff/bookings';
import { BookingStatusForm } from '@/components/staff/booking-status-form';
import { BalanceUpdateForm } from '@/components/staff/balance-update-form';
import { PaymentHistory } from '@/components/staff/payment-history';
import { BookingFilters } from '@/components/booking-filters';
import { Pagination } from '@/components/pagination';
import { Loader } from '@/components/ui/loader';
import { formatTimeSlots } from '@/lib/utils/time-format';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Staff Dashboard | RIAM Sports',
  description: 'Manage bookings for your assigned locations',
};

export default async function StaffDashboard({
  searchParams,
}: {
  searchParams: Promise<{ 
    start_date?: string; 
    end_date?: string; 
    start_time?: string; 
    end_time?: string;
    page?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }>;
}) {
  const params = await searchParams;
  const filters = {
    startDate: params.start_date,
    endDate: params.end_date,
    startTime: params.start_time,
    endTime: params.end_time,
    page: params.page ? parseInt(params.page) : 1,
    limit: 10,
    sortBy: params.sort_by || 'created_at',
    sortOrder: (params.sort_order as 'asc' | 'desc') || 'desc',
  };
  
  const result = await getStaffBookings(filters);
  const bookings = Array.isArray(result) ? result : result.data;
  const total = Array.isArray(result) ? result.length : result.total;
  const page = Array.isArray(result) ? 1 : result.page;
  const totalPages = Array.isArray(result) ? 1 : result.totalPages;
  
  // Debug: Log booking count
  console.log(`[StaffDashboard] Rendering with ${bookings.length} booking(s)`);

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
          📅 Bookings Management
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">
          Manage bookings for your assigned locations
        </p>
      </div>

      <Suspense fallback={
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-[#1E3A5F]/10">
          <Loader size="md" label="Loading filters..." />
        </div>
      }>
        <BookingFilters />
      </Suspense>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#1E3A5F]/10 mt-6">
        {bookings.length === 0 ? (
          <div className="text-center py-12 bg-linear-to-br from-[#FF6B35]/5 to-[#1E3A5F]/5">
            <p className="text-sm sm:text-base text-[#1E3A5F] font-medium">No bookings found for your assigned locations.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {bookings.map((booking: any) => (
              <li key={booking.id} className="hover:bg-[#FF6B35]/5 transition-colors">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 w-full">
                      <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F] mb-3">
                        Booking #{booking.booking_id}
                      </h3>
                      <div className="mt-2 text-sm text-gray-700 space-y-1.5">
                        <p>
                          <span className="font-semibold text-[#1E3A5F]">📍 Location:</span>{' '}
                          <span className="text-gray-700">{booking.turf?.location?.name}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E3A5F]">⚽ Service:</span>{' '}
                          <span className="text-gray-700">{booking.turf?.service?.name}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E3A5F]">🏟️ Turf:</span>{' '}
                          <span className="text-gray-700">{booking.turf?.name}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E3A5F]">📅 Date:</span>{' '}
                          <span className="text-gray-700">{new Date(booking.booking_date).toLocaleDateString()}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E3A5F]">⏰ Time:</span>{' '}
                          <span className="text-gray-700">{formatTimeSlots(booking.slots)}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E3A5F]">💰 Total Amount:</span>{' '}
                          <span className="text-[#FF6B35] font-bold">₹{booking.total_amount.toLocaleString()}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E3A5F]">✅ Received:</span>{' '}
                          <span className="text-green-600 font-bold">₹{Number((booking as any).received_amount || 0).toLocaleString()}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E3A5F]">⚖️ Balance:</span>{' '}
                          <span className="text-[#FF6B35] font-bold">₹{(Number(booking.total_amount) - Number((booking as any).received_amount || 0)).toLocaleString()}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E3A5F]">💳 Payment Status:</span>{' '}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            booking.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.payment_status}
                          </span>
                        </p>
                      </div>
                      
                      {/* Payment History */}
                      {booking.payments && booking.payments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <PaymentHistory
                            payments={booking.payments}
                            totalAmount={Number(booking.total_amount)}
                            receivedAmount={Number((booking as any).received_amount || 0)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="w-full sm:w-auto space-y-2">
                      <BalanceUpdateForm
                        bookingId={booking.id}
                        totalAmount={Number(booking.total_amount)}
                        currentReceived={Number((booking as any).received_amount || 0)}
                      />
                      <BookingStatusForm bookingId={booking.id} currentStatus={booking.booking_status} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={filters.limit}
          />
        )}
      </div>
    </div>
  );
}



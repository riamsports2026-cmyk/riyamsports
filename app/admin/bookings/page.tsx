import { getAllBookings } from '@/lib/actions/admin/bookings';
import { format } from 'date-fns';
import { BookingStatusForm } from '@/components/admin/booking-status-form';
import { BalanceUpdateForm } from '@/components/admin/balance-update-form';
import { AdminBookingFilters } from '@/components/admin/booking-filters-enhanced';
import { Pagination } from '@/components/pagination';
import { TableSort } from '@/components/ui/table-sort';
import { Loader } from '@/components/ui/loader';
import { formatTimeSlots } from '@/lib/utils/time-format';
import { Suspense } from 'react';
import Link from 'next/link';

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    start_date?: string; 
    end_date?: string; 
    start_time?: string; 
    end_time?: string;
    status?: string;
    payment_status?: string;
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
    status: params.status,
    paymentStatus: params.payment_status,
    page: params.page ? parseInt(params.page) : 1,
    limit: 10,
    sortBy: params.sort_by || 'created_at',
    sortOrder: (params.sort_order as 'asc' | 'desc') || 'desc',
  };
  
  const result = await getAllBookings(filters);
  const bookings = result.data;
  const { total, page, totalPages } = result;

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
          📅 Booking History
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">View and manage all bookings</p>
      </div>

      <Suspense fallback={
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-[#1E3A5F]/10">
          <Loader size="md" label="Loading filters..." />
        </div>
      }>
        <AdminBookingFilters />
      </Suspense>

      <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 mt-6 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-linear-to-r from-[#1E3A5F] to-[#2D4F7C]">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Location & Service
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  <TableSort 
                    sortBy={filters.sortBy} 
                    sortOrder={filters.sortOrder} 
                    field="booking_date" 
                    label="Date & Time"
                  />
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  <TableSort 
                    sortBy={filters.sortBy} 
                    sortOrder={filters.sortOrder} 
                    field="total_amount" 
                    label="Amount"
                  />
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  <TableSort 
                    sortBy={filters.sortBy} 
                    sortOrder={filters.sortOrder} 
                    field="payment_status" 
                    label="Payment"
                  />
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  <TableSort 
                    sortBy={filters.sortBy} 
                    sortOrder={filters.sortOrder} 
                    field="booking_status" 
                    label="Status"
                  />
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-[#FF6B35]/5 transition-colors">
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-bold text-[#1E3A5F]">
                    #{booking.booking_id}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div>
                      <div className="font-semibold text-[#1E3A5F]">{booking.turf?.location?.name}</div>
                      <div className="text-xs text-gray-600">{booking.turf?.name} - {booking.turf?.service?.name}</div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{format(new Date(booking.booking_date), 'MMM dd, yyyy')}</div>
                    <div className="text-xs">
                      {formatTimeSlots(booking.slots)}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="font-semibold">Total: ₹{Number(booking.total_amount).toLocaleString()}</div>
                      <div className="text-xs text-green-600 font-medium">
                        Received: ₹{Number((booking as any).received_amount || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-[#FF6B35] font-medium">
                        Balance: ₹{(Number(booking.total_amount) - Number((booking as any).received_amount || 0)).toLocaleString()}
                      </div>
                      {booking.payments && booking.payments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs font-semibold text-[#1E3A5F] mb-1">Payment History:</div>
                          {booking.payments.slice(0, 3).map((payment: any) => {
                            const paymentDate = new Date(payment.created_at);
                            return (
                              <div key={payment.id} className="text-xs text-gray-700 mb-1">
                                <span className="font-bold text-[#1E3A5F]">₹{Number(payment.amount).toLocaleString()}</span>
                                {' '}on{' '}
                                <span className="font-semibold">{format(paymentDate, 'MMM dd')}</span>
                                {' '}at{' '}
                                <span className="font-semibold text-[#FF6B35]">{format(paymentDate, 'hh:mm a')}</span>
                              </div>
                            );
                          })}
                          {booking.payments.length > 3 && (
                            <Link
                              href={`/admin/bookings/${booking.id}`}
                              className="text-xs text-[#FF6B35] font-medium hover:underline cursor-pointer"
                            >
                              View all {booking.payments.length} payments →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        booking.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.payment_status}
                      </span>
                      <div>
                        <BalanceUpdateForm
                          bookingId={booking.id}
                          totalAmount={Number(booking.total_amount)}
                          currentReceived={Number((booking as any).received_amount || 0)}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap min-w-[140px]">
                    <BookingStatusForm bookingId={booking.id} currentStatus={booking.booking_status} />
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-sm font-medium">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="text-xs text-[#FF6B35] hover:text-[#E55A2B] font-semibold cursor-pointer whitespace-nowrap"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200">
          {bookings.map((booking) => (
            <div key={booking.id} className="p-4">
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {booking.booking_id}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {booking.turf?.location?.name}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service:</span>
                  <span className="text-gray-900">{booking.turf?.name} - {booking.turf?.service?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="text-gray-900">{format(new Date(booking.booking_date), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time:</span>
                  <span className="text-gray-900">
                    {formatTimeSlots(booking.slots)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="text-gray-900 font-medium">₹{Number(booking.total_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Received:</span>
                  <span className="text-green-600 font-medium">₹{Number((booking as any).received_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Balance:</span>
                  <span className="text-[#FF6B35] font-medium">₹{(Number(booking.total_amount) - Number((booking as any).received_amount || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    booking.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.payment_status}
                  </span>
                </div>
                {booking.payments && booking.payments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs font-semibold text-[#1E3A5F] mb-1">Payment History:</div>
                    {booking.payments.slice(0, 3).map((payment: any) => {
                      const paymentDate = new Date(payment.created_at);
                      return (
                        <div key={payment.id} className="text-xs text-gray-700 mb-1">
                          <span className="font-bold text-[#1E3A5F]">₹{Number(payment.amount).toLocaleString()}</span>
                          {' '}on{' '}
                          <span className="font-semibold">{format(paymentDate, 'MMM dd')}</span>
                          {' '}at{' '}
                          <span className="font-semibold text-[#FF6B35]">{format(paymentDate, 'hh:mm a')}</span>
                        </div>
                      );
                    })}
                    {booking.payments.length > 3 && (
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="text-xs text-[#FF6B35] font-medium hover:underline cursor-pointer"
                      >
                        View all {booking.payments.length} payments →
                      </Link>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-2">
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="block w-full text-center px-3 py-2 text-xs font-semibold text-white bg-linear-to-r from-[#1E3A5F] to-[#2D4F7C] hover:from-[#2D4F7C] hover:to-[#1E3A5F] rounded-lg transition-all cursor-pointer"
                >
                  View Full Details
                </Link>
                <BalanceUpdateForm
                  bookingId={booking.id}
                  totalAmount={Number(booking.total_amount)}
                  currentReceived={Number((booking as any).received_amount || 0)}
                />
                <div style={{ position: 'relative', zIndex: 9999 }}>
                  <BookingStatusForm bookingId={booking.id} currentStatus={booking.booking_status} />
                </div>
              </div>
            </div>
          ))}
        </div>
        {bookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No bookings found</p>
          </div>
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



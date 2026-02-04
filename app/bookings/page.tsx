import { getUserBookings } from '@/lib/actions/bookings';
import { Pagination } from '@/components/pagination';
import { BookingDateFilters } from '@/components/booking-date-filters';
import Link from 'next/link';
import { ViewToggle } from '@/components/ui/view-toggle';
import { BookingsView } from '@/components/bookings-view';
import { Loader } from '@/components/ui/loader';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'My Bookings | RIAM Sports',
  description: 'View your booking history',
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    view?: string;
  }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 10;
  
  const filters = {
    page,
    limit,
    startDate: params.start_date,
    endDate: params.end_date,
    sortBy: params.sort_by || 'created_at',
    sortOrder: (params.sort_order as 'asc' | 'desc') || 'desc',
  };
  
  const result = await getUserBookings(filters);
  const bookings = result.data;
  const { total, totalPages } = result;

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F5F7FA] via-white to-[#FF6B35]/5 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
                📅 My Bookings
              </h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-[#1E3A5F] font-medium">View your booking history</p>
            </div>
            {bookings.length > 0 && (
              <div className="w-full sm:w-auto hidden lg:block">
                <ViewToggle defaultView="row" />
              </div>
            )}
          </div>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-[#1E3A5F]/10 mb-6">
            <Loader size="md" label="Loading filters..." />
          </div>
        }>
          <BookingDateFilters />
        </Suspense>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-xl border-2 border-[#1E3A5F]/10 p-12 text-center">
            <p className="text-[#1E3A5F] font-medium text-lg mb-4">You haven&apos;t made any bookings yet.</p>
            <Link
              href="/book"
              className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer"
            >
              🚀 Book a Turf
            </Link>
          </div>
        ) : (
          <BookingsView bookings={bookings} />
        )}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={limit}
          />
        )}
      </div>
    </div>
  );
}



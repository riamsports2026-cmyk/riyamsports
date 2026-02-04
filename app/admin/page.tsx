import { createClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { getAllBookings } from '@/lib/actions/admin/bookings';
import { getAllUsers } from '@/lib/actions/admin/users';
import { BookingFilters } from '@/components/booking-filters';
import { Loader } from '@/components/ui/loader';
import Link from 'next/link';
import { Suspense } from 'react';

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return null;
  }

  const params = await searchParams;
  const filters = {
    startDate: params.start_date,
    endDate: params.end_date,
    startTime: params.start_time,
    endTime: params.end_time,
    page: 1,
    limit: 10000, // Get all for stats
  };

  // Get all bookings and users for dashboard stats (with date filters if provided)
  const [bookingsResult, usersResult] = await Promise.all([
    getAllBookings(filters),
    getAllUsers(1, 10000), // Users don't need date filtering
  ]);

  const bookings = bookingsResult.data;
  const users = usersResult.data;

  const stats = {
    totalUsers: users.length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b: any) => b.booking_status === 'pending_payment').length,
    confirmedBookings: bookings.filter((b: any) => b.booking_status === 'confirmed').length,
    totalRevenue: bookings
      .filter((b: any) => b.payment_status === 'paid' || b.payment_status === 'partial')
      .reduce((sum: number, b: any) => sum + Number(b.received_amount || 0), 0),
  };

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
          📊 Dashboard
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">
          Overview of your turf booking system
        </p>
      </div>

      <Suspense fallback={
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-[#1E3A5F]/10">
          <Loader size="md" label="Loading filters..." />
        </div>
      }>
        <BookingFilters />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-[#1E3A5F]/10 overflow-hidden transform hover:scale-105">
          <div className="bg-linear-to-br from-[#1E3A5F] to-[#2D4F7C] p-4">
            <div className="flex items-center justify-between">
              <div className="text-white/90 text-sm font-semibold">Total Users</div>
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="p-5">
            <div className="text-2xl sm:text-3xl font-bold text-[#1E3A5F]">{stats.totalUsers}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-[#1E3A5F]/10 overflow-hidden transform hover:scale-105">
          <div className="bg-linear-to-br from-[#FF6B35] to-[#FF8C61] p-4">
            <div className="flex items-center justify-between">
              <div className="text-white/90 text-sm font-semibold">Total Bookings</div>
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="p-5">
            <div className="text-2xl sm:text-3xl font-bold text-[#1E3A5F]">{stats.totalBookings}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-[#1E3A5F]/10 overflow-hidden transform hover:scale-105">
          <div className="bg-linear-to-br from-yellow-500 to-yellow-400 p-4">
            <div className="flex items-center justify-between">
              <div className="text-white/90 text-sm font-semibold">Pending</div>
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="p-5">
            <div className="text-2xl sm:text-3xl font-bold text-[#1E3A5F]">{stats.pendingBookings}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-[#1E3A5F]/10 overflow-hidden transform hover:scale-105">
          <div className="bg-linear-to-br from-green-600 to-green-500 p-4">
            <div className="flex items-center justify-between">
              <div className="text-white/90 text-sm font-semibold">Revenue</div>
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="p-5">
            <div className="text-2xl sm:text-3xl font-bold text-[#1E3A5F]">₹{stats.totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F] mb-4 flex items-center">
              <span className="mr-2">⚡</span> Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                href="/admin/users"
                className="block w-full text-left px-4 py-3 border-2 border-[#1E3A5F]/20 rounded-lg text-sm font-semibold text-[#1E3A5F] bg-white hover:bg-linear-to-r hover:from-[#FF6B35]/10 hover:to-[#1E3A5F]/10 hover:border-[#FF6B35] transition-all transform hover:scale-105"
              >
                👥 Manage Users & Roles
              </Link>
              <Link
                href="/admin/locations"
                className="block w-full text-left px-4 py-3 border-2 border-[#1E3A5F]/20 rounded-lg text-sm font-semibold text-[#1E3A5F] bg-white hover:bg-linear-to-r hover:from-[#FF6B35]/10 hover:to-[#1E3A5F]/10 hover:border-[#FF6B35] transition-all transform hover:scale-105"
              >
                📍 Manage Locations
              </Link>
              <Link
                href="/admin/services"
                className="block w-full text-left px-4 py-3 border-2 border-[#1E3A5F]/20 rounded-lg text-sm font-semibold text-[#1E3A5F] bg-white hover:bg-linear-to-r hover:from-[#FF6B35]/10 hover:to-[#1E3A5F]/10 hover:border-[#FF6B35] transition-all transform hover:scale-105"
              >
                ⚽ Manage Sports/Services
              </Link>
              <Link
                href="/admin/bookings"
                className="block w-full text-left px-4 py-3 border-2 border-[#1E3A5F]/20 rounded-lg text-sm font-semibold text-[#1E3A5F] bg-white hover:bg-linear-to-r hover:from-[#FF6B35]/10 hover:to-[#1E3A5F]/10 hover:border-[#FF6B35] transition-all transform hover:scale-105"
              >
                📅 View All Bookings
              </Link>
              <Link
                href="/admin/change-password"
                className="block w-full text-left px-4 py-3 border-2 border-[#1E3A5F]/20 rounded-lg text-sm font-semibold text-[#1E3A5F] bg-white hover:bg-linear-to-r hover:from-[#FF6B35]/10 hover:to-[#1E3A5F]/10 hover:border-[#FF6B35] transition-all transform hover:scale-105"
              >
                🔒 Change Password
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F] mb-4 flex items-center">
              <span className="mr-2">📋</span> Recent Bookings
            </h3>
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {bookings.slice(0, 5).map((booking: any) => (
                  <li key={booking.id} className="py-4 hover:bg-[#FF6B35]/5 transition-colors rounded-lg px-2">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1E3A5F] truncate">
                          Booking #{booking.booking_id}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {booking.turf?.name} - {new Date(booking.booking_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.booking_status === 'confirmed' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                          booking.booking_status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                          'bg-gray-100 text-gray-800 border-2 border-gray-300'
                        }`}>
                          {booking.booking_status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {bookings.length === 0 && (
              <p className="text-sm text-[#1E3A5F] text-center py-4 font-medium">No bookings yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



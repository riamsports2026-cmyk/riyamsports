'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatTimeSlots } from '@/lib/utils/time-format';
import { ViewMode } from '@/components/ui/view-toggle';
import { CancelBookingButton } from '@/components/cancel-booking-button';

interface Booking {
  id: string;
  booking_id: string;
  booking_date: string;
  booking_status: string;
  payment_status: string;
  total_amount: number;
  received_amount?: number;
  turf?: {
    name: string;
    location?: {
      name: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      google_maps_address?: string;
    };
    service?: {
      name: string;
    };
  };
  slots?: Array<{ hour: number }>;
  payments?: Array<{ payment_status?: string } & Record<string, unknown>>;
}

interface BookingsViewProps {
  bookings: Booking[];
  viewMode?: ViewMode;
}

export function BookingsView({ bookings, viewMode = 'row' }: BookingsViewProps) {
  const searchParams = useSearchParams();
  const view = (searchParams.get('view') as ViewMode) || viewMode || 'row';

  const getGoogleMapsUrl = (location: any) => {
    const address = location.google_maps_address || 
      `${location.address}, ${location.city}, ${location.state} ${location.pincode}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 hover:shadow-2xl transition-all duration-300 hover:border-[#FF6B35] p-4 sm:p-5 md:p-6 h-full flex flex-col min-h-[280px]">
      <div className="flex flex-col gap-2 mb-3 sm:mb-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#1E3A5F] break-all flex-1 min-w-0">
            <span className="text-xs sm:text-sm text-gray-500 font-normal block mb-0.5">Booking</span>
            <span className="block">#{booking.booking_id}</span>
          </h3>
          <span
            className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border-2 whitespace-nowrap shrink-0 ${
              booking.booking_status === 'confirmed'
                ? 'bg-green-100 text-green-800 border-green-300'
                : booking.booking_status === 'pending_payment'
                ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                : booking.booking_status === 'completed'
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-red-100 text-red-800 border-red-300'
            }`}
          >
            {booking.booking_status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="flex-1 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
        <div>
          <p className="wrap-break-word leading-relaxed">
            <span className="font-semibold text-[#1E3A5F] inline-block min-w-[80px]">📍 Location:</span>{' '}
            <span className="text-gray-700 wrap-break-word">{booking.turf?.location?.name || 'N/A'}</span>
          </p>
          {booking.turf?.location && (
            <a
              href={getGoogleMapsUrl(booking.turf.location)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-[10px] sm:text-xs font-semibold text-[#FF6B35] hover:text-[#E55A2B] transition-colors group cursor-pointer"
            >
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="whitespace-nowrap">Get Directions</span>
            </a>
          )}
        </div>
        <p className="wrap-break-word leading-relaxed">
          <span className="font-semibold text-[#1E3A5F] inline-block min-w-[80px]">⚽ Service:</span>{' '}
          <span className="text-gray-700 wrap-break-word">{booking.turf?.service?.name || 'N/A'}</span>
        </p>
        <p className="wrap-break-word leading-relaxed">
          <span className="font-semibold text-[#1E3A5F] inline-block min-w-[80px]">🏟️ Turf:</span>{' '}
          <span className="text-gray-700 wrap-break-word">{booking.turf?.name || 'N/A'}</span>
        </p>
        <p className="leading-relaxed">
          <span className="font-semibold text-[#1E3A5F] inline-block min-w-[80px]">📅 Date:</span>{' '}
          <span className="text-gray-700">{new Date(booking.booking_date).toLocaleDateString()}</span>
        </p>
        <p className="wrap-break-word leading-relaxed">
          <span className="font-semibold text-[#1E3A5F] inline-block min-w-[80px]">⏰ Time:</span>{' '}
          <span className="text-gray-700 wrap-break-word">{formatTimeSlots(booking.slots || [])}</span>
        </p>
        <p className="leading-relaxed">
          <span className="font-semibold text-[#1E3A5F] inline-block min-w-[80px]">💰 Total:</span>{' '}
          <span className="text-[#FF6B35] font-bold text-sm sm:text-base">₹{booking.total_amount.toLocaleString()}</span>
        </p>
        {booking.payments && booking.payments.length > 0 && (
          <p className="leading-relaxed">
            <span className="font-semibold text-[#1E3A5F] inline-block min-w-[80px]">💳 Payment:</span>{' '}
            <span className={`font-semibold text-xs sm:text-sm ${
              booking.payments[0].payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {booking.payments[0].payment_status === 'completed' ? '✅ Paid' : '⏳ Pending'}
            </span>
          </p>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-2">
        <Link
          href={`/bookings/${booking.id}`}
          className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg text-[#1E3A5F] bg-[#1E3A5F]/10 hover:bg-[#1E3A5F]/20 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
        >
          View details
        </Link>
        <CancelBookingButton bookingId={booking.id} bookingStatus={booking.booking_status} variant="button" />
      </div>
    </div>
  );

  const BookingRow = ({ booking }: { booking: Booking }) => (
    <li key={booking.id} className="hover:bg-[#FF6B35]/5 transition-colors">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F]">
                Booking #{booking.booking_id}
              </h3>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 ${
                  booking.booking_status === 'confirmed'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : booking.booking_status === 'pending_payment'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    : booking.booking_status === 'completed'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-red-100 text-red-800 border-red-300'
                }`}
              >
                {booking.booking_status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-700 space-y-1.5">
              <div>
                <p>
                  <span className="font-semibold text-[#1E3A5F]">📍 Location:</span>{' '}
                  <span className="text-gray-700">{booking.turf?.location?.name}</span>
                </p>
                {booking.turf?.location && (
                  <a
                    href={getGoogleMapsUrl(booking.turf.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-[#FF6B35] hover:text-[#E55A2B] transition-colors group cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Get Directions</span>
                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
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
                <span className="text-gray-700">{formatTimeSlots(booking.slots || [])}</span>
              </p>
              <p>
                <span className="font-semibold text-[#1E3A5F]">💰 Total Amount:</span>{' '}
                <span className="text-[#FF6B35] font-bold">₹{booking.total_amount.toLocaleString()}</span>
              </p>
              {booking.payments && booking.payments.length > 0 && (
                <p>
                  <span className="font-semibold text-[#1E3A5F]">💳 Payment Status:</span>{' '}
                  <span className={`font-semibold ${
                    booking.payments[0].payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {booking.payments[0].payment_status === 'completed' ? '✅ Paid' : '⏳ Pending'}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3 sm:mt-0 sm:ml-4 shrink-0">
            <Link
              href={`/bookings/${booking.id}`}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-[#1E3A5F] bg-[#1E3A5F]/10 hover:bg-[#1E3A5F]/20 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
            >
              View details
            </Link>
            <CancelBookingButton bookingId={booking.id} bookingStatus={booking.booking_status} variant="button" />
          </div>
        </div>
      </div>
    </li>
  );

  if (view === 'row') {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#1E3A5F]/10">
        <ul className="divide-y divide-gray-200">
          {bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </ul>
      </div>
    );
  }

  const gridClasses = {
    'grid-4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    'grid-2': 'grid-cols-1 sm:grid-cols-2',
    'grid-1': 'grid-cols-1 max-w-2xl mx-auto',
  };

  return (
    <div className={`grid ${gridClasses[view]} gap-3 sm:gap-4 md:gap-5 lg:gap-6`}>
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}


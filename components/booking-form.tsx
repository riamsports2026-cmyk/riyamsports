'use client';

import { createBooking } from '@/lib/actions/bookings';
import { TurfWithDetails, Location, Service } from '@/lib/types';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { calculateTotalAmount, calculateAdvanceAmount, calculateFullPaymentDiscount, calculateFullPaymentAmount } from '@/lib/utils/booking';
import { DatePickerInput } from '@/components/ui/date-picker';
import { Loader } from '@/components/ui/loader';

function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

interface BookingFormProps {
  turf: TurfWithDetails;
  location: Location;
  service: Service;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full py-4 px-6 border border-transparent rounded-xl shadow-xl text-base sm:text-lg font-bold text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transform transition-all active:scale-95 disabled:active:scale-100"
    >
      {pending ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        '🚀 Book Now'
      )}
    </button>
  );
}

export function BookingForm({ turf, location, service }: BookingFormProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [availableSlots, setAvailableSlots] = useState<number[]>([]);
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<'advance' | 'full' | ''>('');

  const [state, formAction] = useActionState(createBooking, null);

  useEffect(() => {
    if (state?.success) {
      router.push(`/bookings/${state.bookingId}/payment`);
    }
  }, [state, router]);

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/turfs/${turf.id}/slots?date=${selectedDate}`
        );
        const data = await response.json();
        if (data.slots) {
          setAvailableSlots(data.slots);
          setSelectedHours([]);
        }
      } catch (error) {
        console.error('Failed to fetch slots:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSlots();
  }, [turf.id, selectedDate]);

  const totalAmount = calculateTotalAmount(turf.pricing, selectedHours);
  const advanceAmount = calculateAdvanceAmount(totalAmount);
  const fullPaymentDiscount = calculateFullPaymentDiscount(totalAmount);
  const fullPaymentAmount = calculateFullPaymentAmount(totalAmount);

  const handleHourToggle = (hour: number) => {
    setSelectedHours((prev) =>
      prev.includes(hour)
        ? prev.filter((h) => h !== hour)
        : [...prev, hour].sort()
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 border-2 border-[#1E3A5F]/10 hover:border-[#FF6B35]/30 transition-all">
      <div className="mb-6 pb-4 border-b-2 border-[#FF6B35]/20">
        <h2 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent mb-2">{turf.name}</h2>
        <p className="text-sm text-[#1E3A5F] font-medium">{location.name} • {service.name}</p>
      </div>

      <form action={formAction}>
        <input type="hidden" name="turf_id" value={turf.id} />

        <div className="space-y-6">
          <div className="bg-linear-to-br from-[#FF6B35]/10 to-[#1E3A5F]/10 border-2 border-[#FF6B35]/30 rounded-xl p-4 sm:p-5 shadow-md">
            <label
              htmlFor="booking_date"
              className="block text-sm font-bold text-[#1E3A5F] mb-3"
            >
              📅 Select Date <span className="text-red-500">*</span>
            </label>
            <DatePickerInput
              id="booking_date"
              name="booking_date"
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={new Date()}
              placeholder="Select booking date"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              ⏰ Select Time Slots <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="py-8">
                <Loader size="md" label="Loading available slots..." />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600 font-medium">No slots available for this date.</p>
                <p className="text-sm text-gray-500 mt-1">Please try another date.</p>
              </div>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 px-1">
                  Tap on available time slots to select. Grayed out slots are booked or unavailable.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-2.5 md:gap-3">
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                    const isAvailable = availableSlots.includes(hour);
                    const isSelected = selectedHours.includes(hour);
                    const priceData = turf.pricing.find((p) => p.hour === hour);
                    const price = priceData?.price || 0;
                    const hasPricing = priceData !== undefined;
                    
                    // Check if this is a past hour for today's date
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const bookingDate = new Date(selectedDate);
                    bookingDate.setHours(0, 0, 0, 0);
                    const isToday = bookingDate.getTime() === today.getTime();
                    
                    // If it's today, only allow hours greater than current hour
                    // This means if it's 11:04 AM (hour 11), hour 12 (12 PM) will be available
                    const isPastHour = isToday && hour <= new Date().getHours();
                    
                    const isDisabled = !isAvailable || price === 0 || isPastHour;

                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => isAvailable && price > 0 && handleHourToggle(hour)}
                        disabled={isDisabled}
                        className={`relative px-2.5 py-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 transform active:scale-95 min-h-[70px] sm:min-h-[80px] md:min-h-[90px] flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-linear-to-br from-[#FF6B35] to-[#FF8C61] text-white border-[#FF6B35] shadow-xl shadow-[#FF6B35]/40 scale-105 ring-2 sm:ring-4 ring-[#FF6B35]/20 cursor-pointer'
                            : isAvailable && price > 0
                            ? 'bg-white text-[#1E3A5F] border-[#1E3A5F]/30 hover:border-[#FF6B35] hover:bg-linear-to-br hover:from-[#FF6B35]/10 hover:to-[#1E3A5F]/10 hover:shadow-lg active:scale-95 cursor-pointer'
                            : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                        }`}
                        title={
                          isDisabled
                            ? isPastHour
                              ? 'Cannot book past time slots'
                              : !isAvailable
                              ? 'This slot is already booked'
                              : price === 0
                              ? 'Pricing not set for this hour'
                              : 'Not available'
                            : `Select ${formatHour(hour)} to ${formatHour((hour + 1) % 24)} - ₹${price}`
                        }
                      >
                        {isSelected && (
                          <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <div className="flex flex-col items-center justify-center w-full space-y-1">
                          <div className={`font-bold text-[11px] sm:text-xs md:text-sm leading-tight text-center whitespace-nowrap ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {formatHour(hour)} - {formatHour((hour + 1) % 24)}
                          </div>
                          {hasPricing && price > 0 && (
                            <div className={`text-[11px] sm:text-xs md:text-sm font-bold whitespace-nowrap ${isSelected ? 'text-white' : 'text-[#FF6B35]'}`}>
                              ₹{price}
                            </div>
                          )}
                          {hasPricing && price === 0 && (
                            <div className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">N/A</div>
                          )}
                          {!hasPricing && (
                            <div className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">—</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <input
            type="hidden"
            name="selected_hours"
            value={JSON.stringify(selectedHours)}
          />

          {selectedHours.length > 0 && (
            <div className="border-t-2 border-gray-200 pt-6 space-y-6">
              <div className="bg-linear-to-br from-[#1E3A5F] via-[#2D4F7C] to-[#1E3A5F] rounded-xl p-4 sm:p-5 border-2 border-[#FF6B35]/30 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                  <span className="mr-2">💰</span> Pricing Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-white/20">
                    <span className="text-sm sm:text-base text-white/90 font-medium">Total Amount:</span>
                    <span className="text-lg sm:text-xl font-bold text-white">₹{totalAmount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm sm:text-base text-white/80">Advance (30%):</span>
                    <span className="text-base sm:text-lg font-semibold text-[#FF8C61]">₹{advanceAmount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm sm:text-base text-white/80">Full Payment (10% off):</span>
                    <span className="text-base sm:text-lg font-semibold text-[#FF6B35]">₹{fullPaymentAmount}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  💳 Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentType === 'advance' 
                      ? 'border-[#1E3A5F] bg-linear-to-br from-[#1E3A5F]/10 to-[#2D4F7C]/10 shadow-lg ring-2 ring-[#1E3A5F]/20' 
                      : 'border-gray-200 bg-white hover:border-[#1E3A5F] hover:bg-[#1E3A5F]/5'
                  }`}>
                    <input
                      type="radio"
                      name="payment_type"
                      value="advance"
                      checked={paymentType === 'advance'}
                      onChange={(e) => setPaymentType(e.target.value as 'advance')}
                      className="mt-1 h-5 w-5 text-[#1E3A5F] focus:ring-[#1E3A5F] cursor-pointer"
                      required
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-base font-bold text-[#1E3A5F]">Advance Payment</div>
                      <div className="text-sm text-gray-700 mt-1">Pay 30% now (₹{advanceAmount})</div>
                    </div>
                  </label>
                  <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentType === 'full' 
                      ? 'border-[#FF6B35] bg-linear-to-br from-[#FF6B35]/10 to-[#FF8C61]/10 shadow-lg ring-2 ring-[#FF6B35]/20' 
                      : 'border-gray-200 bg-white hover:border-[#FF6B35] hover:bg-[#FF6B35]/5'
                  }`}>
                    <input
                      type="radio"
                      name="payment_type"
                      value="full"
                      checked={paymentType === 'full'}
                      onChange={(e) => setPaymentType(e.target.value as 'full')}
                      className="mt-1 h-5 w-5 text-[#FF6B35] focus:ring-[#FF6B35] cursor-pointer"
                      required
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-base font-bold text-[#FF6B35]">Full Payment</div>
                      <div className="text-sm text-gray-700 mt-1">Pay full amount with 10% discount (₹{fullPaymentAmount})</div>
                      <div className="text-xs text-[#FF6B35] font-bold mt-1">💰 Save ₹{totalAmount - fullPaymentAmount}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {state?.error && (
            <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800">{state.error}</p>
              </div>
            </div>
          )}

          <SubmitButton disabled={selectedHours.length === 0 || !paymentType} />
        </div>
      </form>
    </div>
  );
}


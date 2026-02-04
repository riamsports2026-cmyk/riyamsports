'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DatePickerInput } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

export function AdminBookingFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  // Initialize from URL params
  useEffect(() => {
    setStartDate(searchParams.get('start_date') || '');
    setEndDate(searchParams.get('end_date') || '');
    setStartTime(searchParams.get('start_time') || '');
    setEndTime(searchParams.get('end_time') || '');
    setStatus(searchParams.get('status') || '');
    setPaymentStatus(searchParams.get('payment_status') || '');
  }, [searchParams]);

  const handleFilter = () => {
    const params = new URLSearchParams();
    let s = startDate;
    let e = endDate;
    let st = startTime;
    let et = endTime;
    if (s && e && s > e) [s, e] = [e, s];
    if (st && et && st > et) [st, et] = [et, st];
    if (s) params.set('start_date', s);
    if (e) params.set('end_date', e);
    if (st) params.set('start_time', st);
    if (et) params.set('end_time', et);
    if (status) params.set('status', status);
    if (paymentStatus) params.set('payment_status', paymentStatus);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setStatus('');
    setPaymentStatus('');
    router.push(pathname);
  };

  return (
    <div className="mb-6 bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-[#1E3A5F]/10">
      <h3 className="text-base sm:text-lg font-bold text-[#1E3A5F] mb-4 flex items-center">
        <span className="mr-2">🔍</span> Filter Bookings
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-xs font-semibold text-[#1E3A5F] mb-1.5">
            Start Date
          </label>
          <DatePickerInput
            id="start_date"
            value={startDate}
            onChange={setStartDate}
            placeholder="Select start date"
            className="w-full h-[42px] px-3 py-2.5 border-2 border-[#1E3A5F]/20 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] bg-white font-medium text-[#1E3A5F]"
            maxDate={endDate ? new Date(endDate + 'T23:59:59') : undefined}
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-xs font-semibold text-[#1E3A5F] mb-1.5">
            End Date
          </label>
          <DatePickerInput
            id="end_date"
            value={endDate}
            onChange={setEndDate}
            placeholder="Select end date"
            className="w-full h-[42px] px-3 py-2.5 border-2 border-[#1E3A5F]/20 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] bg-white font-medium text-[#1E3A5F]"
            minDate={startDate ? new Date(startDate + 'T00:00:00') : undefined}
          />
        </div>
        <div>
          <label htmlFor="start_time" className="block text-xs font-semibold text-[#1E3A5F] mb-1.5">
            Start Time
          </label>
          <TimePicker
            id="start_time"
            value={startTime}
            onChange={setStartTime}
            placeholder="Select start time"
            className="w-full h-[42px] px-3 py-2.5 border-2 border-[#1E3A5F]/20 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] bg-white font-medium text-[#1E3A5F]"
            max={endTime || undefined}
          />
        </div>
        <div>
          <label htmlFor="end_time" className="block text-xs font-semibold text-[#1E3A5F] mb-1.5">
            End Time
          </label>
          <TimePicker
            id="end_time"
            value={endTime}
            onChange={setEndTime}
            placeholder="Select end time"
            className="w-full h-[42px] px-3 py-2.5 border-2 border-[#1E3A5F]/20 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] bg-white font-medium text-[#1E3A5F]"
            min={startTime || undefined}
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-xs font-semibold text-[#1E3A5F] mb-1.5">
            Booking Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full h-[42px] px-3 py-2.5 border-2 border-[#1E3A5F]/20 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] cursor-pointer bg-white font-medium text-[#1E3A5F]"
            style={{ maxHeight: 'none', overflow: 'visible' }}
          >
            <option value="">All</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label htmlFor="payment_status" className="block text-xs font-semibold text-[#1E3A5F] mb-1.5">
            Payment Status
          </label>
          <select
            id="payment_status"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full h-[42px] px-3 py-2.5 border-2 border-[#1E3A5F]/20 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] cursor-pointer bg-white font-medium text-[#1E3A5F]"
            style={{ maxHeight: 'none', overflow: 'visible' }}
          >
            <option value="">All</option>
            <option value="pending_payment">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleFilter}
          className="px-4 py-2.5 bg-linear-to-r from-[#FF6B35] to-[#FF8C61] text-white text-sm font-medium rounded-xl hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 cursor-pointer transition-all shadow-lg hover:shadow-xl"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2.5 bg-white border-2 border-[#1E3A5F]/30 text-[#1E3A5F] text-sm font-medium rounded-xl hover:bg-[#1E3A5F]/5 hover:border-[#FF6B35] focus:outline-none focus:ring-4 focus:ring-[#1E3A5F]/20 cursor-pointer transition-all"
        >
          Clear
        </button>
      </div>
    </div>
  );
}


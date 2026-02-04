'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DatePickerInput } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

export function BookingFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Initialize from URL params
  useEffect(() => {
    setStartDate(searchParams.get('start_date') || '');
    setEndDate(searchParams.get('end_date') || '');
    setStartTime(searchParams.get('start_time') || '');
    setEndTime(searchParams.get('end_time') || '');
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
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    router.push(pathname);
  };

  return (
    <div className="mb-6 bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-[#1E3A5F]/10">
      <h3 className="text-base sm:text-lg font-bold text-[#1E3A5F] mb-4 flex items-center">
        <span className="mr-2">🔍</span> Filter Bookings
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-xs font-semibold text-[#1E3A5F] mb-1.5">
            Start Date
          </label>
          <DatePickerInput
            id="start_date"
            value={startDate}
            onChange={setStartDate}
            placeholder="Select start date"
            className="w-full px-3 py-2.5 border-2 border-[#1E3A5F]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] font-medium"
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
            className="w-full px-3 py-2.5 border-2 border-[#1E3A5F]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] font-medium"
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
            className="w-full px-3 py-2.5 border-2 border-[#1E3A5F]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] font-medium"
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
            className="w-full px-3 py-2.5 border-2 border-[#1E3A5F]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] font-medium"
            min={startTime || undefined}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleFilter}
          className="px-4 py-2 bg-linear-to-r from-[#FF6B35] to-[#FF8C61] text-white text-sm font-medium rounded-md hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 cursor-pointer transition-all shadow-lg hover:shadow-xl"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
}


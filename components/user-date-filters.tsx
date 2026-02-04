'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DatePickerInput } from '@/components/ui/date-picker';

type Role = { id: string; name: string };

export function UserDateFilters({ roles = [] }: { roles?: Role[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [role, setRole] = useState('');

  // Initialize from URL params
  useEffect(() => {
    setStartDate(searchParams.get('start_date') || '');
    setEndDate(searchParams.get('end_date') || '');
    setRole(searchParams.get('role') || '');
  }, [searchParams]);

  const buildParams = () => {
    const params = new URLSearchParams();
    const sortBy = searchParams.get('sort_by');
    const sortOrder = searchParams.get('sort_order');
    if (sortBy) params.set('sort_by', sortBy);
    if (sortOrder) params.set('sort_order', sortOrder);
    let s = startDate;
    let e = endDate;
    if (s && e && s > e) {
      [s, e] = [e, s];
    }
    if (s) params.set('start_date', s);
    if (e) params.set('end_date', e);
    if (role) params.set('role', role);
    params.delete('page');
    return params;
  };

  const handleFilter = () => {
    router.push(`${pathname}?${buildParams().toString()}`);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setRole('');
    const params = new URLSearchParams();
    const sortBy = searchParams.get('sort_by');
    const sortOrder = searchParams.get('sort_order');
    if (sortBy) params.set('sort_by', sortBy);
    if (sortOrder) params.set('sort_order', sortOrder);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-6 bg-white p-4 sm:p-6 rounded-xl shadow-lg border-2 border-[#1E3A5F]/10">
      <h3 className="text-base sm:text-lg font-bold text-[#1E3A5F] mb-4 flex items-center">
        <span className="mr-2">🔍</span> Filter Users
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="role" className="block text-xs font-semibold text-[#1E3A5F] mb-1.5">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-[#1E3A5F]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] font-medium bg-white"
          >
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
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
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleFilter}
          className="px-4 py-2.5 bg-linear-to-r from-[#FF6B35] to-[#FF8C61] text-white rounded-lg text-sm font-semibold hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/30 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2.5 bg-white border-2 border-[#1E3A5F]/30 text-[#1E3A5F] rounded-lg text-sm font-semibold hover:bg-[#1E3A5F]/5 hover:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
}


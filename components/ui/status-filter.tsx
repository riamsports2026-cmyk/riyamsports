'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface StatusFilterProps {
  label?: string;
  className?: string;
}

export function StatusFilter({ label = 'Status', className = '' }: StatusFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get('is_active');

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === 'all') {
      params.delete('is_active');
    } else {
      params.set('is_active', value);
    }
    
    // Reset to page 1 when filtering
    params.delete('page');
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={className}>
      <select
        value={currentStatus || 'all'}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm border-2 border-[#1E3A5F]/20 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] cursor-pointer bg-white font-medium text-[#1E3A5F]"
        style={{ maxHeight: 'none', overflow: 'visible' }}
      >
        <option value="all">All {label}</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
    </div>
  );
}




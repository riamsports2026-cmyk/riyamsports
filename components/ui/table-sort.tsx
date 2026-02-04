'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface TableSortProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  field: string;
  label: string;
  className?: string;
}

export function TableSort({ sortBy, sortOrder, field, label, className = '' }: TableSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = sortBy === field;
  const isAsc = isActive && sortOrder === 'asc';

  const handleSort = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (isActive && sortOrder === 'asc') {
      // Switch to descending
      params.set('sort_by', field);
      params.set('sort_order', 'desc');
    } else if (isActive && sortOrder === 'desc') {
      // Remove sorting
      params.delete('sort_by');
      params.delete('sort_order');
    } else {
      // Set ascending
      params.set('sort_by', field);
      params.set('sort_order', 'asc');
    }

    // Reset to page 1 when sorting changes
    params.delete('page');
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <button
      onClick={handleSort}
      className={`flex items-center gap-1 font-semibold text-white uppercase tracking-wider hover:text-[#FF6B35] transition-colors cursor-pointer ${className}`}
    >
      {label}
      <span className="flex flex-col">
        <svg
          className={`w-3 h-3 ${isActive && isAsc ? 'text-[#FF6B35]' : 'text-white/50'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12z" />
        </svg>
        <svg
          className={`w-3 h-3 ${isActive && !isAsc ? 'text-[#FF6B35]' : 'text-white/50'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
        </svg>
      </span>
    </button>
  );
}




'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SearchFilterProps {
  placeholder?: string;
  className?: string;
}

export function SearchFilter({ placeholder = 'Search...', className = '' }: SearchFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    if (currentSearch !== searchTerm) {
      setSearchTerm(currentSearch);
    }
  }, [searchParams]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const params = new URLSearchParams(searchParams.toString());
    
    if (value.trim()) {
      params.set('search', value.trim());
    } else {
      params.delete('search');
    }
    
    // Reset to page 1 when searching
    params.delete('page');
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-[#1E3A5F]/20 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] bg-white font-medium text-[#1E3A5F]"
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
}




'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';

export type ViewMode = 'row' | 'grid-4' | 'grid-2' | 'grid-1';

interface ViewToggleProps {
  defaultView?: ViewMode;
}

export function ViewToggle({ defaultView = 'row' }: ViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewMode>(defaultView);

  // Initialize from URL params
  useEffect(() => {
    const viewParam = searchParams.get('view') as ViewMode;
    if (viewParam && ['row', 'grid-4', 'grid-2', 'grid-1'].includes(viewParam)) {
      setView(viewParam);
    }
  }, [searchParams]);

  const handleViewChange = (newView: ViewMode) => {
    setView(newView);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', newView);
    params.delete('page'); // Reset to page 1 when changing view
    router.push(`${pathname}?${params.toString()}`);
  };

  const views: { mode: ViewMode; icon: React.ReactElement; label: string }[] = [
    {
      mode: 'row',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      label: 'Row View',
    },
    {
      mode: 'grid-4',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      label: '4 Cards',
    },
    {
      mode: 'grid-2',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      label: '2 Cards',
    },
    {
      mode: 'grid-1',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      label: 'Single Card',
    },
  ];

  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg border-2 border-[#1E3A5F]/20 p-1 w-full sm:w-auto">
      <span className="text-xs font-semibold text-[#1E3A5F] px-1 sm:px-2 hidden sm:inline whitespace-nowrap">View:</span>
      <div className="flex items-center gap-1 flex-1 sm:flex-initial justify-between sm:justify-start">
        {views.map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => handleViewChange(mode)}
            className={`p-1.5 sm:p-2 rounded-md transition-all cursor-pointer flex-1 sm:flex-initial min-w-[44px] sm:min-w-0 ${
              view === mode
                ? 'bg-linear-to-r from-[#FF6B35] to-[#FF8C61] text-white shadow-md'
                : 'text-[#1E3A5F] hover:bg-[#FF6B35]/10 hover:text-[#FF6B35]'
            }`}
            title={label}
            aria-label={label}
          >
            <span className="flex items-center justify-center">
              {icon}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}


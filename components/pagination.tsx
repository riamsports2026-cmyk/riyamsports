'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export function Pagination({ currentPage, totalPages, totalItems, itemsPerPage }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const startItem = useMemo(() => (currentPage - 1) * itemsPerPage + 1, [currentPage, itemsPerPage]);
  const endItem = useMemo(() => Math.min(currentPage * itemsPerPage, totalItems), [currentPage, itemsPerPage, totalItems]);

  const updatePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t-2 border-[#1E3A5F]/10 sm:px-6 rounded-b-xl">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => updatePage(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border-2 border-[#1E3A5F]/30 text-sm font-semibold rounded-lg text-[#1E3A5F] bg-white hover:bg-[#FF6B35]/10 hover:border-[#FF6B35] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Previous
        </button>
        <button
          onClick={() => updatePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border-2 border-[#1E3A5F]/30 text-sm font-semibold rounded-lg text-[#1E3A5F] bg-white hover:bg-[#FF6B35]/10 hover:border-[#FF6B35] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[#1E3A5F] font-medium">
            Showing <span className="font-bold text-[#FF6B35]">{startItem}</span> to{' '}
            <span className="font-bold text-[#FF6B35]">{endItem}</span> of{' '}
            <span className="font-bold text-[#FF6B35]">{totalItems}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-lg shadow-md -space-x-px" aria-label="Pagination">
            <button
              onClick={() => updatePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 rounded-l-lg border-2 border-[#1E3A5F]/30 bg-white text-sm font-semibold text-[#1E3A5F] hover:bg-[#FF6B35]/10 hover:border-[#FF6B35] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && updatePage(page)}
                disabled={page === '...'}
                className={`relative inline-flex items-center px-4 py-2 border-2 text-sm font-semibold transition-all ${
                  page === currentPage
                    ? 'z-10 bg-linear-to-r from-[#FF6B35] to-[#FF8C61] border-[#FF6B35] text-white shadow-lg cursor-pointer'
                    : page === '...'
                    ? 'bg-white border-[#1E3A5F]/30 text-gray-500 cursor-default'
                    : 'bg-white border-[#1E3A5F]/30 text-[#1E3A5F] hover:bg-[#FF6B35]/10 hover:border-[#FF6B35] cursor-pointer'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => updatePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 py-2 rounded-r-lg border-2 border-[#1E3A5F]/30 bg-white text-sm font-semibold text-[#1E3A5F] hover:bg-[#FF6B35]/10 hover:border-[#FF6B35] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-gray-600">An error occurred while processing your request.</p>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 text-white rounded-md bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] cursor-pointer shadow-lg hover:shadow-xl transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}



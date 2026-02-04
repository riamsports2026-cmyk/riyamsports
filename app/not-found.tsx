import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-gray-600">Page not found</p>
        <Link
          href="/book"
          className="mt-4 inline-block text-[#FF6B35] hover:text-[#E55A2B] cursor-pointer"
        >
          Go to booking page
        </Link>
      </div>
    </div>
  );
}



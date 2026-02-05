import Link from 'next/link';
import { headers } from 'next/headers';

export async function Footer() {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  if (pathname.startsWith('/staff') || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-[#1E3A5F]/10 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/terms" className="text-[#1E3A5F] hover:text-[#FF6B35] font-medium transition-colors">
              Terms & Conditions
            </Link>
            <span className="hidden sm:inline text-gray-300">|</span>
            <Link href="/privacy" className="text-[#1E3A5F] hover:text-[#FF6B35] font-medium transition-colors">
              Privacy Policy
            </Link>
            <span className="hidden sm:inline text-gray-300">|</span>
            <Link href="/refund-policy" className="text-[#1E3A5F] hover:text-[#FF6B35] font-medium transition-colors">
              Refund Policy
            </Link>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm">© {new Date().getFullYear()} RIAM Sports</p>
        </div>
      </div>
    </footer>
  );
}

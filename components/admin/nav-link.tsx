'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function NavLink({ href, children, className = '' }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`relative inline-flex items-center px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap border-b-2 ${
        isActive
          ? 'text-white bg-white/10 border-[#FF6B35]'
          : 'text-white/90 hover:text-white hover:bg-white/10 border-transparent hover:border-[#FF6B35]'
      } ${className}`}
    >
      {children}
    </Link>
  );
}





'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface AdminNavLinksProps {
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageLocations: boolean;
  canManageServices: boolean;
  canManageBookings: boolean;
}

export function AdminNavLinks({
  canManageUsers,
  canManageRoles,
  canManageLocations,
  canManageServices,
  canManageBookings,
}: AdminNavLinksProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) => {
    const active = isActive(href);
    return `relative inline-flex items-center px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap border-b-2 cursor-pointer ${
      active
        ? 'text-white bg-[#FF6B35]/20 border-[#FF6B35] shadow-sm'
        : 'text-white/90 hover:text-white hover:bg-white/10 border-transparent hover:border-[#FF6B35]/50'
    }`;
  };

  return (
    <>
      <Link href="/admin" className={linkClass('/admin')}>
        📊 Dashboard
      </Link>
      {canManageUsers && (
        <Link href="/admin/users" className={linkClass('/admin/users')}>
          👥 Users
        </Link>
      )}
      {canManageRoles && (
        <Link href="/admin/roles" className={linkClass('/admin/roles')}>
          🎭 Roles
        </Link>
      )}
      {canManageLocations && (
        <Link href="/admin/locations" className={linkClass('/admin/locations')}>
          📍 Locations
        </Link>
      )}
      {canManageServices && (
        <Link href="/admin/services" className={linkClass('/admin/services')}>
          ⚽ Sports/Services
        </Link>
      )}
      {canManageBookings && (
        <Link href="/admin/bookings" className={linkClass('/admin/bookings')}>
          📅 Bookings
        </Link>
      )}
      <Link href="/admin/payment-gateways" className={linkClass('/admin/payment-gateways')}>
        💳 Payment Gateways
      </Link>
      {/* 🔧 Debug Staff — commented out
      <Link href="/admin/debug-staff" className={linkClass('/admin/debug-staff')}>
        🔧 Debug Staff
      </Link>
      */}
    </>
  );
}



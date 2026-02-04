'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface StaffNavLinksProps {
  canManageBookings: boolean;
  canViewBookings: boolean;
  canManageLocations: boolean;
  canManageServices: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
}

export function StaffNavLinks({
  canManageBookings,
  canViewBookings,
  canManageLocations,
  canManageServices,
  canManageUsers,
  canManageRoles,
}: StaffNavLinksProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/staff') return pathname === '/staff';
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) => {
    const active = isActive(href);
    return `inline-flex items-center px-3 py-2 sm:px-1 sm:pt-4 border-b-2 text-sm font-semibold transition-colors rounded-t-lg sm:rounded-none cursor-pointer ${
      active
        ? 'text-[#FF6B35] border-[#FF6B35] bg-[#FF6B35]/5'
        : 'border-transparent text-[#1E3A5F] hover:text-[#FF6B35] hover:border-[#FF6B35]'
    }`;
  };

  return (
    <>
      {(canManageBookings || (canViewBookings && !canManageBookings)) && (
        <Link href="/staff" className={linkClass('/staff')}>
          {canManageBookings ? '📅 Bookings' : '👁️ View Bookings'}
        </Link>
      )}
      {canManageLocations && (
        <Link href="/staff/locations" className={linkClass('/staff/locations')}>
          📍 Locations
        </Link>
      )}
      {canManageServices && (
        <Link href="/staff/services" className={linkClass('/staff/services')}>
          ⚽ Services
        </Link>
      )}
      {canManageUsers && (
        <Link href="/staff/users" className={linkClass('/staff/users')}>
          👥 Users
        </Link>
      )}
      {canManageRoles && (
        <Link href="/staff/roles" className={linkClass('/staff/roles')}>
          🎭 Roles
        </Link>
      )}
      <Link href="/staff/permissions" className={linkClass('/staff/permissions')}>
        🔐 Permissions
      </Link>
    </>
  );
}

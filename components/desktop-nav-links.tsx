'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SafeImage } from '@/components/ui/safe-image';

interface DesktopNavLinksProps {
  canBook: boolean;
  canViewBookings: boolean;
  userIsStaff: boolean;
  userIsAdmin: boolean;
  profile: { full_name?: string | null; profile_image?: string | null } | null;
  userEmail?: string | null;
}

export function DesktopNavLinks({
  canBook,
  canViewBookings,
  userIsStaff,
  userIsAdmin,
  profile,
  userEmail,
}: DesktopNavLinksProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/profile') return pathname === '/profile' || pathname.startsWith('/profile/');
    if (href === '/admin') return pathname === '/admin' || pathname.startsWith('/admin/');
    if (href === '/book') return pathname === '/book' || pathname.startsWith('/book/');
    if (href === '/bookings') return pathname === '/bookings' || pathname.startsWith('/bookings/');
    return pathname === href || pathname.startsWith(href + '/');
  };

  const linkClass = (href: string) => {
    const active = isActive(href);
    return `px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
      active
        ? 'text-[#FF6B35] bg-[#FF6B35]/10'
        : 'text-[#1E3A5F] hover:text-[#FF6B35] hover:bg-[#FF6B35]/10'
    }`;
  };

  return (
    <div className="hidden sm:flex items-center gap-4">
      {canBook && !userIsStaff && (
        <Link href="/book" className={linkClass('/book')}>
          Book
        </Link>
      )}
      {canViewBookings && !userIsStaff && (
        <Link href="/bookings" className={linkClass('/bookings')}>
          My Bookings
        </Link>
      )}
      {userIsAdmin && (
        <Link href="/admin" className={linkClass('/admin')}>
          Admin
        </Link>
      )}
      {profile && (
        <Link
          href="/profile"
          className={`flex items-center gap-2 ${linkClass('/profile')}`}
        >
          {profile.profile_image ? (
            <div className="h-8 w-8 rounded-full border-2 border-[#FF6B35]/30 overflow-hidden shrink-0">
              <SafeImage
                src={profile.profile_image}
                alt={profile.full_name || userEmail || 'Profile'}
                className="h-full w-full object-cover"
                fill
              />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-linear-to-br from-[#1E3A5F] to-[#FF6B35] flex items-center justify-center border-2 border-[#FF6B35]/30 text-white text-xs font-bold shrink-0">
              {(profile.full_name || userEmail || 'U')[0].toUpperCase()}
            </div>
          )}
          <span>{profile.full_name || userEmail}</span>
        </Link>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/actions/auth';
import { SafeImage } from '@/components/ui/safe-image';

interface MobileMenuProps {
  canBook: boolean;
  canViewBookings: boolean;
  userIsAdmin: boolean;
  userIsStaff: boolean;
  profileName?: string;
  userEmail?: string;
  profileImage?: string | null;
}

export function MobileMenu({
  canBook,
  canViewBookings,
  userIsAdmin,
  userIsStaff,
  profileName,
  userEmail,
  profileImage,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Ensure component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === '/profile') return pathname === '/profile' || pathname.startsWith('/profile/');
    if (href === '/admin') return pathname === '/admin' || pathname.startsWith('/admin/');
    if (href === '/staff') return pathname === '/staff' || pathname.startsWith('/staff/');
    if (href === '/book') return pathname === '/book' || pathname.startsWith('/book/');
    if (href === '/bookings') return pathname === '/bookings' || pathname.startsWith('/bookings/');
    return pathname === href || pathname.startsWith(href + '/');
  };

  const menuItems = [
    ...(canBook && !userIsStaff ? [{ href: '/book', label: '📅 Book Turf', icon: '📅' }] : []),
    ...(canViewBookings && !userIsStaff ? [{ href: '/bookings', label: '📋 My Bookings', icon: '📋' }] : []),
    ...(userIsAdmin ? [{ href: '/admin', label: '⚙️ Admin Panel', icon: '⚙️' }] : []),
    ...(userIsStaff && !userIsAdmin ? [{ href: '/staff', label: '👔 Staff Portal', icon: '👔' }] : []),
    { href: '/profile', label: '👤 Profile', icon: '👤' },
  ];

  const menuContent = mounted ? (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-9998 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slider Menu - Always rendered for smooth animation */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-9999 transform transition-transform duration-300 ease-in-out sm:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-linear-to-r from-[#1E3A5F] to-[#2D4F7C] px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="/Riamlogo.png" 
                  alt="RIAM Sports Arena" 
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <div className="text-lg font-bold text-white">RIAM Sports</div>
                  <div className="text-xs text-[#FF6B35] font-semibold">ARENA</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-[#FF6B35] transition-colors p-2 cursor-pointer"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {profileName && (
              <div className="flex items-center gap-3 text-white">
                {profileImage ? (
                  <div className="h-12 w-12 rounded-full border-2 border-[#FF6B35]/30 overflow-hidden shrink-0">
                    <SafeImage
                      src={profileImage}
                      alt={profileName}
                      className="h-full w-full object-cover"
                      fill
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-linear-to-br from-[#FF6B35] to-[#1E3A5F] flex items-center justify-center border-2 border-[#FF6B35]/30 text-white text-lg font-bold shrink-0">
                    {profileName[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{profileName}</div>
                  {userEmail && <div className="text-white/80 text-xs truncate">{userEmail}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4">
            {menuItems.length > 0 ? (
              <nav className="space-y-1 px-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                      isActive(item.href)
                        ? 'bg-linear-to-r from-[#FF6B35]/20 to-[#1E3A5F]/20 text-[#FF6B35] font-semibold border-l-4 border-[#FF6B35]'
                        : 'text-[#1E3A5F] hover:bg-[#FF6B35]/10 hover:text-[#FF6B35]'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label.replace(/^[^\s]+\s/, '')}</span>
                  </Link>
                ))}
              </nav>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <p className="text-sm">No menu items available</p>
              </div>
            )}
          </div>

          {/* Footer - Sign Out */}
          <div className="border-t border-gray-200 p-4">
            <form action={signOut}>
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-linear-to-r from-[#FF6B35] to-[#FF8C61] text-white rounded-lg font-semibold hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all shadow-lg cursor-pointer"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden p-2 rounded-lg text-[#1E3A5F] hover:bg-[#FF6B35]/10 transition-colors relative z-50 cursor-pointer"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Render menu in portal to body */}
      {mounted && createPortal(menuContent, document.body)}
    </>
  );
}


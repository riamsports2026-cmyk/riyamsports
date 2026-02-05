import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions/auth';
import Link from 'next/link';
import { getProfile } from '@/lib/actions/profile';
import { isAdmin, isStaff } from '@/lib/utils/roles';
import { hasPermission } from '@/lib/utils/permissions';
import { headers } from 'next/headers';
import { MobileMenu } from '@/components/mobile-menu';
import { DesktopNavLinks } from '@/components/desktop-nav-links';

export async function Navigation() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const profile = user ? await getProfile() : null;
    const userIsAdmin = user ? await isAdmin(user.id) : false;
    const userIsStaff = user ? await isStaff(user.id) : false;
    const canBook = user ? await hasPermission(user.id, 'book_turf') : false;
    const canViewBookings = user ? await hasPermission(user.id, 'view_bookings') : false;

    // Get pathname to hide navigation on staff/admin/login pages (they have their own nav or don't need it)
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';

    // Don't show navigation on staff, admin, or login pages
    if (pathname.startsWith('/staff') || pathname.startsWith('/admin') || pathname === '/login') {
      return null;
    }

    return (
      <nav className="bg-white shadow-lg border-b-2 border-[#1E3A5F] sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link href="/book" className="flex items-center space-x-2 sm:space-x-3 group">
                <img 
                  src="/Riamlogo.png" 
                  alt="RIAM Sports" 
                  className="h-10 w-10 sm:h-12 sm:w-14 object-contain transition-transform group-hover:scale-105"
                />
                <div className="hidden sm:block">
                  <div className="text-xl font-bold text-[#1E3A5F] leading-tight">RIAM Sports</div>
                  {/* <div className="text-xs text-[#FF6B35] font-semibold">ARENA</div> */}
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <>
                  <MobileMenu
                    canBook={canBook}
                    canViewBookings={canViewBookings}
                    userIsAdmin={userIsAdmin}
                    userIsStaff={userIsStaff}
                    profileName={profile?.full_name || user.email || undefined}
                    userEmail={user.email || undefined}
                    profileImage={profile?.profile_image || undefined}
                  />
                  <div className="hidden sm:flex items-center gap-4">
                    <DesktopNavLinks
                      canBook={canBook}
                      canViewBookings={canViewBookings}
                      userIsStaff={userIsStaff}
                      userIsAdmin={userIsAdmin}
                      profile={profile}
                      userEmail={user?.email}
                    />
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="text-[#1E3A5F] hover:text-[#FF6B35] px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-[#FF6B35]/10 cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  className="bg-linear-to-r from-[#FF6B35] to-[#FF8C61] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <span className="hidden sm:inline">Sign In</span>
                  <span className="sm:hidden">Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  } catch {
    // Build or static context (e.g. no request): render minimal nav so page data collection succeeds
    return (
      <nav className="bg-white shadow-lg border-b-2 border-[#1E3A5F] sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link href="/book" className="flex items-center space-x-2 sm:space-x-3 group">
              <img src="/Riamlogo.png" alt="RIAM Sports" className="h-10 w-10 sm:h-12 sm:w-14 object-contain" />
              <div className="hidden sm:block">
                <div className="text-xl font-bold text-[#1E3A5F] leading-tight">RIAM Sports</div>
                {/* <div className="text-xs text-[#FF6B35] font-semibold">ARENA</div> */}
              </div>
            </Link>
            <Link href="/login" className="text-[#1E3A5F] hover:text-[#FF6B35] px-4 py-2 rounded-lg text-sm font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </nav>
    );
  }
}


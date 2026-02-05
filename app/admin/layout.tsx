import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { getUserPermissions } from '@/lib/utils/permissions';
import { signOutAdmin } from '@/lib/actions/auth/admin';
import { getProfile } from '@/lib/actions/profile';
import Link from 'next/link';
import { AdminNavLinks } from '@/components/admin/admin-nav-links';
import { headers } from 'next/headers';
import { SafeImage } from '@/components/ui/safe-image';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Skip authentication check for login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    redirect('/admin/login');
  }

  const profile = await getProfile();
  const permissions = await getUserPermissions(user.id);
  const canManageRoles = permissions.includes('manage_roles');
  const canManageUsers = permissions.includes('manage_users');
  const canManageBookings = permissions.includes('manage_bookings');
  const canManageLocations = permissions.includes('manage_locations');
  const canManageServices = permissions.includes('manage_services');

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F5F7FA] via-white to-[#FF6B35]/5">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-2 border-[#1E3A5F] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img 
                src="/Riamlogo.png" 
                alt="RIAM Sports" 
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-xs text-[#FF6B35] font-semibold hidden sm:block">
                  RIAM Sports
                </p>
              </div>
            </div>
            
            {/* Profile, Change Password and Sign Out */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 text-[#1E3A5F] hover:text-[#FF6B35] text-sm font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-[#FF6B35]/10 cursor-pointer"
              >
                {profile?.profile_image ? (
                  <div className="h-8 w-8 rounded-full border-2 border-[#FF6B35]/30 overflow-hidden shrink-0">
                    <SafeImage
                      src={profile.profile_image}
                      alt={profile.full_name || user.email || 'Profile'}
                      className="h-full w-full object-cover"
                      fill
                    />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-linear-to-br from-[#1E3A5F] to-[#FF6B35] flex items-center justify-center border-2 border-[#FF6B35]/30 text-white text-xs font-bold shrink-0">
                    {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <Link
                href="/admin/change-password"
                className="text-[#1E3A5F] hover:text-[#FF6B35] text-sm font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-[#FF6B35]/10 flex items-center space-x-2 cursor-pointer"
              >
                <span>🔒</span>
                <span className="hidden sm:inline">Password</span>
              </Link>
              <form action={signOutAdmin}>
                <button
                  type="submit"
                  className="text-[#1E3A5F] hover:text-[#FF6B35] text-sm font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-[#FF6B35]/10 flex items-center space-x-2 cursor-pointer"
                >
                  <span>🚪</span>
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-linear-to-r from-[#1E3A5F] to-[#2D4F7C] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide">
            <div className="flex space-x-0 min-w-full">
              <AdminNavLinks
                canManageUsers={canManageUsers}
                canManageRoles={canManageRoles}
                canManageLocations={canManageLocations}
                canManageServices={canManageServices}
                canManageBookings={canManageBookings}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}


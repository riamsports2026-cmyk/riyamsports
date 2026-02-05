import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserPermissions } from '@/lib/utils/permissions';
import { getProfile } from '@/lib/actions/profile';
import Link from 'next/link';
import { signOutStaff } from '@/lib/actions/auth/staff';
import { headers } from 'next/headers';
import { SafeImage } from '@/components/ui/safe-image';
import { StaffNavLinks } from '@/components/staff/staff-nav-links';

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get pathname from headers (set by middleware)
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Skip auth check for login page - middleware handles it
  if (pathname === '/staff/login') {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/staff/login');
  }

  // Check staff permission using service client to bypass RLS
  const { createServiceClient } = await import('@/lib/supabase/server');
  const serviceClient = await createServiceClient();
  
  // Get all role IDs for the user
  const { data: globalRoles } = await serviceClient
    .from('user_roles')
    .select('role_id')
    .eq('user_id', user.id);
  
  const { data: locationRoles } = await serviceClient
    .from('user_role_locations')
    .select('role_id')
    .eq('user_id', user.id);
  
  const roleIds = [
    ...(globalRoles?.map((r: any) => r.role_id) || []),
    ...(locationRoles?.map((r: any) => r.role_id) || [])
  ];
  
  // Also check if user is admin (admins can access staff portal too)
  const { data: adminRoles } = await serviceClient
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);
  
  const isAdmin = adminRoles?.some((ur: any) => ur.roles?.name === 'admin');
  
  // Get profile for display
  const profile = await getProfile();
  
  // If admin, allow access and show all menu items
  if (isAdmin) {
    const permissions = await getUserPermissions(user.id);
    const canManageBookings = permissions.includes('manage_bookings');
    const canManageLocations = permissions.includes('manage_locations');
    const canManageServices = permissions.includes('manage_services');
    const canManageRoles = permissions.includes('manage_roles');
    const canManageUsers = permissions.includes('manage_users');
    
    return (
      <div className="min-h-screen bg-linear-to-br from-[#F5F7FA] via-white to-[#FF6B35]/5">
        <div className="bg-white/95 shadow-xl border-b-2 border-[#1E3A5F] sticky top-0 z-50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-20 py-3 sm:py-0">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full sm:w-auto">
                <div className="shrink-0 flex items-center space-x-3">
                  <img 
                    src="/Riamlogo.png" 
                    alt="RIAM Sports" 
                    className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                  />
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">Staff Portal</h1>
                    <p className="text-xs text-[#FF6B35] font-semibold hidden sm:block">RIAM Sports</p>
                  </div>
                </div>
                <nav className="flex flex-wrap gap-2 sm:gap-4 sm:ml-6 sm:space-x-2">
                  <StaffNavLinks
                    canManageBookings={canManageBookings}
                    canViewBookings={true}
                    canManageLocations={canManageLocations}
                    canManageServices={canManageServices}
                    canManageUsers={canManageUsers}
                    canManageRoles={canManageRoles}
                  />
                </nav>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 mt-3 sm:mt-0">
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
                <form action={signOutStaff}>
                  <button
                    type="submit"
                    className="text-[#1E3A5F] hover:text-[#FF6B35] text-sm font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-[#FF6B35]/10 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    );
  }
  
  // Check if user has manage_bookings permission
  let hasStaffPermission = false;
  if (roleIds.length > 0) {
    const { data: permData } = await serviceClient
      .from('permissions')
      .select('id')
      .eq('name', 'manage_bookings')
      .single();
    const permission = permData as { id: string } | null;
    if (permission) {
      const { data: rolePermissions } = await serviceClient
        .from('role_permissions')
        .select('role_id')
        .in('role_id', roleIds)
        .eq('permission_id', permission.id)
        .limit(1);
      
      hasStaffPermission = (rolePermissions?.length || 0) > 0;
    }
  }
  
  if (!hasStaffPermission) {
    // User doesn't have staff permission - redirect to login with error
    redirect('/staff/login?error=no_permission');
  }

  // Get user permissions to conditionally show menu items
  const permissions = await getUserPermissions(user.id);
  const canManageBookings = permissions.includes('manage_bookings');
  const canManageLocations = permissions.includes('manage_locations');
  const canManageServices = permissions.includes('manage_services');
  const canManageRoles = permissions.includes('manage_roles');
  const canManageUsers = permissions.includes('manage_users');
  const canViewBookings = permissions.includes('view_bookings');

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F5F7FA] via-white to-[#FF6B35]/5">
      <div className="bg-white/95 shadow-xl border-b-2 border-[#1E3A5F] sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-20 py-3 sm:py-0">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full sm:w-auto">
              <div className="shrink-0 flex items-center space-x-3">
                <img 
                  src="/Riamlogo.png" 
                  alt="RIAM Sports" 
                  className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                />
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">Staff Portal</h1>
                  <p className="text-xs text-[#FF6B35] font-semibold hidden sm:block">RIAM Sports</p>
                </div>
              </div>
              <nav className="flex flex-wrap gap-2 sm:gap-4 sm:ml-6 sm:space-x-2">
                <StaffNavLinks
                  canManageBookings={canManageBookings}
                  canViewBookings={canViewBookings}
                  canManageLocations={canManageLocations}
                  canManageServices={canManageServices}
                  canManageUsers={canManageUsers}
                  canManageRoles={canManageRoles}
                />
              </nav>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4 mt-3 sm:mt-0">
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
              <form action={signOutStaff}>
                <button
                  type="submit"
                  className="text-[#1E3A5F] hover:text-[#FF6B35] text-sm font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-[#FF6B35]/10 cursor-pointer"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}


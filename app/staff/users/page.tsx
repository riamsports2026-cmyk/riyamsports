import { createClient } from '@/lib/supabase/server';
import { getStaffLocationIds } from '@/lib/utils/roles';
import { Metadata } from 'next';
import { Pagination } from '@/components/pagination';

export const metadata: Metadata = {
  title: 'Users | Staff',
  description: 'View users at your assigned locations',
};

export default async function StaffUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not logged in</div>;
  }

  // Get staff's assigned location IDs
  const assignedLocationIds = await getStaffLocationIds(user.id);

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  // Get users who have roles at assigned locations
  const { createServiceClient } = await import('@/lib/supabase/server');
  const serviceClient = await createServiceClient();

  type UrlRow = { user_id: string };

  let userIds: string[] = [];
  
  if (assignedLocationIds.length > 0) {
    const { data: userRoleLocationsRaw } = await serviceClient
      .from('user_role_locations')
      .select('user_id')
      .in('location_id', assignedLocationIds);
    
    const userRoleLocations = (userRoleLocationsRaw ?? []) as UrlRow[];
    userIds = [...new Set(userRoleLocations.map((url) => url.user_id))];
  } else {
    const { data: allUsersRaw } = await serviceClient
      .from('user_role_locations')
      .select('user_id');
    
    const allUsers = (allUsersRaw ?? []) as UrlRow[];
    userIds = [...new Set(allUsers.map((url) => url.user_id))];
  }

  if (userIds.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Users</h2>
          <p className="mt-1 text-sm text-gray-500">
            View users at your assigned locations
          </p>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No users found for your assigned locations.</p>
            {assignedLocationIds.length === 0 && (
              <p className="text-xs text-gray-400 mt-2">Contact an administrator to assign locations to your role.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  type ProfileRow = { id: string; full_name: string | null; email?: string | null; mobile_number?: string | null };
  type RlRow = { roles: { name: string } | null; locations: { name: string } | null };

  // Fetch user profiles
  const { data: profilesRaw, error: profilesError, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .in('id', userIds)
    .order('full_name')
    .range(offset, offset + limit - 1);

  const profiles = (profilesRaw ?? []) as ProfileRow[];

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <p className="text-sm text-red-600">Error loading users. Please try again.</p>
        </div>
      </div>
    );
  }

  const usersWithRoles = await Promise.all(
    profiles.map(async (profile) => {
      const { data: roleLocationsRaw } = await serviceClient
        .from('user_role_locations')
        .select('role_id, location_id, roles(name), locations(name)')
        .eq('user_id', profile.id)
        .in('location_id', assignedLocationIds.length > 0 ? assignedLocationIds : []);

      const roleLocations = (roleLocationsRaw ?? []) as RlRow[];
      return {
        profile,
        roles: roleLocations.map((rl) => ({
          roleName: rl.roles?.name,
          locationName: rl.locations?.name,
        })),
      };
    })
  );

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
          👥 Users
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">
          View users at your assigned locations
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#1E3A5F]/10">
        {usersWithRoles.length === 0 ? (
          <div className="text-center py-12 bg-linear-to-br from-[#FF6B35]/5 to-[#1E3A5F]/5">
            <p className="text-sm sm:text-base text-[#1E3A5F] font-medium">No users found.</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {usersWithRoles.map(({ profile, roles }) => (
                <li key={profile.id} className="hover:bg-[#FF6B35]/5 transition-colors">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F]">{profile.full_name || 'Unknown'}</h3>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p>✉️ Email: {profile.email || 'N/A'}</p>
                          {profile.mobile_number && (
                            <p>📱 Phone: {profile.mobile_number}</p>
                          )}
                          {roles.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-[#1E3A5F] mb-1">Roles:</p>
                              {roles.map((role, idx) => (
                                <p key={idx} className="text-sm text-gray-700">
                                  🎭 {role.roleName?.replace(/_/g, ' ')} {role.locationName && `at ${role.locationName}`}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={limit}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}



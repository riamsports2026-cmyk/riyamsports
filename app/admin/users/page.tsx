import { getAllUsers } from '@/lib/actions/admin/users';
import { getAllRoles } from '@/lib/actions/admin/roles';
import { getAllLocations } from '@/lib/actions/admin/locations';
import { getUserRolesWithLocations } from '@/lib/actions/admin/user-roles';
import Link from 'next/link';
import { UserRoleForm } from '@/components/admin/user-role-form';
import { CreateUserForm } from '@/components/admin/create-user-form';
import { UserDateFilters } from '@/components/user-date-filters';
import { Pagination } from '@/components/pagination';
import { Loader } from '@/components/ui/loader';
import { Suspense } from 'react';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    role?: string;
  }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 20;
  
  const filters = {
    startDate: params.start_date,
    endDate: params.end_date,
    sortBy: params.sort_by || 'created_at',
    sortOrder: (params.sort_order as 'asc' | 'desc') || 'desc',
    role: params.role,
  };
  
  const [usersResult, rolesResult, locationsResult] = await Promise.all([
    getAllUsers(page, limit, filters),
    getAllRoles(),
    getAllLocations({ page: 1, limit: 1000 }), // Get all for dropdown
  ]);
  
  const roles = Array.isArray(rolesResult) ? rolesResult : rolesResult.data || [];
  const locations = locationsResult.data || [];
  
  const users = usersResult.data;
  const { total, totalPages } = usersResult;

  // Get role details for each user to show current location assignments
  const userRoleDetails = new Map<string, { globalRoles: string[]; locationRoles: Array<{ role: string; location: string; locationId: string }> }>();
  await Promise.all(
    users.map(async (user) => {
      const details = await getUserRolesWithLocations(user.id);
      userRoleDetails.set(user.id, details);
    })
  );

  // Show all users (including customers) so Total Users count matches the list
  // Filter out customer and admin from assignment dropdown (admin is secret)
  const assignableRoles = roles.filter((r: { name: string }) => r.name !== 'customer' && r.name !== 'admin');

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
            👥 Users & Roles
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">All users — click a user to view details or assign roles</p>
        </div>
        <div className="shrink-0">
          <CreateUserForm roles={assignableRoles} locations={locations} />
        </div>
      </div>

      <Suspense fallback={
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-[#1E3A5F]/10">
          <Loader size="md" label="Loading filters..." />
        </div>
      }>
        <UserDateFilters roles={roles.filter((r: { name: string }) => r.name !== 'admin')} />
      </Suspense>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#1E3A5F]/10 mt-6">
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id} className="hover:bg-[#FF6B35]/5 transition-colors">
              <div className="px-4 py-4 sm:px-6">
                {/* Responsive: stack on mobile; two columns on md+ to avoid overlap */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,1fr)] md:gap-6 md:items-start">
                  {/* Left: identity + role badges (stacked so badges never overlap phone) */}
                  <div className="min-w-0 space-y-3">
                    <Link href={`/admin/users/${user.id}`} className="flex items-start gap-3 sm:gap-4 group">
                      <div className="shrink-0">
                        {user.profile?.profile_image ? (
                          <img
                            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-[#FF6B35]/30 object-cover"
                            src={user.profile.profile_image}
                            alt={user.profile.full_name || user.email}
                          />
                        ) : (
                          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-linear-to-br from-[#1E3A5F] to-[#FF6B35] flex items-center justify-center border-2 border-[#FF6B35]/30">
                            <span className="text-white text-base sm:text-lg font-bold">
                              {(user.profile?.full_name || user.email || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-base sm:text-lg font-bold text-[#1E3A5F] truncate group-hover:text-[#FF6B35] transition-colors">
                          {user.profile?.full_name || user.email}
                        </div>
                        <div className="text-sm text-gray-600 truncate mt-0.5">{user.email}</div>
                        {user.profile?.mobile_number && (
                          <div className="text-sm text-gray-600 mt-0.5">📱 {user.profile.mobile_number}</div>
                        )}
                        <span className="text-xs text-[#FF6B35] font-medium mt-1 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                          View details →
                        </span>
                      </div>
                    </Link>
                    {/* Role badges on their own row below identity — no overlap */}
                    <div className="flex flex-wrap gap-2">
                      {user.roles
                        .filter((role) => {
                          if (role === 'customer' && user.roles.length > 1) return false;
                          return true;
                        })
                        .map((role) => (
                          <span
                            key={role}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                              role === 'employee' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              role === 'manager' ? 'bg-green-100 text-green-800 border-green-300' :
                              role === 'sub_admin' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              role === 'account_manager' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                              'bg-gray-100 text-gray-800 border-gray-300'
                            }`}
                          >
                            {role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        ))}
                    </div>
                  </div>
                  {/* Right: role form in its own column with clear spacing */}
                  <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50/50 p-3 sm:p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Assign role</p>
                    <UserRoleForm
                      userId={user.id}
                      currentRoles={user.roles}
                      allRoles={assignableRoles}
                      locations={locations}
                      userRoleDetails={userRoleDetails.get(user.id)}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {users.length === 0 && (
          <div className="text-center py-12 bg-linear-to-br from-[#FF6B35]/5 to-[#1E3A5F]/5">
            <p className="text-sm sm:text-base text-[#1E3A5F] font-medium">No users found</p>
            <p className="text-sm text-gray-600 mt-1">Users will appear here once they sign up.</p>
          </div>
        )}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={limit}
          />
        )}
      </div>
    </div>
  );
}


import { getUserById } from '@/lib/actions/admin/users';
import { getAllRoles } from '@/lib/actions/admin/roles';
import { getAllLocations } from '@/lib/actions/admin/locations';
import { getUserRolesWithLocations } from '@/lib/actions/admin/user-roles';
import { UserRoleForm } from '@/components/admin/user-role-form';
import Link from 'next/link';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, rolesResult, locationsResult] = await Promise.all([
    getUserById(id),
    getAllRoles(),
    getAllLocations({ page: 1, limit: 1000 }),
  ]);

  if (!user) {
    notFound();
  }

  const roles = Array.isArray(rolesResult) ? rolesResult : rolesResult.data || [];
  const locations = locationsResult.data || [];
  // Exclude customer and admin from assignment (admin is secret)
  const assignableRoles = roles.filter((r: { name: string }) => r.name !== 'customer' && r.name !== 'admin');
  const userRoleDetails = await getUserRolesWithLocations(id);

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center text-sm text-[#1E3A5F] hover:text-[#FF6B35] mb-4 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Users
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
          User Details
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 overflow-hidden">
            <div className="bg-linear-to-br from-[#1E3A5F] to-[#2D4F7C] p-4">
              <div className="flex items-center gap-4">
                {user.profile?.profile_image ? (
                  <img
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-white/50 object-cover"
                    src={user.profile.profile_image}
                    alt={user.profile.full_name || user.email}
                  />
                ) : (
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50">
                    <span className="text-white text-2xl sm:text-3xl font-bold">
                      {(user.profile?.full_name || user.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {user.profile?.full_name || 'No name'}
                  </h3>
                  <p className="text-white/90 text-sm">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Profile information
              </h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-600">Email</dt>
                  <dd className="font-medium text-[#1E3A5F]">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Full name</dt>
                  <dd className="font-medium text-[#1E3A5F]">
                    {user.profile?.full_name || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Mobile</dt>
                  <dd className="font-medium text-[#1E3A5F]">
                    {user.profile?.mobile_number || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Joined</dt>
                  <dd className="font-medium text-[#1E3A5F]">
                    {user.created_at
                      ? format(new Date(user.created_at), 'MMM d, yyyy')
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Roles & locations */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 p-6">
            <h4 className="text-lg font-bold text-[#1E3A5F] mb-3">Roles</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {user.roles
                .filter((role) => role !== 'customer' || user.roles.length === 1)
                .map((role) => (
                  <span
                    key={role}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 ${
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
            {user.locationRoles.length > 0 && (
              <>
                <h4 className="text-sm font-semibold text-gray-600 mt-4 mb-2">Location roles</h4>
                <ul className="space-y-1 text-sm">
                  {user.locationRoles.map((lr, i) => (
                    <li key={i} className="text-[#1E3A5F]">
                      <span className="font-medium">{lr.role}</span>
                      {lr.location && <span className="text-gray-600"> at {lr.location}</span>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Sidebar - manage roles */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 p-6">
            <h4 className="text-lg font-bold text-[#1E3A5F] mb-4">Manage roles</h4>
            <UserRoleForm
              userId={user.id}
              currentRoles={user.roles}
              allRoles={assignableRoles}
              locations={locations}
              userRoleDetails={userRoleDetails}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { getAllUsers } from '@/lib/actions/admin/users';
import { getAllRoleLocations } from '@/lib/actions/admin/user-roles';
import { getAllRoles } from '@/lib/actions/admin/roles';
import { getAllLocations } from '@/lib/actions/admin/locations';
import { getAllPermissions, getRolePermissions } from '@/lib/actions/admin/permissions';
import { UserRoleAssignmentForm } from '@/components/admin/user-role-assignment-form';
import { RemoveRoleButton } from '@/components/admin/remove-role-button';
import { RoleForm } from '@/components/admin/role-form';
import { DeleteRoleButton } from '@/components/admin/delete-role-button';
import { RolePermissionsForm } from '@/components/admin/role-permissions-form';
import { SearchFilter } from '@/components/ui/search-filter';
import { Loader } from '@/components/ui/loader';
import { Suspense } from 'react';

export default async function AdminRolesPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 20;
  
  const [usersResult, rolesResult, locationsResult, roleLocations, allPermissions] = await Promise.all([
    getAllUsers(),
    getAllRoles({ 
      page, 
      limit,
      sortBy: params.sort_by || 'name',
      sortOrder: params.sort_order || 'asc',
      search: params.search,
    }),
    getAllLocations({ page: 1, limit: 1000 }), // Get all for dropdown
    getAllRoleLocations(),
    getAllPermissions(),
  ]);
  
  const users = Array.isArray(usersResult) ? usersResult : usersResult.data || [];
  const roles = rolesResult.data;
  // Hide admin from lists — keep it secret
  const rolesWithoutAdmin = roles.filter((r: { name: string }) => r.name !== 'admin');
  const locations = locationsResult.data || [];
  const roleLocationsList = Array.isArray(roleLocations) ? roleLocations : [];

  const rolePermissionsMap = new Map<string, string[]>();
  await Promise.all(
    roles.map(async (role: { id: string }) => {
      const permissionIds = await getRolePermissions(role.id);
      rolePermissionsMap.set(role.id, permissionIds);
    })
  );

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
            🎭 Role Management
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">
            Assign roles to users based on locations (branches)
          </p>
        </div>
        <UserRoleAssignmentForm
          users={users.map((u) => ({
            id: u.id,
            email: u.email ?? '',
            profile: u.profile ? { full_name: u.profile.full_name ?? null } : undefined,
          }))}
          roles={rolesWithoutAdmin}
          locations={locations}
        />
      </div>

      <Suspense fallback={
        <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-[#1E3A5F]/10 mb-6">
          <Loader size="sm" />
        </div>
      }>
        <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 p-4 mb-6">
          <SearchFilter placeholder="Search roles by name or description..." />
        </div>
      </Suspense>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#1E3A5F]/10">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F]">Available Roles</h3>
            <RoleForm />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rolesWithoutAdmin.map((role: { id: string; name?: string; description?: string | null; is_system_role?: boolean }) => (
              <div key={role.id} className="border rounded-lg p-4 relative">
                <div className="font-medium text-gray-900 capitalize">
                  {(role.name ?? '').replace(/_/g, ' ')}
                </div>
                {role.description && (
                  <div className="text-xs text-gray-600 mt-1">{role.description}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Can be assigned as Global or Branch-wise
                </div>
                {role.is_system_role && (
                  <span className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    System
                  </span>
                )}
                <div className="mt-3 border-t pt-3">
                  <RolePermissionsForm
                    roleId={role.id}
                    allPermissions={allPermissions}
                    currentPermissionIds={rolePermissionsMap.get(role.id) || []}
                  />
                </div>
                {!role.is_system_role && (
                  <div className="mt-2 flex gap-2">
                    <RoleForm role={role} />
                    <DeleteRoleButton roleId={role.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Role Assignments</h3>
          {roleLocationsList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No role assignments found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roleLocationsList.map((rl: { id: string; user_id: string; role_id: string; location_id?: string; user?: { full_name?: string | null }; role?: { name?: string }; location?: { name?: string } }) => (
                <div
                  key={rl.id}
                  className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {rl.user?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Role: <span className="capitalize">{rl.role?.name?.replace('_', ' ')}</span>
                        </div>
                        {rl.location ? (
                          <div className="text-sm text-gray-500">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                              Branch-wise
                            </span>
                            Location: {rl.location?.name}
                          </div>
                        ) : (
                          <div className="text-sm">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Global
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <RemoveRoleButton
                    userId={rl.user_id}
                    roleId={rl.role_id}
                    locationId={rl.location_id ?? ''}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


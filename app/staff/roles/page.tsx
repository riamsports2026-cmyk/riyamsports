import { createClient } from '@/lib/supabase/server';
import { getStaffLocationIds } from '@/lib/utils/roles';
import { Metadata } from 'next';
import { Pagination } from '@/components/pagination';
import { getRolePermissions } from '@/lib/actions/admin/permissions';

export const metadata: Metadata = {
  title: 'Roles | Staff',
  description: 'View roles at your assigned locations',
};

export default async function StaffRolesPage({
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

  const { createServiceClient } = await import('@/lib/supabase/server');
  const serviceClient = await createServiceClient();

  // Get roles that are used at assigned locations
  let roleIds: string[] = [];
  
  type RoleLocRow = { role_id: string };
  if (assignedLocationIds.length > 0) {
    const { data: roleLocationsRaw } = await serviceClient
      .from('user_role_locations')
      .select('role_id')
      .in('location_id', assignedLocationIds);
    
    const roleLocations = (roleLocationsRaw ?? []) as RoleLocRow[];
    roleIds = [...new Set(roleLocations.map((rl) => rl.role_id))];
  } else {
    const { data: allRoleLocationsRaw } = await serviceClient
      .from('user_role_locations')
      .select('role_id');
    
    const allRoleLocations = (allRoleLocationsRaw ?? []) as RoleLocRow[];
    roleIds = [...new Set(allRoleLocations.map((rl) => rl.role_id))];
  }

  if (roleIds.length === 0) {
    return (
      <div className="px-4 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
            🎭 Roles
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">
            View roles at your assigned locations
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#1E3A5F]/10">
          <div className="text-center py-12 bg-linear-to-br from-[#FF6B35]/5 to-[#1E3A5F]/5">
            <p className="text-sm sm:text-base text-[#1E3A5F] font-medium">No roles found for your assigned locations.</p>
            {assignedLocationIds.length === 0 && (
              <p className="text-xs text-gray-600 mt-2">Contact an administrator to assign locations to your role.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  type RoleRow = { id: string; name: string; description: string | null };
  type PermRow = { name: string };

  // Fetch roles
  const { data: rolesRaw, error: rolesError, count } = await serviceClient
    .from('roles')
    .select('*', { count: 'exact' })
    .in('id', roleIds)
    .order('name')
    .range(offset, offset + limit - 1);

  const roles = (rolesRaw ?? []) as RoleRow[];

  if (rolesError) {
    console.error('Error fetching roles:', rolesError);
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <p className="text-sm text-red-600">Error loading roles. Please try again.</p>
        </div>
      </div>
    );
  }

  // Get permissions for each role
  const rolesWithPermissions = await Promise.all(
    roles.map(async (role) => {
      const permissionIds = await getRolePermissions(role.id);
      const { data: permissionsRaw } = await serviceClient
        .from('permissions')
        .select('name, description')
        .in('id', permissionIds);

      const permissions = (permissionsRaw ?? []) as PermRow[];
      return {
        role,
        permissions,
      };
    })
  );

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
          🎭 Roles
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">
          View roles at your assigned locations
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#1E3A5F]/10">
        {rolesWithPermissions.length === 0 ? (
          <div className="text-center py-12 bg-linear-to-br from-[#FF6B35]/5 to-[#1E3A5F]/5">
            <p className="text-sm sm:text-base text-[#1E3A5F] font-medium">No roles found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-6">
              {rolesWithPermissions.map(({ role, permissions }) => (
                <div key={role.id} className="border-2 border-[#1E3A5F]/20 rounded-xl p-4 sm:p-5 hover:border-[#FF6B35] hover:shadow-lg transition-all bg-linear-to-br from-white to-[#FF6B35]/5">
                  <div className="font-bold text-lg text-[#1E3A5F] capitalize mb-2">
                    {role.name.replace(/_/g, ' ')}
                  </div>
                  {role.description && (
                    <div className="text-sm text-gray-600 mt-1 mb-2">{role.description}</div>
                  )}
                  <div className="text-xs font-semibold text-[#FF6B35] mt-1 mb-3">
                    {role.name === 'admin' ? '🌐 Global access' : '📍 Location-based'}
                  </div>
                  {permissions.length > 0 && (
                    <div className="mt-3 border-t-2 border-[#1E3A5F]/20 pt-3">
                      <div className="text-xs font-bold text-[#1E3A5F] mb-2">Permissions:</div>
                      <div className="space-y-1">
                        {permissions.map((perm) => (
                          <div key={perm.name} className="text-xs text-gray-700">
                            ✓ {perm.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="p-4">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={limit}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}



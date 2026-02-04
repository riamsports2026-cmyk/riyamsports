import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserRoles } from '@/lib/utils/roles';
import { getUserPermissions } from '@/lib/utils/permissions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Permissions | Staff',
  description: 'View your assigned permissions',
};

export default async function StaffPermissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not logged in</div>;
  }

  const serviceClient = await createServiceClient();
  
  // Get user roles
  const roles = await getUserRoles(user.id);
  
  // Get user permissions
  const permissions = await getUserPermissions(user.id);
  
  type RoleRow = { id: string; name: string; description: string | null };
  type RolePermRow = { role_id: string; permission: { id: string; name: string; description: string | null } | null };

  // Get detailed role and permission info
  const { data: roleDataRaw } = await serviceClient
    .from('roles')
    .select('id, name, description')
    .in('name', roles);
  
  const roleData = (roleDataRaw ?? []) as RoleRow[];
  const roleIds = roleData.map((r) => r.id);
  
  // Get role permissions
  const { data: rolePermissionsRaw } = await serviceClient
    .from('role_permissions')
    .select('role_id, permission:permissions(id, name, description)')
    .in('role_id', roleIds);
  
  const rolePermissions = (rolePermissionsRaw ?? []) as RolePermRow[];
  
  // Group permissions by role
  const permissionsByRole = new Map<string, Array<{ id: string; name: string; description: string | null }>>();
  
  roleData.forEach((role) => {
    const rolePerms = rolePermissions
      .filter((rp) => rp.role_id === role.id)
      .map((rp) => rp.permission)
      .filter((p): p is NonNullable<typeof p> => !!p);
    permissionsByRole.set(role.name, rolePerms);
  });

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">My Permissions</h2>
        <p className="mt-1 text-sm text-gray-500">
          View your assigned roles and permissions
        </p>
      </div>

      <div className="space-y-6">
        {/* Roles Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">My Roles</h3>
            {roles.length === 0 ? (
              <p className="text-sm text-gray-500">No roles assigned</p>
            ) : (
              <div className="space-y-3">
                {roleData.map((role) => (
                  <div key={role.id} className="border rounded-lg p-4">
                    <div className="font-medium text-gray-900 capitalize">
                      {role.name.replace(/_/g, ' ')}
                    </div>
                    {role.description && (
                      <div className="text-sm text-gray-500 mt-1">{role.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Permissions Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">My Permissions</h3>
            {permissions.length === 0 ? (
              <p className="text-sm text-gray-500">No permissions assigned</p>
            ) : (
              <div className="space-y-2">
                {permissions.map((perm) => (
                  <div key={perm} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {perm.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Permissions by Role */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions by Role</h3>
            {permissionsByRole.size === 0 ? (
              <p className="text-sm text-gray-500">No role permissions found</p>
            ) : (
              <div className="space-y-4">
                {Array.from(permissionsByRole.entries()).map(([roleName, perms]) => (
                  <div key={roleName} className="border rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-2 capitalize">
                      {roleName.replace(/_/g, ' ')}
                    </div>
                    {perms.length === 0 ? (
                      <p className="text-sm text-gray-500">No permissions assigned to this role</p>
                    ) : (
                      <div className="space-y-1">
                        {perms.map((perm) => (
                          <div key={perm.id} className="text-sm text-gray-700">
                            • {perm.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            {perm.description && (
                              <span className="text-gray-500 ml-2">- {perm.description}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Information</h4>
          <div className="text-xs text-yellow-700 space-y-1">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Roles Found:</strong> {roles.length} - {roles.join(', ')}</p>
            <p><strong>Permissions Found:</strong> {permissions.length} - {permissions.join(', ')}</p>
            <p><strong>Role IDs:</strong> {roleIds.join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}






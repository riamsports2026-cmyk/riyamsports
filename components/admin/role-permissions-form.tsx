'use client';

import { updateRolePermissions, getAllPermissions, getRolePermissions } from '@/lib/actions/admin/permissions';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';

interface RolePermissionsFormProps {
  roleId: string;
  allPermissions: Array<{ id: string; name: string; description: string | null }>;
  currentPermissionIds: string[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35]/30 disabled:opacity-50 cursor-pointer"
    >
      {pending ? 'Saving...' : 'Save Permissions'}
    </button>
  );
}

export function RolePermissionsForm({ roleId, allPermissions, currentPermissionIds }: RolePermissionsFormProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(currentPermissionIds);
  const [state, formAction] = useActionState(
    async (prevState: { error?: string; success?: boolean } | null, formData: FormData) => {
      const permissionIds = formData.getAll('permission_id') as string[];
      return await updateRolePermissions(roleId, permissionIds);
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      // Refresh after a delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [state?.success]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="text-sm font-medium text-gray-700 mb-2">Permissions:</div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {allPermissions.map((permission) => (
          <label
            key={permission.id}
            className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              name="permission_id"
              value={permission.id}
              checked={selectedPermissions.includes(permission.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedPermissions([...selectedPermissions, permission.id]);
                } else {
                  setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                }
              }}
              className="mt-1 h-4 w-4 text-[#FF6B35] focus:ring-[#FF6B35]/30 border-gray-300 rounded"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {permission.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
              {permission.description && (
                <div className="text-xs text-gray-500">{permission.description}</div>
              )}
            </div>
          </label>
        ))}
      </div>
      <SubmitButton />
      {state?.error && (
        <div className="mt-2 text-sm text-red-600">{state.error}</div>
      )}
      {state?.success && (
        <div className="mt-2 text-sm text-green-600">Permissions updated! Refreshing...</div>
      )}
    </form>
  );
}



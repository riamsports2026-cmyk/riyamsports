'use client';

import { assignLocationRole } from '@/lib/actions/admin/user-roles';
import { Role, Location } from '@/lib/types';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserRoleAssignmentFormProps {
  users: Array<{
    id: string;
    email: string;
    profile?: { full_name: string | null } | null;
  }>;
  roles: Role[];
  locations: Location[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
    >
      {pending ? 'Assigning...' : 'Assign Role'}
    </button>
  );
}

export function UserRoleAssignmentForm({
  users,
  roles,
  locations,
}: UserRoleAssignmentFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [state, formAction] = useActionState(assignLocationRole, null);

  const selectedRoleData = roles.find((r) => r.name === selectedRole);
  const [assignmentType, setAssignmentType] = useState<'global' | 'branch'>('global');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close modal and refresh page on success
  useEffect(() => {
    if (state?.success) {
      setTimeout(() => {
        setIsOpen(false);
        setSelectedRole('');
        router.refresh();
      }, 1500);
    }
  }, [state?.success, router]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] cursor-pointer transition-all shadow-lg hover:shadow-xl"
      >
        + Assign Role
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Role to User</h3>
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
                User <span className="text-red-500">*</span>
              </label>
              <select
                name="user_id"
                id="user_id"
                required
                className="mt-1 block w-full border-2 border-[#1E3A5F]/20 rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] cursor-pointer bg-white font-medium text-[#1E3A5F]"
                style={{ maxHeight: 'none', overflow: 'visible' }}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id} className="py-2">
                    {user.profile?.full_name || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="role_name" className="block text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role_name"
                id="role_name"
                required
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setAssignmentType('global'); // Reset to global when role changes
                }}
                className="mt-1 block w-full border-2 border-[#1E3A5F]/20 rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] cursor-pointer bg-white font-medium text-[#1E3A5F]"
                style={{ maxHeight: 'none', overflow: 'visible' }}
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name} className="py-2">
                    {role.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {selectedRole && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Type <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center p-3 border-2 rounded-lg transition-all cursor-pointer ${
                    assignmentType === 'global'
                      ? 'border-[#FF6B35] bg-linear-to-br from-[#FF6B35]/10 to-[#1E3A5F]/10 shadow-md'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="assignment_type"
                      value="global"
                      checked={assignmentType === 'global'}
                      onChange={(e) => setAssignmentType(e.target.value as 'global')}
                      className="h-4 w-4 text-[#FF6B35] focus:ring-[#FF6B35]/20 cursor-pointer"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900">Global</div>
                      <div className="text-xs text-gray-500">
                        Access to all locations/branches
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-center p-3 border-2 rounded-lg transition-all cursor-pointer ${
                    assignmentType === 'branch'
                      ? 'border-[#FF6B35] bg-linear-to-br from-[#FF6B35]/10 to-[#1E3A5F]/10 shadow-md'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="assignment_type"
                      value="branch"
                      checked={assignmentType === 'branch'}
                      onChange={(e) => setAssignmentType(e.target.value as 'branch')}
                      className="h-4 w-4 text-[#FF6B35] focus:ring-[#FF6B35]/20 cursor-pointer"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900">Branch-wise (Location-based)</div>
                      <div className="text-xs text-gray-500">
                        Access limited to a specific location/branch
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {selectedRole && assignmentType === 'branch' && (
              <div>
                <label htmlFor="location_id" className="block text-sm font-medium text-gray-700">
                  Location (Branch) <span className="text-red-500">*</span>
                </label>
                <select
                  name="location_id"
                  id="location_id"
                  required={assignmentType === 'branch'}
                  className="mt-1 block w-full border-2 border-[#1E3A5F]/20 rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] cursor-pointer bg-white font-medium text-[#1E3A5F]"
                  style={{ maxHeight: 'none', overflow: 'visible' }}
                >
                  <option value="">Select a location</option>
                  {locations
                    .filter((loc) => loc.is_active)
                    .map((location) => (
                      <option key={location.id} value={location.id} className="py-2">
                        {location.name}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select the branch/location for this role assignment. This role will only have access to this specific location.
                </p>
              </div>
            )}
            
            {/* Hidden input to ensure location_id is empty for global assignments */}
            {selectedRole && assignmentType === 'global' && (
              <input type="hidden" name="location_id" value="" />
            )}

            {selectedRole && assignmentType === 'global' && (
              <div className="rounded-md bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  This role will provide global access to all locations/branches (no location required).
                </p>
              </div>
            )}

            {state?.error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{state.error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedRole('');
                }}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={state?.success}
              >
                Cancel
              </button>
              <SubmitButton />
            </div>
          </form>
          {state?.success && (
            <div className="mt-4 rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">Role assigned successfully! Closing...</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}



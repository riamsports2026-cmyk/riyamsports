'use client';

import { createUserWithRole } from '@/lib/actions/admin/create-user';
import { Role, Location } from '@/lib/types';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CreateUserFormProps {
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
      {pending ? 'Creating...' : 'Create User'}
    </button>
  );
}

export function CreateUserForm({ roles, locations }: CreateUserFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [state, formAction] = useActionState(createUserWithRole, null);

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
      // Close modal after a short delay to show success message
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
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] cursor-pointer transition-all shadow-lg hover:shadow-xl"
      >
        + Create User Account
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create User Account</h3>
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="password"
                  required
                  minLength={8}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#FF6B35] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                id="full_name"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              />
            </div>

            <div>
              <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="mobile_number"
                id="mobile_number"
                required
                pattern="[6-9]\d{9}"
                placeholder="9876543210"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              />
              <p className="mt-1 text-xs text-gray-500">10-digit mobile number starting with 6-9</p>
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
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed"
                disabled={state?.success}
              >
                Cancel
              </button>
              <SubmitButton />
            </div>
          </form>
          {state?.success && (
            <div className="mt-4 rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">User account created successfully! Closing...</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}



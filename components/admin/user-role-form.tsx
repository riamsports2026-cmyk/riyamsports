'use client';

import { assignLocationRole } from '@/lib/actions/admin/user-roles';
import { Role, Location } from '@/lib/types';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserRoleFormProps {
  userId: string;
  currentRoles: string[];
  allRoles: Role[];
  locations: Location[];
  userRoleDetails?: {
    globalRoles: string[];
    locationRoles: Array<{ role: string; location: string; locationId: string }>;
  };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all whitespace-nowrap"
    >
      {pending ? 'Saving...' : 'Update'}
    </button>
  );
}

export function UserRoleForm({ userId, currentRoles, allRoles, locations, userRoleDetails }: UserRoleFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(assignLocationRole, null);
  
  // Get the primary role (prefer global roles, then location-based)
  const primaryRole = userRoleDetails?.globalRoles[0] || 
                      userRoleDetails?.locationRoles[0]?.role || 
                      currentRoles[0] || 
                      'customer';
  
  // Get the location for location-based roles - find location for the primary role
  const currentLocationId = userRoleDetails?.locationRoles.find(
    (lr) => lr.role === primaryRole
  )?.locationId || userRoleDetails?.locationRoles[0]?.locationId || '';
  
  const [selectedRole, setSelectedRole] = useState<string>(primaryRole);
  const [selectedLocation, setSelectedLocation] = useState<string>(currentLocationId);

  const [assignmentType, setAssignmentType] = useState<'global' | 'branch'>(
    currentLocationId ? 'branch' : 'global'
  );

  // Update assignment type and location when role changes
  useEffect(() => {
    if (userRoleDetails) {
      const roleLocation = userRoleDetails.locationRoles.find((lr) => lr.role === selectedRole);
      if (roleLocation) {
        setSelectedLocation(roleLocation.locationId);
        setAssignmentType('branch');
      } else {
        // Check if it's a global role
        const isGlobal = userRoleDetails.globalRoles.includes(selectedRole);
        if (isGlobal) {
          setAssignmentType('global');
          setSelectedLocation('');
        } else {
          // New role, default to global
          setAssignmentType('global');
          setSelectedLocation('');
        }
      }
    }
  }, [selectedRole, userRoleDetails]);

  useEffect(() => {
    if (state?.success) {
      // Refresh the page after a short delay to show success message
      setTimeout(() => {
        router.refresh();
      }, 1000);
    }
  }, [state?.success, router]);

  return (
    <div className="w-full space-y-3">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="user_id" value={userId} />
        
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            name="role_name"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="flex-1 min-w-[180px] block pl-3 pr-10 py-2.5 text-sm border-2 border-[#1E3A5F]/20 focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] rounded-xl bg-white cursor-pointer font-medium text-[#1E3A5F]"
            style={{ maxHeight: 'none', overflow: 'visible' }}
          >
            {allRoles.map((role) => (
              <option key={role.id} value={role.name} className="py-2">
                {role.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex gap-2">
            <label className={`flex items-center p-2 border-2 rounded-lg transition-all cursor-pointer flex-1 ${
              assignmentType === 'global'
                ? 'border-[#FF6B35] bg-linear-to-br from-[#FF6B35]/10 to-[#1E3A5F]/10'
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <input
                type="radio"
                name="assignment_type"
                value="global"
                checked={assignmentType === 'global'}
                onChange={(e) => {
                  setAssignmentType(e.target.value as 'global');
                  setSelectedLocation('');
                }}
                className="h-3 w-3 text-[#FF6B35] focus:ring-[#FF6B35]/20 cursor-pointer"
              />
              <span className="ml-2 text-xs font-medium text-gray-700">Global</span>
            </label>

            <label className={`flex items-center p-2 border-2 rounded-lg transition-all cursor-pointer flex-1 ${
              assignmentType === 'branch'
                ? 'border-[#FF6B35] bg-linear-to-br from-[#FF6B35]/10 to-[#1E3A5F]/10'
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <input
                type="radio"
                name="assignment_type"
                value="branch"
                checked={assignmentType === 'branch'}
                onChange={(e) => setAssignmentType(e.target.value as 'branch')}
                className="h-3 w-3 text-[#FF6B35] focus:ring-[#FF6B35]/20 cursor-pointer"
              />
              <span className="ml-2 text-xs font-medium text-gray-700">Branch</span>
            </label>
          </div>

          {assignmentType === 'branch' && (
            <select
              name="location_id"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              required={assignmentType === 'branch'}
              className="flex-1 min-w-[150px] block pl-3 pr-10 py-2.5 text-sm border-2 border-[#1E3A5F]/20 focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] rounded-xl bg-white cursor-pointer font-medium text-[#1E3A5F]"
              style={{ maxHeight: 'none', overflow: 'visible' }}
            >
              <option value="">Select Location</option>
              {locations
                .filter((loc) => loc.is_active)
                .map((location) => (
                  <option key={location.id} value={location.id} className="py-2">
                    {location.name}
                  </option>
                ))}
            </select>
          )}
          
          {/* Hidden input to ensure location_id is empty for global assignments */}
          {assignmentType === 'global' && (
            <input type="hidden" name="location_id" value="" />
          )}
        </div>

        <div className="shrink-0">
          <SubmitButton />
        </div>
      </form>
      {(state?.error || state?.success) && (
        <div className="mt-2 w-full">
          {state?.error && (
            <div className="text-xs sm:text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="text-xs sm:text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
              Updated! Refreshing...
            </div>
          )}
        </div>
      )}
    </div>
  );
}


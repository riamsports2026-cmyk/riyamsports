'use client';

import { debugStaffLocations } from '@/lib/actions/admin/debug-staff';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';

interface DebugStaffFormProps {
  staffUsers: Array<{
    id: string;
    email: string;
    profile?: { full_name: string | null } | null;
    roles: string[];
  }>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35]/30 disabled:opacity-50 cursor-pointer"
    >
      {pending ? 'Checking...' : 'Check Locations'}
    </button>
  );
}

export function DebugStaffForm({ staffUsers }: DebugStaffFormProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [state, formAction] = useActionState(debugStaffLocations, null);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="staff_user_id" className="block text-sm font-medium text-gray-700">
            Select Staff User <span className="text-red-500">*</span>
          </label>
          <select
            id="staff_user_id"
            name="staff_user_id"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2.5 border-2 border-[#1E3A5F]/20 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] cursor-pointer bg-white font-medium text-[#1E3A5F]"
            style={{ maxHeight: 'none', overflow: 'visible' }}
          >
            <option value="">Select a staff user</option>
            {staffUsers.map((user) => (
              <option key={user.id} value={user.id} className="py-2">
                {user.profile?.full_name || user.email} ({user.roles.join(', ')})
              </option>
            ))}
          </select>
        </div>

        <SubmitButton />
      </form>

      {state?.error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{state.error}</p>
        </div>
      )}

      {state && !state.error && (
        <div className="space-y-4 mt-6">
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Location Assignments</h3>
            {state.locationAssignments && state.locationAssignments.length > 0 ? (
              <div className="space-y-2">
                {state.locationAssignments.map((assignment: any) => (
                  <div key={assignment.id} className="p-3 bg-gray-50 rounded">
                    <p className="text-sm">
                      <span className="font-medium">Role:</span> {assignment.role?.name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Location:</span> {assignment.location?.name} (ID: {assignment.location?.id})
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-red-600">⚠️ No location assignments found!</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">North Location Info</h3>
            {state.northLocation ? (
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-sm">
                  <span className="font-medium">Location:</span> {state.northLocation.name} (ID: {state.northLocation.id})
                </p>
                <p className="text-sm mt-2">
                  <span className="font-medium">Bookings at North:</span> {state.northBookings?.length || 0}
                </p>
                {state.northBookings && state.northBookings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {state.northBookings.map((booking) => (
                      <p key={booking.id} className="text-xs">
                        - {booking.booking_id} ({new Date(booking.booking_date).toLocaleDateString()})
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-yellow-600">⚠️ North location not found</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Active Locations</h3>
            <div className="space-y-1">
              {state.allLocations?.map((loc) => (
                <p key={loc.id} className="text-sm">
                  - {loc.name} (ID: {loc.id})
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




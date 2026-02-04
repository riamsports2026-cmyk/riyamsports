import { getAllUsers } from '@/lib/actions/admin/users';
import { Metadata } from 'next';
import { DebugStaffForm } from '@/components/admin/debug-staff-form';

export const metadata: Metadata = {
  title: 'Debug Staff Locations | Admin',
  description: 'Debug staff location assignments',
};

type StaffUser = {
  id: string;
  email: string;
  profile?: { full_name: string | null } | null;
  roles: string[];
};

export default async function DebugStaffPage() {
  const usersResult = await getAllUsers();
  const users = Array.isArray(usersResult) ? usersResult : usersResult.data || [];
  const staffUsers = (users as StaffUser[]).filter((u) => {
    const roles = u.roles ?? [];
    return roles.some((r) => r !== 'customer' && r !== 'admin');
  });

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Debug Staff Locations</h2>
        <p className="mt-1 text-sm text-gray-500">
          Check staff location assignments and bookings
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <DebugStaffForm staffUsers={staffUsers} />
      </div>
    </div>
  );
}


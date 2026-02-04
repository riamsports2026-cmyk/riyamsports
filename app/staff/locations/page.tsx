import { createClient } from '@/lib/supabase/server';
import { getStaffLocationIds } from '@/lib/utils/roles';
import type { Location } from '@/lib/types';
import { Metadata } from 'next';
import { Pagination } from '@/components/pagination';

export const metadata: Metadata = {
  title: 'Locations | Staff',
  description: 'View locations you manage',
};

export default async function StaffLocationsPage({
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

  if (assignedLocationIds.length === 0) {
    return (
      <div className="px-4 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
            📍 Locations
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">
            View locations you manage
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#1E3A5F]/10">
          <div className="text-center py-12 bg-linear-to-br from-[#FF6B35]/5 to-[#1E3A5F]/5">
            <p className="text-sm sm:text-base text-[#1E3A5F] font-medium">No locations assigned to you.</p>
            <p className="text-xs text-gray-600 mt-2">Contact an administrator to assign locations to your role.</p>
          </div>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  // Fetch locations assigned to this staff member
  const { data: locations, error, count } = await supabase
    .from('locations')
    .select('*', { count: 'exact' })
    .in('id', assignedLocationIds)
    .order('name')
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching locations:', error);
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <p className="text-sm text-red-600">Error loading locations. Please try again.</p>
        </div>
      </div>
    );
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);
  type Loc = Location & { phone?: string; email?: string };
  const locs = (locations ?? []) as Loc[];

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
          📍 Locations
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">
          View locations you manage
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#1E3A5F]/10">
        {locs.length === 0 ? (
          <div className="text-center py-12 bg-linear-to-br from-[#FF6B35]/5 to-[#1E3A5F]/5">
            <p className="text-sm sm:text-base text-[#1E3A5F] font-medium">No locations found.</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {locs.map((location) => (
                <li key={location.id} className="hover:bg-[#FF6B35]/5 transition-colors">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F]">{location.name}</h3>
                          {!location.is_active && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border-2 border-red-300">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p>📍 {location.address}</p>
                          <p>
                            {location.city}, {location.state} - {location.pincode}
                          </p>
                          {location.phone && (
                            <p className="mt-1">📱 Phone: {location.phone}</p>
                          )}
                          {location.email && (
                            <p>✉️ Email: {location.email}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={limit}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}



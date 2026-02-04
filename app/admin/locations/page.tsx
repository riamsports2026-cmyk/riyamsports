import { getAllLocations } from '@/lib/actions/admin/locations';
import { getAllServices } from '@/lib/actions/admin/services';
import { getLocationServiceIds } from '@/lib/actions/admin/location-services';
import { LocationForm } from '@/components/admin/location-form';
import { DeleteLocationButton } from '@/components/admin/delete-location-button';
import { LocationServicesManager } from '@/components/admin/location-services-manager';
import { Pagination } from '@/components/pagination';
import { SearchFilter } from '@/components/ui/search-filter';
import { StatusFilter } from '@/components/ui/status-filter';
import { Loader } from '@/components/ui/loader';
import { Suspense } from 'react';

export default async function AdminLocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    search?: string;
    is_active?: string;
  }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const limit = 20;
  
  const [locationsResult, allServicesResult] = await Promise.all([
    getAllLocations({ 
      page, 
      limit,
      sortBy: params.sort_by || 'created_at',
      sortOrder: params.sort_order || 'desc',
      search: params.search,
      is_active: params.is_active ? params.is_active === 'true' : undefined,
    }),
    getAllServices({ page: 1, limit: 1000 }), // Get all for dropdown
  ]);
  
  const locations = locationsResult.data;
  const { total, totalPages } = locationsResult;
  const allServices = allServicesResult.data || [];

  // Fetch service IDs for each location
  const locationServiceIdsMap = new Map<string, string[]>();
  await Promise.all(
    locations.map(async (location) => {
      const serviceIds = await getLocationServiceIds(location.id);
      locationServiceIdsMap.set(location.id, serviceIds);
    })
  );

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
            📍 Locations
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">Manage turf locations</p>
        </div>
        <div className="shrink-0">
          <LocationForm />
        </div>
      </div>

      <Suspense fallback={
        <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-[#1E3A5F]/10 mb-6">
          <Loader size="sm" />
        </div>
      }>
        <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SearchFilter placeholder="Search locations by name, address, or city..." />
            <StatusFilter label="Status" />
          </div>
        </div>
      </Suspense>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#1E3A5F]/10">
        <ul className="divide-y divide-gray-200">
          {locations.map((location) => (
            <li key={location.id} className="hover:bg-[#FF6B35]/5 transition-colors">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F]">{location.name}</h3>
                      {!location.is_active && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border-2 border-red-300">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{location.address}</p>
                      <p>{location.city}, {location.state} - {location.pincode}</p>
                    </div>
                    <div className="mt-3">
                      <LocationServicesManager
                        location={location}
                        allServices={allServices}
                        currentServiceIds={locationServiceIdsMap.get(location.id) || []}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <LocationForm location={location} />
                    <DeleteLocationButton locationId={location.id} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {locations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No locations found. Create your first location.</p>
          </div>
        )}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={limit}
          />
        )}
      </div>
    </div>
  );
}


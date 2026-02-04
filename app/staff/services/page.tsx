import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getStaffLocationIds } from '@/lib/utils/roles';
import { Metadata } from 'next';
import { Pagination } from '@/components/pagination';
import { SafeImage } from '@/components/ui/safe-image';

export const metadata: Metadata = {
  title: 'Services | Staff',
  description: 'View services you manage',
};

export default async function StaffServicesPage({
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

  const serviceClient = await createServiceClient();

  type ServiceRow = { id: string; name: string; description?: string | null; image_url?: string | null; is_active?: boolean };

  // If no locations assigned, show all services (admin case)
  if (assignedLocationIds.length === 0) {
    const { data: allServicesRaw, error: servicesError, count } = await serviceClient
      .from('services')
      .select('*', { count: 'exact' })
      .order('name')
      .range(offset, offset + limit - 1);

    const allServices = (allServicesRaw ?? []) as ServiceRow[];

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return (
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center py-12">
            <p className="text-sm text-red-600">Error loading services. Please try again.</p>
          </div>
        </div>
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return (
      <div className="px-4 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
            ⚽ Services
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">
            View services available at your assigned locations
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#1E3A5F]/10">
          {allServices && allServices.length === 0 ? (
            <div className="text-center py-12 bg-linear-to-br from-[#FF6B35]/5 to-[#1E3A5F]/5">
              <p className="text-sm sm:text-base text-[#1E3A5F] font-medium">No services found for your assigned locations.</p>
              <p className="text-xs text-gray-600 mt-2">Services may not be assigned to your locations yet.</p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-200">
                {allServices.map((service) => (
                  <li key={service.id} className="hover:bg-[#FF6B35]/5 transition-colors">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {service.image_url && (
                              <div className="shrink-0">
                                <SafeImage
                                  src={service.image_url}
                                  alt={service.name}
                                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg object-cover border-2 border-gray-200"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F]">{service.name}</h3>
                              {!service.is_active && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border-2 border-red-300">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                          {service.description && (
                            <p className="mt-2 text-sm text-gray-600">{service.description}</p>
                          )}
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

  type LsRow = { service_id: string };
  type TurfRow = { service_id: string };
  type LocRow = { id: string; name: string };
  type SlRow = { location_id: string };
  type StRow = { location_id: string };

  // Get services available at assigned locations via location_services table
  const { data: locationServicesRaw } = await serviceClient
    .from('location_services')
    .select('service_id')
    .in('location_id', assignedLocationIds)
    .eq('is_active', true);

  const locationServices = (locationServicesRaw ?? []) as LsRow[];
  const { data: turfsRaw } = await serviceClient
    .from('turfs')
    .select('service_id')
    .in('location_id', assignedLocationIds)
    .eq('is_available', true);

  const turfs = (turfsRaw ?? []) as TurfRow[];

  const serviceIdsSet = new Set<string>();
  locationServices.forEach((ls) => serviceIdsSet.add(ls.service_id));
  turfs.forEach((t) => serviceIdsSet.add(t.service_id));

  let serviceIds = Array.from(serviceIdsSet);

  const useFallback = serviceIds.length === 0;
  if (useFallback) {
    const { data: allActiveServicesRaw } = await serviceClient
      .from('services')
      .select('id')
      .eq('is_active', true)
      .limit(100);
    
    const allActiveServices = (allActiveServicesRaw ?? []) as { id: string }[];
    if (allActiveServices.length > 0) {
      serviceIds = allActiveServices.map((s) => s.id);
    }
  }

  if (serviceIds.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Services</h2>
          <p className="mt-1 text-sm text-gray-500">
            View services available at your assigned locations
          </p>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No services found for your assigned locations.</p>
            <p className="text-xs text-gray-400 mt-2">Services may not be assigned to your locations yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const { data: servicesRaw, error: servicesError, count } = await serviceClient
    .from('services')
    .select('*', { count: 'exact' })
    .in('id', serviceIds)
    .order('name')
    .range(offset, offset + limit - 1);

  const services = (servicesRaw ?? []) as ServiceRow[];

  if (servicesError) {
    console.error('Error fetching services:', servicesError);
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <p className="text-sm text-red-600">Error loading services. Please try again.</p>
        </div>
      </div>
    );
  }

  const { data: locationsRaw } = await serviceClient
    .from('locations')
    .select('id, name')
    .in('id', assignedLocationIds);

  const locations = (locationsRaw ?? []) as LocRow[];
  const locationMap = new Map(locations.map((loc) => [loc.id, loc.name]));

  const servicesWithLocationNames = await Promise.all(
    services.map(async (service) => {
      const { data: serviceLocationsRaw } = await serviceClient
        .from('location_services')
        .select('location_id')
        .eq('service_id', service.id)
        .in('location_id', assignedLocationIds)
        .eq('is_active', true);

      const { data: serviceTurfsRaw } = await serviceClient
        .from('turfs')
        .select('location_id')
        .eq('service_id', service.id)
        .in('location_id', assignedLocationIds)
        .eq('is_available', true);

      const serviceLocations = (serviceLocationsRaw ?? []) as SlRow[];
      const serviceTurfs = (serviceTurfsRaw ?? []) as StRow[];

      const locationIdsSet = new Set<string>();
      serviceLocations.forEach((sl) => locationIdsSet.add(sl.location_id));
      serviceTurfs.forEach((st) => locationIdsSet.add(st.location_id));

      const locationNames = Array.from(locationIdsSet)
        .map((id) => locationMap.get(id))
        .filter((n): n is string => !!n);

      return { service, locationNames };
    })
  );

  const filteredServices = servicesWithLocationNames;

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Services</h2>
        <p className="mt-1 text-sm text-gray-500">
          View services available at your assigned locations
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No services found for your assigned locations.</p>
            {assignedLocationIds.length === 0 && (
              <p className="text-xs text-gray-400 mt-2">Contact an administrator to assign locations to your role.</p>
            )}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {filteredServices.map(({ service, locationNames }) => (
                <li key={service.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {service.image_url && (
                            <div className="shrink-0">
                              <SafeImage
                                src={service.image_url}
                                alt={service.name}
                                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg object-cover border-2 border-gray-200"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                              {!service.is_active && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Inactive
                                </span>
                              )}
                            </div>
                            {service.description && (
                              <p className="mt-2 text-sm text-gray-500">{service.description}</p>
                            )}
                            {locationNames.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500">Available at:</p>
                                <p className="text-sm text-gray-700">{locationNames.join(', ')}</p>
                              </div>
                            )}
                          </div>
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


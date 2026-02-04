import { getAllServices, getServiceLocations } from '@/lib/actions/admin/services';
import { getAllLocations } from '@/lib/actions/admin/locations';
import { getServicePricing } from '@/lib/actions/admin/service-pricing';
import { ServiceForm } from '@/components/admin/service-form';
import { DeleteServiceButton } from '@/components/admin/delete-service-button';
import { ServicePricingManager } from '@/components/admin/service-pricing-manager';
import { Pagination } from '@/components/pagination';
import { SafeImage } from '@/components/ui/safe-image';
import { SearchFilter } from '@/components/ui/search-filter';
import { StatusFilter } from '@/components/ui/status-filter';
import { Loader } from '@/components/ui/loader';
import { Suspense } from 'react';

export default async function AdminServicesPage({
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
  
  const [servicesResult, locationsResult] = await Promise.all([
    getAllServices({ 
      page, 
      limit,
      sortBy: params.sort_by || 'created_at',
      sortOrder: params.sort_order || 'desc',
      search: params.search,
      is_active: params.is_active ? params.is_active === 'true' : undefined,
    }),
    getAllLocations({ page: 1, limit: 1000 }), // Get all for dropdown
  ]);
  
  const services = servicesResult.data;
  const { total, totalPages } = servicesResult;
  const locations = locationsResult.data || [];

  // Fetch all service locations and pricing in parallel
  const serviceLocationsMap = new Map<string, string[]>();
  const servicePricingMap = new Map<string, Array<{ hour: number; price: number }>>();
  await Promise.all(
    services.map(async (service) => {
      const [locationIds, pricing] = await Promise.all([
        getServiceLocations(service.id),
        getServicePricing(service.id),
      ]);
      serviceLocationsMap.set(service.id, locationIds);
      servicePricingMap.set(service.id, pricing);
    })
  );

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
            ⚽ Sports/Services
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">Manage sports and services</p>
        </div>
        <ServiceForm locations={locations} />
      </div>

      <Suspense fallback={
        <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-[#1E3A5F]/10 mb-6">
          <Loader size="sm" />
        </div>
      }>
        <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SearchFilter placeholder="Search services by name or description..." />
            <StatusFilter label="Status" />
          </div>
        </div>
      </Suspense>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#1E3A5F]/10">
        <ul className="divide-y divide-gray-200">
          {services.map((service) => (
            <li key={service.id} className="hover:bg-[#FF6B35]/5 transition-colors">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                    <div className="mt-3">
                      <ServicePricingManager
                        serviceId={service.id}
                        initialPricing={servicePricingMap.get(service.id) || []}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <ServiceForm 
                      service={service} 
                      locations={locations}
                      serviceLocationIds={serviceLocationsMap.get(service.id) || []}
                    />
                    <DeleteServiceButton serviceId={service.id} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {services.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No services found. Create your first service.</p>
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


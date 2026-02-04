import { getServicesByLocation } from '@/lib/actions/services';

interface ServicesListProps {
  locationId: string;
}

export async function ServicesList({ locationId }: ServicesListProps) {
  const services = await getServicesByLocation(locationId);

  if (services.length === 0) {
    return (
      <div className="text-xs text-gray-400">
        No sports available at this location
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {services.map((service: any) => (
        <span
          key={service.id}
          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
        >
          {service.name}
        </span>
      ))}
    </div>
  );
}



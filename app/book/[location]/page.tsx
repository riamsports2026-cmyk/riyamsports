import { getLocation } from '@/lib/actions/locations';
import { getServicesByLocation } from '@/lib/actions/services';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SafeImage } from '@/components/ui/safe-image';

type LocData = { id: string; name: string; address: string; city: string; state: string; pincode: string };

interface PageProps {
  params: Promise<{ location: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { location: locId } = await params;
  const loc = await getLocation(locId) as LocData | null;

  return {
    title: loc ? `${loc.name} | RIAM Sports` : 'Location Not Found',
    description: loc ? `Book turf at ${loc.name}` : 'Location not found',
  };
}

export default async function LocationPage({ params }: PageProps) {
  const { location: locId } = await params;
  const locationData = (await getLocation(locId)) as LocData | null;
  const services = await getServicesByLocation(locId);

  if (!locationData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/book"
            className="text-[#FF6B35] hover:text-[#E55A2B] text-sm font-medium cursor-pointer"
          >
            ← Back to Locations
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">{locationData.name}</h1>
          <p className="mt-2 text-gray-600">{locationData.address}</p>
          <p className="text-sm text-gray-500">
            {locationData.city}, {locationData.state} - {locationData.pincode}
          </p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No services available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/book/${locId}/${service.id}`}
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer"
              >
                <div className="w-full aspect-video overflow-hidden bg-gray-100">
                  <SafeImage
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full min-h-[200px] sm:min-h-[240px] md:min-h-[280px] object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900">{service.name}</h2>
                  {service.description && (
                    <p className="mt-2 text-gray-600 text-sm">{service.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


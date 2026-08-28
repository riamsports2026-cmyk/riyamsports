import { getLocation } from '@/lib/actions/locations';
import { getService } from '@/lib/actions/services';
import { getTurfs } from '@/lib/actions/turfs';
import { autoCreateTurfForLocationService } from '@/lib/actions/admin/auto-create-turfs';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookingForm } from '@/components/booking-form';
import { SafeImage } from '@/components/ui/safe-image';

type LocData = { id: string; name: string; address: string; city: string; state: string; pincode: string; is_active?: boolean; created_at?: string };
type SvcData = { id: string; name: string; description: string | null; image_url: string | null; is_active?: boolean; created_at?: string };

interface PageProps {
  params: Promise<{ location: string; service: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { location: locId, service: svcId } = await params;
  const loc = (await getLocation(locId)) as LocData | null;
  const svc = (await getService(svcId)) as SvcData | null;

  return {
    title: loc && svc ? `${svc.name} at ${loc.name} | RIAM Sports` : 'Not Found',
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { location: locId, service: svcId } = await params;
  const locationData = (await getLocation(locId)) as LocData | null;
  const serviceData = (await getService(svcId)) as SvcData | null;

  if (!locationData || !serviceData) {
    notFound();
  }

  let turfs = await getTurfs(locId, svcId);

  if (turfs.length === 0) {
    const result = await autoCreateTurfForLocationService(locId, svcId);
    if (result.success) {
      turfs = await getTurfs(locId, svcId);
    }
  }

  if (turfs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/book/${locId}`}
            className="text-[#FF6B35] hover:text-[#E55A2B] text-sm font-medium cursor-pointer"
          >
            ← Back
          </Link>
          <div className="text-center py-12 mt-8">
            <p className="text-gray-500">No turfs available for this service at this location.</p>
            <p className="text-gray-400 text-sm mt-2">
              Please contact the administrator to set up this service at this location.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F5F7FA] via-white to-[#FF6B35]/5 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <Link
            href={`/book/${locId}`}
            className="inline-flex items-center text-[#1E3A5F] hover:text-[#FF6B35] text-sm sm:text-base font-semibold mb-4 transition-colors group"
          >
            <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {locationData.name}
          </Link>
          <div className="bg-linear-to-br from-white to-[#FF6B35]/5 rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-[#1E3A5F]/10">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="shrink-0 w-full sm:w-48 md:w-56 lg:w-64">
                <div className="aspect-video sm:aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <SafeImage
                    src={serviceData.image_url}
                    alt={serviceData.name}
                    className="w-full h-full min-h-[200px] sm:min-h-[192px] md:min-h-[224px] lg:min-h-[256px] object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent mb-2">
                  {serviceData.name}
                </h1>
                {serviceData.description && (
                  <p className="text-gray-600 mb-3">{serviceData.description}</p>
                )}
                <div className="flex items-center text-sm sm:text-base text-[#1E3A5F] font-medium">
                  <svg className="w-4 h-4 mr-1.5 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {locationData.name}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {turfs.map((turf) => (
            <BookingForm
              key={turf.id}
              turf={turf}
              location={{ ...locationData, is_active: locationData?.is_active ?? true, created_at: locationData?.created_at ?? '' }}
              service={{ ...serviceData, is_active: serviceData?.is_active ?? true, created_at: serviceData?.created_at ?? '' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}



import { getLocations } from '@/lib/actions/locations';
import { getServices } from '@/lib/actions/services';
import { Metadata } from 'next';
import { BookLocationSelector } from '@/components/book-location-selector';

export const metadata: Metadata = {
  title: 'Book Turf | RIAM Sports',
  description: 'Book your favorite turf at RIAM Sports',
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; service?: string }>;
}) {
  const locations = await getLocations();
  const services = await getServices();
  const params = await searchParams;
  const initialLocationId = params.location || undefined;
  const initialServiceId = params.service || undefined;

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F5F7FA] via-white to-[#FF6B35]/5 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BookLocationSelector
          locations={locations}
          services={services}
          initialLocationId={initialLocationId}
          initialServiceId={initialServiceId}
        />
      </div>
    </div>
  );
}



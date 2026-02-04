import { NextRequest, NextResponse } from 'next/server';
import { getLocationsByService, getLocationsByServices } from '@/lib/actions/locations';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serviceId = searchParams.get('serviceId');
  const serviceIds = searchParams.get('serviceIds');

  try {
    if (serviceIds) {
      const ids = serviceIds.split(',').map((s) => s.trim()).filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json({ error: 'serviceIds must contain at least one ID' }, { status: 400 });
      }
      const locations = await getLocationsByServices(ids);
      return NextResponse.json({ locations });
    }
    if (serviceId) {
      const locations = await getLocationsByService(serviceId);
      return NextResponse.json({ locations });
    }
    return NextResponse.json({ error: 'serviceId or serviceIds is required' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}




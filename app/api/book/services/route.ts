import { NextRequest, NextResponse } from 'next/server';
import { getServicesByLocation } from '@/lib/actions/services';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locationId = searchParams.get('locationId');

  if (!locationId) {
    return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
  }

  try {
    const services = await getServicesByLocation(locationId);
    return NextResponse.json({ services });
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch services' },
      { status: 500 }
    );
  }
}





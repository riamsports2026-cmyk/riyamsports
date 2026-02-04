import { getAvailableSlots } from '@/lib/actions/turfs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(id, date);
    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch slots' },
      { status: 500 }
    );
  }
}



'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { createClient } from '@/lib/supabase/server';

/**
 * Debug function to check staff location assignments
 * Only accessible by admins
 */
export async function debugStaffLocations(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const staffUserId = formData.get('staff_user_id') as string;

  if (!staffUserId) {
    return { error: 'Staff user ID is required' };
  }

  const serviceClient = await createServiceClient();

  // Get staff's location assignments
  const { data: locationAssignments, error: locationError } = await serviceClient
    .from('user_role_locations')
    .select('*, role:roles(name), location:locations(id, name)')
    .eq('user_id', staffUserId);

  // Get all locations
  const { data: allLocations } = await serviceClient
    .from('locations')
    .select('id, name')
    .eq('is_active', true);

  type LocRow = { id: string; name: string };
  type TurfRow = { id: string };
  type BookingRow = { id: string; booking_id: string; turf_id: string; booking_date: string };

  const { data: northLocationRaw } = await serviceClient
    .from('locations')
    .select('id, name')
    .ilike('name', '%north%')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const northLocation = northLocationRaw as LocRow | null;
  let northBookings: BookingRow[] = [];

  if (northLocation) {
    const { data: northTurfsRaw } = await serviceClient
      .from('turfs')
      .select('id')
      .eq('location_id', northLocation.id);

    const northTurfs = (northTurfsRaw ?? []) as TurfRow[];
    if (northTurfs.length > 0) {
      const turfIds = northTurfs.map((t) => t.id);
      const { data: bookingsRaw } = await serviceClient
        .from('bookings')
        .select('id, booking_id, turf_id, booking_date')
        .in('turf_id', turfIds)
        .limit(10);

      northBookings = (bookingsRaw ?? []) as BookingRow[];
    }
  }

  const locAssignments = (locationAssignments ?? []) as unknown[];
  const allLocs = (allLocations ?? []) as LocRow[];

  return {
    staffUserId,
    locationAssignments: locAssignments,
    allLocations: allLocs,
    northLocation,
    northBookings,
    error: locationError?.message,
  };
}


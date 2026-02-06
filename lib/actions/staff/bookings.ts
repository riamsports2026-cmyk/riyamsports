'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getStaffLocationIds, isStaff } from '@/lib/utils/roles';
import { BookingWithDetails } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getStaffBookings(filters?: {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

  if (!user) {
    console.warn(`[getStaffBookings] No user found`);
    return { data: [], total: 0, page, totalPages: 0 };
  }

  const isStaffUser = await isStaff(user.id);
  if (!isStaffUser) {
    console.warn(`[getStaffBookings] User ${user.id} (${user.email}) is not staff`);
    return { data: [], total: 0, page, totalPages: 0 };
  }

  const serviceClient = await createServiceClient();

  // Get staff's assigned location IDs (using service client to bypass RLS)
  const locationIds = await getStaffLocationIds(user.id);
  console.log(`[getStaffBookings] Staff user ${user.id} (${user.email}) - location IDs:`, locationIds);

  if (locationIds.length === 0) {
    console.warn(`[getStaffBookings] Staff user ${user.id} (${user.email}) has no assigned locations`);
    
    // Debug: Check what's in user_role_locations
    const { data: debugLocations } = await serviceClient
      .from('user_role_locations')
      .select('*, role:roles(name), location:locations(id, name)')
      .eq('user_id', user.id);
    console.log(`[getStaffBookings] DEBUG - user_role_locations records:`, JSON.stringify(debugLocations, null, 2));
    
    return { data: [], total: 0, page, totalPages: 0 };
  }

  console.log(`[getStaffBookings] Staff user ${user.id} has ${locationIds.length} location(s):`, locationIds);

  // First, get all turf IDs for the staff's assigned locations
  const { data: turfs, error: turfsError } = await serviceClient
    .from('turfs')
    .select('id, location_id, name')
    .in('location_id', locationIds);

  if (turfsError) {
    console.error('[getStaffBookings] Error fetching turfs:', turfsError);
    return { data: [], total: 0, page, totalPages: 0 };
  }

  if (!turfs || turfs.length === 0) {
    console.warn(`[getStaffBookings] No turfs found for locations: ${locationIds.join(', ')}`);
    
    // Debug: Check what locations exist
    const { data: allLocations } = await serviceClient
      .from('locations')
      .select('id, name')
      .eq('is_active', true);
    console.log(`[getStaffBookings] DEBUG - All active locations:`, JSON.stringify(allLocations, null, 2));
    
    // Debug: Check what turfs exist
    const { data: allTurfs } = await serviceClient
      .from('turfs')
      .select('id, location_id, name, location:locations(id, name)')
      .limit(10);
    console.log(`[getStaffBookings] DEBUG - Sample turfs:`, JSON.stringify(allTurfs, null, 2));
    
    return { data: [], total: 0, page, totalPages: 0 };
  }

  const turfIds = turfs.map((turf: any) => turf.id);
  const turfIdToLocationId = new Map<string, string>(
    turfs.map((t: any) => [t.id, t.location_id])
  );

  let startDate = filters?.startDate;
  let endDate = filters?.endDate;
  let startTime = filters?.startTime;
  let endTime = filters?.endTime;
  if (startDate && endDate && startDate > endDate) {
    [startDate, endDate] = [endDate, startDate];
  }
  if (startTime && endTime && startTime > endTime) {
    [startTime, endTime] = [endTime, startTime];
  }

  console.log(`[getStaffBookings] Found ${turfs.length} turf(s) for locations. Turf details:`, 
    turfs.map((t: any) => ({ id: t.id, name: t.name, location_id: t.location_id }))
  );

  // Build query for bookings with count
  let query = serviceClient
    .from('bookings')
    .select(`
      *,
      turf:turfs(
        *,
        location:locations(*),
        service:services(*)
      ),
      slots:booking_slots(*),
      payments:payments(*)
    `, { count: 'exact' })
    .in('turf_id', turfIds);

  // Apply date filters (past, future, or mixed; start <= end enforced)
  if (startDate) {
    query = query.gte('booking_date', startDate);
  }
  if (endDate) {
    query = query.lte('booking_date', endDate);
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'created_at';
  const sortOrder = filters?.sortOrder || 'desc';
  
  // Map sortBy to actual column names
  let orderColumn = 'created_at';
  switch (sortBy) {
    case 'booking_date':
      orderColumn = 'booking_date';
      break;
    case 'total_amount':
      orderColumn = 'total_amount';
      break;
    case 'booking_status':
      orderColumn = 'booking_status';
      break;
    case 'payment_status':
      orderColumn = 'payment_status';
      break;
    case 'created_at':
    default:
      orderColumn = 'created_at';
      break;
  }

  const { data, error, count: totalCount } = await query
    .order(orderColumn, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);
  const total = totalCount ?? 0;

  if (error) {
    console.error('Error fetching bookings:', error);
    return { data: [], total: 0, page, totalPages: 0 };
  }

  if (!data || data.length === 0) {
    console.log(`[getStaffBookings] No bookings found for ${turfIds.length} turf(s) with IDs:`, turfIds);
    const totalPages = Math.ceil(total / limit);
    return { data: [], total: 0, page, totalPages };
  }

  console.log(`[getStaffBookings] Found ${data.length} booking(s) before filtering`);

  // Filter bookings to only include those at staff's locations (double-check).
  // Use turf_id (always present) + turfIdToLocationId map; nested turf/location may be missing in the response.
  let filteredBookings = data.filter((booking: any) => {
    const turfId = booking.turf_id ?? booking.turf?.id;
    const locationId =
      (turfId ? turfIdToLocationId.get(turfId) : null) ??
      (booking.turf?.location?.id as string | undefined);
    const isInAssignedLocation = !!locationId && locationIds.includes(locationId);

    if (!isInAssignedLocation) {
      if (!turfId) {
        console.warn(`[getStaffBookings] Booking ${booking.booking_id} has no turf_id; skipping`);
      } else if (!locationId) {
        console.warn(`[getStaffBookings] Booking ${booking.booking_id} turf ${turfId} has no location; skipping`);
      } else {
        console.warn(`[getStaffBookings] Booking ${booking.booking_id} turf location ${locationId} not in assigned locations ${locationIds.join(', ')}`);
      }
    }

    return isInAssignedLocation;
  });

  // Apply time filters (filter by booking slots)
  if (startTime || endTime) {
    filteredBookings = filteredBookings.filter((booking: any) => {
      if (!booking.slots || booking.slots.length === 0) return false;
      const slotHours = booking.slots.map((s: any) => s.hour).sort((a: number, b: number) => a - b);
      const minHour = Math.min(...slotHours);
      const maxHour = Math.max(...slotHours);
      if (startTime) {
        const startHour = parseInt(startTime.split(':')[0]);
        if (maxHour < startHour) return false;
      }
      if (endTime) {
        const endHour = parseInt(endTime.split(':')[0]);
        if (minHour > endHour) return false;
      }
      return true;
    });
  }

  // Recalculate total based on filtered results
  // Since we're filtering after pagination, we need to adjust the total
  // For accurate pagination, we should get all bookings, filter, then paginate
  // But for performance, we'll use the count from the query and adjust if needed
  const totalPages = Math.ceil(total / limit);

  console.log(`[getStaffBookings] Returning ${filteredBookings.length} booking(s) after filtering (total: ${total}, page: ${page}, totalPages: ${totalPages})`);
  
  return {
    data: filteredBookings as BookingWithDetails[],
    total,
    page,
    totalPages,
  };
}

export async function updateBookingStatus(
  bookingId: string,
  status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled'
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isStaff(user.id))) {
    return { error: 'Unauthorized' };
  }

  // Verify booking belongs to staff's location
  const locationIds = await getStaffLocationIds(user.id);
  const serviceClient = await createServiceClient();

  const { data: bookRow } = await serviceClient
    .from('bookings')
    .select('booking_status, turf:turfs(location_id)')
    .eq('id', bookingId)
    .single();
  const booking = bookRow as { booking_status?: string; turf?: { location_id?: string } } | null;

  if (!booking || !locationIds.includes(booking.turf?.location_id ?? '')) {
    return { error: 'Unauthorized: Booking not in your assigned locations' };
  }

  if (booking.booking_status === 'cancelled') {
    return { error: 'Cannot change status of a cancelled booking.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient.from('bookings') as any)
    .update({ booking_status: status })
    .eq('id', bookingId);

  if (error) {
    return { error: error.message };
  }

  const { BookingReminderService } = await import('@/lib/services/booking-reminders');
  if (status === 'cancelled') {
    BookingReminderService.sendCancellationByBookingId(bookingId).then((res) => {
      if (res?.error) console.error('[WhatsApp] Cancellation send failed:', res.error);
    }).catch((err) => {
      console.error('[WhatsApp] Cancellation send error:', err instanceof Error ? err.message : err);
    });
  } else if (status === 'confirmed') {
    BookingReminderService.sendConfirmationByBookingId(bookingId).then((res) => {
      if (res?.error) console.error('[WhatsApp] Confirmation send failed:', res.error);
    }).catch((err) => {
      console.error('[WhatsApp] Confirmation send error:', err instanceof Error ? err.message : err);
    });
  }

  return { success: true };
}

export async function updateReceivedBalance(
  bookingId: string,
  receivedAmount: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isStaff(user.id))) {
    return { error: 'Unauthorized' };
  }

  // Verify booking belongs to staff's location
  const locationIds = await getStaffLocationIds(user.id);
  const serviceClient = await createServiceClient();

  const { data: bookRow, error: bookingError } = await serviceClient
    .from('bookings')
    .select('total_amount, received_amount, turf:turfs(location_id)')
    .eq('id', bookingId)
    .single();
  const booking = bookRow as {
    total_amount: number;
    received_amount?: number | null;
    turf?: { location_id?: string };
  } | null;

  if (bookingError || !booking) {
    return { error: 'Booking not found' };
  }

  if (!locationIds.includes(booking.turf?.location_id ?? '')) {
    return { error: 'Unauthorized: Booking not in your assigned locations' };
  }

  // Validate received amount
  if (receivedAmount < 0) {
    return { error: 'Received amount cannot be negative' };
  }

  if (receivedAmount > booking.total_amount) {
    return { error: 'Received amount cannot exceed total amount' };
  }

  // Calculate the difference (new payment amount)
  const currentReceived = Number(booking.received_amount || 0);
  const paymentDifference = receivedAmount - currentReceived;

  if (paymentDifference > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: paymentError } = await (serviceClient.from('payments') as any).insert({
      booking_id: bookingId,
      amount: paymentDifference,
      payment_type: 'manual',
      payment_gateway: 'manual',
      gateway_order_id: `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      status: 'success',
      payment_method: 'manual',
      notes: 'Manual balance update by staff',
    });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Continue with booking update even if payment record fails
    }
  }

  // Determine payment status based on received amount
  let paymentStatus: 'pending_payment' | 'partial' | 'paid' = 'pending_payment';
  if (receivedAmount >= booking.total_amount) {
    paymentStatus = 'paid';
  } else if (receivedAmount > 0) {
    paymentStatus = 'partial';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient.from('bookings') as any)
    .update({
      received_amount: receivedAmount,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (error) {
    return { error: error.message };
  }

  // WhatsApp payment success when staff records payment (so customer gets notified)
  if (paymentDifference > 0) {
    const { BookingReminderService } = await import('@/lib/services/booking-reminders');
    BookingReminderService.sendPaymentSuccessByBookingId(bookingId, paymentDifference).then((res) => {
      if (res?.error) console.error('[WhatsApp] Payment success send failed:', res.error);
    }).catch((err) => {
      console.error('[WhatsApp] Payment success send error:', err instanceof Error ? err.message : err);
    });
  }

  revalidatePath('/staff');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin');

  return { success: true, paymentStatus };
}



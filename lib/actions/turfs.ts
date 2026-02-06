'use server';

import { createClient } from '@/lib/supabase/server';
import { TurfWithDetails } from '@/lib/types';

export async function getTurfs(locationId: string, serviceId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('turfs')
    .select(`
      *,
      location:locations(*),
      service:services(*),
      pricing:hourly_pricing(*)
    `)
    .eq('location_id', locationId)
    .eq('is_available', true);

  if (serviceId) {
    query = query.eq('service_id', serviceId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data as TurfWithDetails[];
}

export async function getTurf(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('turfs')
    .select(`
      *,
      location:locations(*),
      service:services(*),
      pricing:hourly_pricing(*)
    `)
    .eq('id', id)
    .eq('is_available', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as TurfWithDetails;
}

export async function getAvailableSlots(
  turfId: string,
  date: string
): Promise<number[]> {
  const supabase = await createClient();

  // Only confirmed and pending_payment bookings hold slots. Cancelled/completed do not — slots are available to others.
  const { data: bookings } = await supabase
    .from('bookings')
    .select('booking_slots(hour)')
    .eq('turf_id', turfId)
    .eq('booking_date', date)
    .in('booking_status', ['confirmed', 'pending_payment']);

  if (!bookings) {
    return [];
  }

  const bookedHours = new Set<number>();
  bookings.forEach((booking: any) => {
    booking.booking_slots?.forEach((slot: any) => {
      bookedHours.add(slot.hour);
    });
  });

  const { data: pricing } = await supabase
    .from('hourly_pricing')
    .select('hour, price')
    .eq('turf_id', turfId)
    .order('hour');

  const rows = (pricing ?? []) as { price: number; hour: number }[];
  if (rows.length === 0) {
    return [];
  }

  const allHours = rows.filter((p) => p.price > 0).map((p) => p.hour);

  // Return all unbooked hours that have pricing. Past-hour filtering for "today"
  // is done on the client so the user's local timezone is used (server may be UTC).
  const availableHours = allHours.filter((hour) => !bookedHours.has(hour));
  return availableHours;
}



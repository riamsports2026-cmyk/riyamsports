'use server';

import { createClient } from '@/lib/supabase/server';

function logSupabaseError(context: string, error: unknown) {
  // PostgrestError has non-enumerable fields; stringify often shows {}
  const e = error as any;
  console.error(context, {
    message: e?.message,
    code: e?.code,
    details: e?.details,
    hint: e?.hint,
    raw: e,
  });
}

export async function getLocations() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // All authenticated users can see active locations
  // RLS policy "Everyone can view active locations" handles access control
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    logSupabaseError('Error fetching locations:', error);
    return [];
  }

  return data || [];
}

export async function getLocation(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // All authenticated users can see active locations
  // RLS policy handles access control
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    logSupabaseError('Error fetching location:', error);
    return null;
  }

  return data as Location | null;
}

export async function getLocationsByService(serviceId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const locationMap = new Map();

  // First, get locations from location_services table (explicit service-location links)
  const { data: locationServices, error: lsError } = await supabase
    .from('location_services')
    .select('location:locations(*)')
    .eq('service_id', serviceId)
    .eq('is_active', true);

  if (!lsError && locationServices) {
    locationServices.forEach((item: any) => {
      const location = item.location;
      if (location && location.is_active && !locationMap.has(location.id)) {
        locationMap.set(location.id, location);
      }
    });
  }

  // Also get locations that have turfs for this service (fallback/backward compatibility)
  const { data: turfsData, error: turfsError } = await supabase
    .from('turfs')
    .select('location:locations(*)')
    .eq('service_id', serviceId)
    .eq('is_available', true);

  if (!turfsError && turfsData) {
    turfsData.forEach((item: any) => {
      const location = item.location;
      if (location && location.is_active && !locationMap.has(location.id)) {
        locationMap.set(location.id, location);
      }
    });
  }

  const locations = Array.from(locationMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  return locations;
}

/**
 * Get locations that offer ANY of the given sports (multi-select).
 *
 * Example: Sport A (Football) and Sport B (Basketball) selected.
 * - Location X has Football only  → included (has A).
 * - Location Y has Basketball only → included (has B).
 * - Location Z has BOTH Football and Basketball → included ONCE (we dedupe by location id).
 *
 * Implementation: fetch locations per sport, merge into a Map keyed by location.id
 * so each location appears at most once. Result = union of all locations across selected sports.
 */
export async function getLocationsByServices(serviceIds: string[]) {
  if (serviceIds.length === 0) return [];
  const locationMap = new Map<string, unknown>();
  for (const serviceId of serviceIds) {
    const locs = await getLocationsByService(serviceId);
    locs.forEach((loc: any) => {
      if (loc?.id && !locationMap.has(loc.id)) locationMap.set(loc.id, loc);
    });
  }
  return Array.from(locationMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
}

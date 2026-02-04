'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { revalidatePath } from 'next/cache';

export async function getLocationServiceIds(locationId: string): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return [];
  }

  const serviceClient = await createServiceClient();

  // Try location_services table first
  try {
    const { data: locationServices, error } = await serviceClient
      .from('location_services')
      .select('service_id')
      .eq('location_id', locationId)
      .eq('is_active', true);

    if (!error && locationServices && locationServices.length > 0) {
      return locationServices.map((ls: any) => ls.service_id);
    }
  } catch {
    // Table might not exist, fall through to turfs
  }

  // Fallback: get services from turfs
  const { data: turfs, error: turfsError } = await serviceClient
    .from('turfs')
    .select('service_id')
    .eq('location_id', locationId)
    .eq('is_available', true);

  if (turfsError || !turfs) {
    return [];
  }

  const uniqueServiceIds = [...new Set(turfs.map((t: any) => t.service_id))];
  return uniqueServiceIds;
}

export async function updateLocationServices(
  locationId: string,
  serviceIds: string[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const serviceClient = await createServiceClient();

  try {
    // Delete existing location_services for this location
    const { error: deleteError } = await serviceClient
      .from('location_services')
      .delete()
      .eq('location_id', locationId);

    if (deleteError && deleteError.code !== 'PGRST116') {
      // PGRST116 means table doesn't exist, which is fine
      console.error('Error deleting location_services:', deleteError);
      return { error: deleteError.message || 'Failed to delete existing associations' };
    }

    // Insert new associations (only if there are any)
    if (serviceIds.length > 0) {
      // Deduplicate serviceIds before creating locationServices
      const uniqueServiceIds = [...new Set(serviceIds)];
      
      // Use upsert to handle duplicates gracefully
      const locationServices = uniqueServiceIds.map(serviceId => ({
        location_id: locationId,
        service_id: serviceId,
        is_active: true,
      }));

      const { error: insertError } = await (serviceClient.from('location_services') as any).upsert(locationServices, {
        onConflict: 'location_id,service_id',
        ignoreDuplicates: false,
      });

      if (insertError) {
        console.error('Error inserting location_services:', insertError);
        return { error: insertError.message || 'Failed to insert associations' };
      }

      // Auto-create turfs for services that don't have turfs at this location
      for (const serviceId of uniqueServiceIds) {
        // Check if turf already exists
        const { data: existingTurfs } = await serviceClient
          .from('turfs')
          .select('id')
          .eq('location_id', locationId)
          .eq('service_id', serviceId)
          .eq('is_available', true)
          .limit(1);

        const existingList = (existingTurfs ?? []) as { id: string }[];
        if (existingList.length === 0) {
          const { data: serviceRow } = await serviceClient
            .from('services')
            .select('name')
            .eq('id', serviceId)
            .single();

          const { data: locationRow } = await serviceClient
            .from('locations')
            .select('name')
            .eq('id', locationId)
            .single();

          const service = serviceRow as { name: string } | null;
          const location = locationRow as { name: string } | null;

          if (service && location) {
            const { data: newTurfRow, error: turfError } = await (serviceClient.from('turfs') as any)
              .insert({
                location_id: locationId,
                service_id: serviceId,
                name: `${service.name} - ${location.name}`,
                is_available: true,
              })
              .select()
              .single();

            const newTurf = newTurfRow as { id: string; name: string } | null;

            if (!turfError && newTurf) {
              console.log(`[updateLocationServices] Created turf: ${newTurf.name} (${newTurf.id})`);
              
              const { data: servicePricing } = await serviceClient
                .from('service_hourly_pricing')
                .select('hour, price')
                .eq('service_id', serviceId)
                .order('hour');

              const pricingRows = (servicePricing ?? []) as { hour: number; price: number }[];

              if (pricingRows.length > 0) {
                const turfPricing = pricingRows.map((sp) => ({
                  turf_id: newTurf.id,
                  hour: sp.hour,
                  price: sp.price,
                }));

                const { error: pricingError } = await (serviceClient.from('hourly_pricing') as any).insert(turfPricing);

                if (pricingError) {
                  console.error(`[updateLocationServices] Error creating pricing for turf ${newTurf.id}:`, pricingError);
                } else {
                  console.log(`[updateLocationServices] Created ${turfPricing.length} pricing entries for turf ${newTurf.id}`);
                }
              } else {
                const defaultPricing = Array.from({ length: 24 }, (_, i) => {
                  const hour = i;
                  let price = 1000;
                  if (hour >= 0 && hour < 6) price = 400;
                  else if (hour >= 6 && hour <= 9) price = 500;
                  else if (hour >= 18 && hour <= 21) price = 1500;
                  else if (hour >= 22 || hour === 23) price = 1000;
                  return { turf_id: newTurf.id, hour, price };
                });

                const { error: pricingError } = await (serviceClient.from('hourly_pricing') as any).insert(defaultPricing);

                if (pricingError) {
                  console.error(`[updateLocationServices] Error creating default pricing for turf ${newTurf.id}:`, pricingError);
                } else {
                  console.log(`[updateLocationServices] Created ${defaultPricing.length} default pricing entries for turf ${newTurf.id}`);
                }
              }
            } else if (turfError) {
              console.error(`[updateLocationServices] Error creating turf for service ${serviceId} at location ${locationId}:`, turfError);
            }
          }
        }
      }
    }

    revalidatePath('/admin/locations');
    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { error: error.message || 'Failed to update location services' };
  }
}

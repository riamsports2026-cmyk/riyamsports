'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { createClient } from '@/lib/supabase/server';

/**
 * Auto-create turfs for services linked to locations via location_services
 * that don't have turfs yet
 */
export async function autoCreateMissingTurfs() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const serviceClient = await createServiceClient();

  try {
    // Get all location-service links
    const { data: locationServices, error: lsError } = await serviceClient
      .from('location_services')
      .select('location_id, service_id')
      .eq('is_active', true);

    if (lsError || !locationServices) {
      return { error: lsError?.message || 'Failed to fetch location services' };
    }

    type LsRow = { location_id: string; service_id: string };
    const lsList = locationServices as LsRow[];
    let createdCount = 0;

    for (const ls of lsList) {
      // Check if turf already exists
      const { data: existingTurfs } = await serviceClient
        .from('turfs')
        .select('id')
        .eq('location_id', ls.location_id)
        .eq('service_id', ls.service_id)
        .eq('is_available', true)
        .limit(1);

      const existingList = (existingTurfs ?? []) as { id: string }[];
      if (existingList.length === 0) {
        // Get service name
        const { data: serviceRow } = await serviceClient
          .from('services')
          .select('name')
          .eq('id', ls.service_id)
          .single();

        // Get location name
        const { data: locationRow } = await serviceClient
          .from('locations')
          .select('name')
          .eq('id', ls.location_id)
          .single();

        const service = serviceRow as { name: string } | null;
        const location = locationRow as { name: string } | null;

        if (service && location) {
          // Create turf
          const { data: newTurfRow, error: turfError } = await (serviceClient.from('turfs') as any)
            .insert({
              location_id: ls.location_id,
              service_id: ls.service_id,
              name: `${service.name} - ${location.name}`,
              is_available: true,
            })
            .select()
            .single();

          const newTurf = newTurfRow as { id: string; name: string } | null;

          if (!turfError && newTurf) {
            // Get service hourly pricing if available
            const { data: servicePricing } = await serviceClient
              .from('service_hourly_pricing')
              .select('hour, price')
              .eq('service_id', ls.service_id)
              .order('hour');

            const pricingRows = (servicePricing ?? []) as { hour: number; price: number }[];

            // Create hourly pricing for the turf
            if (pricingRows.length > 0) {
              const turfPricing = pricingRows.map((sp) => ({
                turf_id: newTurf.id,
                hour: sp.hour,
                price: sp.price,
              }));

              await (serviceClient.from('hourly_pricing') as any).insert(turfPricing);
            } else {
              // Create default pricing for all 24 hours
              const defaultPricing = Array.from({ length: 24 }, (_, i) => {
                const hour = i; // 0 to 23 (12am to 11pm)
                let price = 1000; // Default
                if (hour >= 0 && hour < 6) price = 400; // 12am-6am: Lower price for early hours
                else if (hour >= 6 && hour <= 9) price = 500; // Early morning (6am-9am)
                else if (hour >= 18 && hour <= 21) price = 1500; // Evening peak (6pm-9pm)
                else if (hour >= 22 || hour === 23) price = 1000; // Late evening (10pm-11pm)
                return {
                  turf_id: newTurf.id,
                  hour,
                  price,
                };
              });

              await (serviceClient.from('hourly_pricing') as any).insert(defaultPricing);
            }

            createdCount++;
          }
        }
      }
    }

    return { success: true, createdCount };
  } catch (error: any) {
    console.error('Error auto-creating turfs:', error);
    return { error: error.message || 'Failed to create turfs' };
  }
}

/**
 * Auto-create a turf for a specific location-service combination
 * Only creates if the service is linked to the location via location_services
 * This can be called by anyone (including customers) as it only creates turfs
 * for services that are already linked to locations
 */
export async function autoCreateTurfForLocationService(locationId: string, serviceId: string) {
  const serviceClient = await createServiceClient();

  try {
    // First, verify that the service is linked to the location
    const { data: locationServiceRow, error: lsError } = await serviceClient
      .from('location_services')
      .select('id')
      .eq('location_id', locationId)
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .single();

    if (lsError || !locationServiceRow) {
      // Service is not linked to this location, don't create turf
      console.log(`[autoCreateTurfForLocationService] Service ${serviceId} is not linked to location ${locationId}`);
      return { error: 'Service is not available at this location' };
    }

    // Check if turf already exists
    const { data: existingTurfs } = await serviceClient
      .from('turfs')
      .select('id')
      .eq('location_id', locationId)
      .eq('service_id', serviceId)
      .eq('is_available', true)
      .limit(1);

    const existingList = (existingTurfs ?? []) as { id: string }[];
    if (existingList.length > 0) {
      console.log(`[autoCreateTurfForLocationService] Turf already exists for location ${locationId}, service ${serviceId}`);
      return { success: true, turfId: existingList[0].id };
    }

    // Get service name
    const { data: serviceRow } = await serviceClient
      .from('services')
      .select('name')
      .eq('id', serviceId)
      .single();

    // Get location name
    const { data: locationRow } = await serviceClient
      .from('locations')
      .select('name')
      .eq('id', locationId)
      .single();

    const service = serviceRow as { name: string } | null;
    const location = locationRow as { name: string } | null;

    if (!service || !location) {
      return { error: 'Service or location not found' };
    }

    // Create turf
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

    if (turfError || !newTurf) {
      console.error(`[autoCreateTurfForLocationService] Error creating turf:`, turfError);
      return { error: turfError?.message || 'Failed to create turf' };
    }

    console.log(`[autoCreateTurfForLocationService] Created turf: ${newTurf.name} (${newTurf.id})`);

    // Get service hourly pricing if available
    const { data: servicePricing } = await serviceClient
      .from('service_hourly_pricing')
      .select('hour, price')
      .eq('service_id', serviceId)
      .order('hour');

    const pricingRows = (servicePricing ?? []) as { hour: number; price: number }[];

    // Create hourly pricing for the turf
    if (pricingRows.length > 0) {
      const turfPricing = pricingRows.map((sp) => ({
        turf_id: newTurf.id,
        hour: sp.hour,
        price: sp.price,
      }));

      const { error: pricingError } = await (serviceClient.from('hourly_pricing') as any).insert(turfPricing);

      if (pricingError) {
        console.error(`[autoCreateTurfForLocationService] Error creating pricing:`, pricingError);
      } else {
        console.log(`[autoCreateTurfForLocationService] Created ${turfPricing.length} pricing entries`);
      }
    } else {
      // Create default pricing for all 24 hours
      const defaultPricing = Array.from({ length: 24 }, (_, i) => {
        const hour = i; // 0 to 23 (12am to 11pm)
        let price = 1000; // Default
        if (hour >= 0 && hour < 6) price = 400; // 12am-6am: Lower price for early hours
        else if (hour >= 6 && hour <= 9) price = 500; // Early morning (6am-9am)
        else if (hour >= 18 && hour <= 21) price = 1500; // Evening peak (6pm-9pm)
        else if (hour >= 22 || hour === 23) price = 1000; // Late evening (10pm-11pm)
        return {
          turf_id: newTurf.id,
          hour,
          price,
        };
      });

      const { error: pricingError } = await (serviceClient.from('hourly_pricing') as any).insert(defaultPricing);

      if (pricingError) {
        console.error(`[autoCreateTurfForLocationService] Error creating default pricing:`, pricingError);
      } else {
        console.log(`[autoCreateTurfForLocationService] Created ${defaultPricing.length} default pricing entries`);
      }
    }

    return { success: true, turfId: newTurf.id };
  } catch (error: any) {
    console.error('[autoCreateTurfForLocationService] Unexpected error:', error);
    return { error: error.message || 'Failed to create turf' };
  }
}


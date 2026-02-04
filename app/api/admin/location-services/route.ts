import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/utils/roles';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const locationId = formData.get('location_id') as string;
  const serviceIds = formData.getAll('service_ids') as string[];

  if (!locationId) {
    return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
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
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete existing associations' },
        { status: 500 }
      );
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (serviceClient.from('location_services') as any)
        .upsert(locationServices, {
          onConflict: 'location_id,service_id',
          ignoreDuplicates: false,
        });

      if (insertError) {
        console.error('Error inserting location_services:', insertError);
        return NextResponse.json(
          { error: insertError.message || 'Failed to insert associations' },
          { status: 500 }
        );
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
          const { data: svc } = await serviceClient.from('services').select('name').eq('id', serviceId).single();
          const { data: loc } = await serviceClient.from('locations').select('name').eq('id', locationId).single();
          const service = svc as { name: string } | null;
          const location = loc as { name: string } | null;

          if (service && location) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: newTurf, error: turfError } = await (serviceClient.from('turfs') as any)
              .insert({
                location_id: locationId,
                service_id: serviceId,
                name: `${service.name} - ${location.name}`,
                is_available: true,
              })
              .select()
              .single();

            const turf = newTurf as { id: string; name: string } | null;
            if (!turfError && turf) {
              console.log(`[location-services API] Created turf: ${turf.name} (${turf.id})`);
              
              const { data: servicePricing } = await serviceClient
                .from('service_hourly_pricing')
                .select('hour, price')
                .eq('service_id', serviceId)
                .order('hour');

              const pricing = (servicePricing || []) as { hour: number; price: number }[];
              if (pricing.length > 0) {
                const turfPricing = pricing.map((sp) => ({
                  turf_id: turf.id,
                  hour: sp.hour,
                  price: sp.price,
                }));

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error: pricingError } = await (serviceClient.from('hourly_pricing') as any).insert(turfPricing);

                if (pricingError) {
                  console.error(`[location-services API] Error creating pricing for turf ${turf.id}:`, pricingError);
                } else {
                  console.log(`[location-services API] Created ${turfPricing.length} pricing entries for turf ${turf.id}`);
                }
              } else {
                const defaultPricing = Array.from({ length: 24 }, (_, i) => {
                  const hour = i;
                  let price = 1000;
                  if (hour >= 0 && hour < 6) price = 400;
                  else if (hour >= 6 && hour <= 9) price = 500;
                  else if (hour >= 18 && hour <= 21) price = 1500;
                  else if (hour >= 22 || hour === 23) price = 1000;
                  return { turf_id: turf.id, hour, price };
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error: defaultPricingError } = await (serviceClient.from('hourly_pricing') as any).insert(defaultPricing);
                if (defaultPricingError) {
                  console.error(`[location-services API] Error creating default pricing for turf ${turf.id}:`, defaultPricingError);
                } else {
                  console.log(`[location-services API] Created ${defaultPricing.length} default pricing entries for turf ${turf.id}`);
                }
              }
            } else if (turfError) {
              console.error(`[location-services API] Error creating turf for service ${serviceId} at location ${locationId}:`, turfError);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update location services' },
      { status: 500 }
    );
  }
}



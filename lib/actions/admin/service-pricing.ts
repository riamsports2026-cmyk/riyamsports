'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const pricingSchema = z.object({
  hour: z.number().int().min(0).max(23),
  price: z.number().positive(),
});

export async function getServicePricing(serviceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return [];
  }

  const serviceClient = await createServiceClient();

  // Check if table exists by attempting to query it
  const { data, error } = await serviceClient
    .from('service_hourly_pricing')
    .select('*')
    .eq('service_id', serviceId)
    .order('hour', { ascending: true });

  if (error) {
    // If table doesn't exist, return empty array
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      console.warn('[getServicePricing] Table service_hourly_pricing does not exist yet. Please run migration 011_service_hourly_pricing.sql');
      return [];
    }
    console.error('[getServicePricing] Error fetching pricing:', error);
    return [];
  }

  return data || [];
}

export async function updateServicePricing(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const serviceId = formData.get('service_id') as string;
  const pricingJson = formData.get('pricing') as string;
  
  if (!serviceId || !pricingJson) {
    return { error: 'Missing required fields' };
  }

  let pricing: Array<{ hour: number; price: number }>;
  try {
    pricing = JSON.parse(pricingJson);
  } catch {
    return { error: 'Invalid pricing data' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  try {
    const validated = pricing.map((p) => pricingSchema.parse(p));
    const serviceClient = await createServiceClient();

    // Delete existing pricing
    const { error: deleteError } = await serviceClient
      .from('service_hourly_pricing')
      .delete()
      .eq('service_id', serviceId);

    if (deleteError) {
      // If table doesn't exist, return helpful error
      if (deleteError.code === 'PGRST116' || deleteError.message?.includes('does not exist')) {
        return { error: 'Table service_hourly_pricing does not exist. Please run migration 011_service_hourly_pricing.sql in your Supabase SQL Editor.' };
      }
      return { error: deleteError.message };
    }

    // Insert new pricing
    if (validated.length > 0) {
      const pricingData = validated.map((p) => ({
        service_id: serviceId,
        hour: p.hour,
        price: p.price,
      }));

      const { error: insertError } = await (serviceClient.from('service_hourly_pricing') as any).insert(pricingData);

      if (insertError) {
        if (insertError.code === 'PGRST116' || insertError.message?.includes('does not exist')) {
          return { error: 'Table service_hourly_pricing does not exist. Please run migration 011_service_hourly_pricing.sql in your Supabase SQL Editor.' };
        }
        return { error: insertError.message };
      }
    }

    revalidatePath('/admin/services');
    
    // Also update all existing turfs for this service with the new pricing
    await syncTurfPricingFromService(serviceId);
    
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || 'Validation failed' };
    }
    return { error: 'Failed to update pricing' };
  }
}

/**
 * Sync turf pricing from service pricing for all turfs of a service
 */
export async function syncTurfPricingFromService(serviceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const serviceClient = await createServiceClient();

  try {
    // Get service pricing
    const { data: servicePricing, error: pricingError } = await serviceClient
      .from('service_hourly_pricing')
      .select('hour, price')
      .eq('service_id', serviceId)
      .order('hour');

    if (pricingError) {
      console.error('[syncTurfPricingFromService] Error fetching service pricing:', pricingError);
      return { error: pricingError.message };
    }

    const pricingRows = (servicePricing ?? []) as { hour: number; price: number }[];
    if (pricingRows.length === 0) {
      console.log('[syncTurfPricingFromService] No service pricing found, skipping sync');
      return { success: true, updated: 0 };
    }

    // Get all turfs for this service
    const { data: turfsData, error: turfsError } = await serviceClient
      .from('turfs')
      .select('id')
      .eq('service_id', serviceId)
      .eq('is_available', true);

    if (turfsError) {
      console.error('[syncTurfPricingFromService] Error fetching turfs:', turfsError);
      return { error: turfsError.message };
    }

    const turfs = (turfsData ?? []) as { id: string }[];
    if (turfs.length === 0) {
      console.log('[syncTurfPricingFromService] No turfs found for this service');
      return { success: true, updated: 0 };
    }

    let updatedCount = 0;

    // Update pricing for each turf
    for (const turf of turfs) {
      // Delete existing pricing
      const { error: deleteError } = await serviceClient
        .from('hourly_pricing')
        .delete()
        .eq('turf_id', turf.id);

      if (deleteError) {
        console.error(`[syncTurfPricingFromService] Error deleting pricing for turf ${turf.id}:`, deleteError);
        continue;
      }

      // Insert new pricing from service
      const turfPricing = pricingRows.map((sp) => ({
        turf_id: turf.id,
        hour: sp.hour,
        price: sp.price,
      }));

      const { error: insertErr } = await (serviceClient.from('hourly_pricing') as any).insert(turfPricing);

      if (insertErr) {
        console.error(`[syncTurfPricingFromService] Error inserting pricing for turf ${turf.id}:`, insertErr);
      } else {
        updatedCount++;
        console.log(`[syncTurfPricingFromService] Updated pricing for turf ${turf.id}`);
      }
    }

    revalidatePath('/admin/services');
    revalidatePath('/book');
    
    return { success: true, updated: updatedCount };
  } catch (error: any) {
    console.error('[syncTurfPricingFromService] Unexpected error:', error);
    return { error: error.message || 'Failed to sync pricing' };
  }
}


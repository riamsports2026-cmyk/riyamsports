'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Service } from '@/lib/types';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  location_ids: z.array(z.string().uuid()).optional(),
  image_url: z.string().url().optional().nullable(),
});

export async function getAllServices(filters?: { 
  page?: number; 
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  is_active?: boolean;
}): Promise<{ data: Service[]; total: number; page: number; totalPages: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { data: [], total: 0, page: 1, totalPages: 0 };
  }

  const serviceClient = await createServiceClient();
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

  // Build query for count
  let countQuery = serviceClient
    .from('services')
    .select('*', { count: 'exact', head: true });

  // Build query for data
  let query = serviceClient
    .from('services')
    .select('*');

  // Apply filters
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    countQuery = countQuery.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
    query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
  }
  if (filters?.is_active !== undefined) {
    countQuery = countQuery.eq('is_active', filters.is_active);
    query = query.eq('is_active', filters.is_active);
  }

  // Get total count
  const { count, error: _countError } = await countQuery;
  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  // Apply sorting
  const sortBy = filters?.sortBy || 'created_at';
  const sortOrder = filters?.sortOrder || 'desc';
  
  // Map sortBy to actual column names
  let orderColumn = 'created_at';
  switch (sortBy) {
    case 'name':
      orderColumn = 'name';
      break;
    case 'created_at':
    default:
      orderColumn = 'created_at';
      break;
  }

  const { data, error } = await query
    .order(orderColumn, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    return { data: [], total: 0, page, totalPages: 0 };
  }

  return { data: data as Service[], total, page, totalPages };
}

export async function getServiceLocations(serviceId: string) {
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
    const { data: locationServices, error: lsError } = await serviceClient
      .from('location_services')
      .select('location_id')
      .eq('service_id', serviceId)
      .eq('is_active', true);

    if (!lsError && locationServices && locationServices.length > 0) {
      return locationServices.map((ls: any) => ls.location_id);
    }
  } catch (e) {
    // Table might not exist, fall through to turfs query
    console.warn('Error fetching from location_services, falling back to turfs:', (e as Error).message);
  }

  // Fallback: get locations from turfs
  const { data: turfs, error: turfsError } = await serviceClient
    .from('turfs')
    .select('location_id')
    .eq('service_id', serviceId)
    .eq('is_available', true);

  if (turfsError || !turfs) {
    return [];
  }

  const uniqueLocationIds = [...new Set(turfs.map((t: any) => t.location_id))];
  return uniqueLocationIds;
}

export async function createService(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const locationIds = formData.getAll('location_ids') as string[];
  const imageUrlValue = formData.get('image_url') as string | null;
  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string | null,
    is_active: formData.get('is_active') === 'true',
    location_ids: locationIds.filter(id => id),
    image_url: imageUrlValue && imageUrlValue.trim() !== '' ? imageUrlValue : null,
  };

  try {
    const validated = serviceSchema.parse(data);
    const serviceClient = await createServiceClient();

    const { data: newServiceRow, error: insertError } = await (serviceClient.from('services') as any)
      .insert({
        name: validated.name,
        description: validated.description,
        is_active: validated.is_active,
        image_url: validated.image_url || null,
      })
      .select()
      .single();

    if (insertError || !newServiceRow) {
      return { error: insertError?.message || 'Failed to create service' };
    }

    const newService = newServiceRow as { id: string; name: string };

    // Create location_services entries if location_services table exists
    if (validated.location_ids && validated.location_ids.length > 0) {
      // Deduplicate location_ids before creating locationServices
      const uniqueLocationIds = [...new Set(validated.location_ids)];
      
      const locationServices = uniqueLocationIds.map(locationId => ({
        location_id: locationId,
        service_id: newService.id,
        is_active: true,
      }));

      try {
        const { error: lsError } = await (serviceClient.from('location_services') as any).upsert(locationServices, {
          onConflict: 'location_id,service_id',
          ignoreDuplicates: false,
        });
        
        if (lsError) {
          console.warn('Error upserting into location_services:', lsError.message);
        } else {
          // Auto-create turfs for each linked location
          for (const locationId of uniqueLocationIds) {
            // Check if turf already exists
            const { data: existingTurfs } = await serviceClient
              .from('turfs')
              .select('id')
              .eq('location_id', locationId)
              .eq('service_id', newService.id)
              .eq('is_available', true)
              .limit(1);

            const existingList = (existingTurfs ?? []) as { id: string }[];
            if (existingList.length === 0) {
              // Get location name
              const { data: locationRow } = await serviceClient
                .from('locations')
                .select('name')
                .eq('id', locationId)
                .single();

              const location = locationRow as { name: string } | null;
              if (location) {
                // Create default turf
                const { data: newTurfRow, error: turfError } = await (serviceClient.from('turfs') as any)
                  .insert({
                    location_id: locationId,
                    service_id: newService.id,
                    name: `${newService.name} - ${location.name}`,
                    is_available: true,
                  })
                  .select()
                  .single();

                const newTurf = newTurfRow as { id: string } | null;
                if (!turfError && newTurf) {
                  const turfId = newTurf.id;
                  
                  // Get service hourly pricing if available
                  const { data: servicePricing } = await serviceClient
                    .from('service_hourly_pricing')
                    .select('hour, price')
                    .eq('service_id', newService.id)
                    .order('hour');

                  const pricingRows = (servicePricing ?? []) as { hour: number; price: number }[];

                  // Create hourly pricing for the turf
                  if (pricingRows.length > 0) {
                    const turfPricing = pricingRows.map((sp) => ({
                      turf_id: turfId,
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
                        turf_id: turfId,
                        hour,
                        price,
                      };
                    });

                    await (serviceClient.from('hourly_pricing') as any).insert(defaultPricing);
                  }
                } else if (turfError) {
                  console.error(`[createService] Error creating turf for ${newService.name} at ${location.name}:`, turfError);
                }
              }
            }
          }
        }
      } catch (e) {
        // Table might not exist, ignore error
        console.warn('location_services table might not exist:', (e as Error).message);
      }
    }

    revalidatePath('/admin/services');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as any;
      return { error: zodError.issues?.[0]?.message || 'Validation failed' };
    }
    return { error: 'Failed to create service' };
  }
}

export async function updateService(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const id = formData.get('id') as string;
  const locationIds = formData.getAll('location_ids') as string[];
  const imageUrlValue = formData.get('image_url') as string | null;
  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string | null,
    is_active: formData.get('is_active') === 'true',
    location_ids: locationIds.filter(id => id),
    image_url: imageUrlValue && imageUrlValue.trim() !== '' ? imageUrlValue : null,
  };

  try {
    const validated = serviceSchema.parse(data);
    const serviceClient = await createServiceClient();

    const { error: updateError } = await (serviceClient.from('services') as any)
      .update({
        name: validated.name,
        description: validated.description,
        is_active: validated.is_active,
        image_url: validated.image_url || null,
      })
      .eq('id', id);

    if (updateError) {
      return { error: updateError.message };
    }

    // Update location_services if table exists
    if (validated.location_ids) {
      try {
        // Delete existing associations
        const { error: deleteError } = await serviceClient
          .from('location_services')
          .delete()
          .eq('service_id', id);
        
        if (deleteError && deleteError.code !== 'PGRST116') {
          // PGRST116 means table doesn't exist, which is fine
          console.warn('Error deleting location_services:', deleteError.message);
        }

        // Create new associations using upsert to handle duplicates
        if (validated.location_ids.length > 0) {
          // Deduplicate location_ids before creating locationServices
          const uniqueLocationIds = [...new Set(validated.location_ids)];
          
          const locationServices = uniqueLocationIds.map(locationId => ({
            location_id: locationId,
            service_id: id,
            is_active: true,
          }));

          const { error: upsertError } = await (serviceClient.from('location_services') as any).upsert(locationServices, {
            onConflict: 'location_id,service_id',
            ignoreDuplicates: false,
          });
          
          if (upsertError) {
            console.warn('Error upserting location_services:', upsertError.message);
          } else {
            // Auto-create turfs for each linked location
            for (const locationId of uniqueLocationIds) {
              const { data: existingTurfs } = await serviceClient
                .from('turfs')
                .select('id')
                .eq('location_id', locationId)
                .eq('service_id', id)
                .eq('is_available', true)
                .limit(1);

              const existingList = (existingTurfs ?? []) as { id: string }[];
              if (existingList.length === 0) {
                const { data: locationRow } = await serviceClient
                  .from('locations')
                  .select('name')
                  .eq('id', locationId)
                  .single();

                const location = locationRow as { name: string } | null;
                if (location) {
                  const { data: newTurfRow, error: turfError } = await (serviceClient.from('turfs') as any)
                    .insert({
                      location_id: locationId,
                      service_id: id,
                      name: `${validated.name} - ${location.name}`,
                      is_available: true,
                    })
                    .select()
                    .single();

                  const newTurf = newTurfRow as { id: string } | null;
                  if (!turfError && newTurf) {
                    const turfId = newTurf.id;
                    
                    const { data: servicePricing } = await serviceClient
                      .from('service_hourly_pricing')
                      .select('hour, price')
                      .eq('service_id', id)
                      .order('hour');

                    const pricingRows = (servicePricing ?? []) as { hour: number; price: number }[];

                    if (pricingRows.length > 0) {
                      const turfPricing = pricingRows.map((sp) => ({
                        turf_id: turfId,
                        hour: sp.hour,
                        price: sp.price,
                      }));

                      const { error: pricingError } = await (serviceClient.from('hourly_pricing') as any).insert(turfPricing);

                      if (pricingError) {
                        console.error(`[updateService] Error creating pricing for turf ${turfId}:`, pricingError);
                      }
                    } else {
                      const defaultPricing = Array.from({ length: 24 }, (_, i) => {
                        const hour = i;
                        let price = 1000;
                        if (hour >= 0 && hour < 6) price = 400;
                        else if (hour >= 6 && hour <= 9) price = 500;
                        else if (hour >= 18 && hour <= 21) price = 1500;
                        else if (hour >= 22 || hour === 23) price = 1000;
                        return { turf_id: turfId, hour, price };
                      });

                      const { error: pricingError } = await (serviceClient.from('hourly_pricing') as any).insert(defaultPricing);

                      if (pricingError) {
                        console.error(`[updateService] Error creating default pricing for turf ${newTurf.id}:`, pricingError);
                      }
                    }
                  } else if (turfError) {
                    console.error(`[updateService] Error creating turf for ${validated.name} at ${location.name}:`, turfError);
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        // Table might not exist, ignore error
        console.warn('location_services table might not exist:', (e as Error).message);
      }
    }

    revalidatePath('/admin/services');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as any;
      return { error: zodError.issues?.[0]?.message || 'Validation failed' };
    }
    return { error: 'Failed to update service' };
  }
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const serviceClient = await createServiceClient();

  const { error } = await serviceClient
    .from('services')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/services');
  return { success: true };
}

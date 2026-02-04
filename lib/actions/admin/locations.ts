'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Location } from '@/lib/types';

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  pincode: z.string().optional().refine(
    (val) => !val || val === '' || /^\d{6}$/.test(val),
    { message: 'Invalid pincode (must be 6 digits)' }
  ),
  is_active: z.boolean().default(true),
  google_maps_address: z.string().optional(),
});

export async function getAllLocations(filters?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  is_active?: boolean;
}): Promise<{ data: Location[]; total: number; page: number; totalPages: number }> {
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
    .from('locations')
    .select('*', { count: 'exact', head: true });

  // Build query for data
  let query = serviceClient
    .from('locations')
    .select('*');

  // Apply filters
  if (filters?.search?.trim()) {
    const searchTerm = `%${filters.search}%`;
    countQuery = countQuery.or(`name.ilike.${searchTerm},address.ilike.${searchTerm},city.ilike.${searchTerm}`);
    query = query.or(`name.ilike.${searchTerm},address.ilike.${searchTerm},city.ilike.${searchTerm}`);
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
    case 'city':
      orderColumn = 'city';
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

  return { data: data as Location[], total, page, totalPages };
}

export async function createLocation(
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

  const googleMapsAddress = formData.get('google_maps_address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const pincode = formData.get('pincode') as string;
  
  const data = {
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    city: city && city.trim() ? city.trim() : undefined,
    state: state && state.trim() ? state.trim() : undefined,
    pincode: pincode && pincode.trim() ? pincode.trim() : undefined,
    is_active: formData.get('is_active') === 'true',
    google_maps_address: googleMapsAddress && googleMapsAddress.trim() ? googleMapsAddress.trim() : null,
  };

  try {
    const validated = locationSchema.parse(data);
    const serviceClient = await createServiceClient();

    // Prepare data for insert - convert empty strings to null
    const insertData = {
      ...validated,
      city: validated.city && validated.city.trim() ? validated.city.trim() : null,
      state: validated.state && validated.state.trim() ? validated.state.trim() : null,
      pincode: validated.pincode && validated.pincode.trim() ? validated.pincode.trim() : null,
    };

    const { error: insertError } = await (serviceClient.from('locations') as any).insert(insertData);

    if (insertError) {
      return { error: insertError.message };
    }

    revalidatePath('/admin/locations');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || 'Validation failed' };
    }
    return { error: 'Failed to create location' };
  }
}

export async function updateLocation(
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
  const googleMapsAddress = formData.get('google_maps_address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const pincode = formData.get('pincode') as string;
  
  const data = {
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    city: city && city.trim() ? city.trim() : undefined,
    state: state && state.trim() ? state.trim() : undefined,
    pincode: pincode && pincode.trim() ? pincode.trim() : undefined,
    is_active: formData.get('is_active') === 'true',
    google_maps_address: googleMapsAddress && googleMapsAddress.trim() ? googleMapsAddress.trim() : null,
  };

  try {
    const validated = locationSchema.parse(data);
    const serviceClient = await createServiceClient();

    // Prepare data for update - convert empty strings to null
    const updateData = {
      ...validated,
      city: validated.city && validated.city.trim() ? validated.city.trim() : null,
      state: validated.state && validated.state.trim() ? validated.state.trim() : null,
      pincode: validated.pincode && validated.pincode.trim() ? validated.pincode.trim() : null,
    };

    const { error: updateError } = await (serviceClient.from('locations') as any)
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath('/admin/locations');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || 'Validation failed' };
    }
    return { error: 'Failed to update location' };
  }
}

export async function deleteLocation(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const serviceClient = await createServiceClient();

  const { error } = await serviceClient
    .from('locations')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/locations');
  return { success: true };
}



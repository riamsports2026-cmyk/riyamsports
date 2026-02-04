'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { BookingWithDetails } from '@/lib/types';
import { z } from 'zod';

const bookingSchema = z.object({
  turf_id: z.string().uuid(),
  booking_date: z.string(),
  selected_hours: z.array(z.number().int().min(0).max(23)),
  payment_type: z.enum(['advance', 'full']),
});

export async function getUserBookings(filters?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], total: 0, page: 1, totalPages: 0 };
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

  let startDate = filters?.startDate;
  let endDate = filters?.endDate;
  if (startDate && endDate && startDate > endDate) {
    [startDate, endDate] = [endDate, startDate];
  }

  // Build query with date filters
  let countQuery = supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  let dataQuery = supabase
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
    `)
    .eq('user_id', user.id);

  // Apply date filters (past, future, or mixed; start <= end enforced)
  if (startDate) {
    countQuery = countQuery.gte('booking_date', startDate);
    dataQuery = dataQuery.gte('booking_date', startDate);
  }
  if (endDate) {
    countQuery = countQuery.lte('booking_date', `${endDate}T23:59:59.999Z`);
    dataQuery = dataQuery.lte('booking_date', `${endDate}T23:59:59.999Z`);
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
    case 'booking_date':
      orderColumn = 'booking_date';
      break;
    case 'total_amount':
      orderColumn = 'total_amount';
      break;
    case 'booking_status':
      orderColumn = 'booking_status';
      break;
    case 'created_at':
    default:
      orderColumn = 'created_at';
      break;
  }

  // Get paginated data
  const { data, error } = await dataQuery
    .order(orderColumn, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    return { data: [], total: 0, page, totalPages: 0 };
  }

  return {
    data: data as BookingWithDetails[],
    total,
    page,
    totalPages,
  };
}

export async function getBooking(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
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
    `)
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as BookingWithDetails;
}

export async function createBooking(
  prevState: { error?: string; success?: boolean; bookingId?: string } | null,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to create a booking' };
  }

  const data = {
    turf_id: formData.get('turf_id') as string,
    booking_date: formData.get('booking_date') as string,
    selected_hours: JSON.parse(formData.get('selected_hours') as string) as number[],
    payment_type: formData.get('payment_type') as 'advance' | 'full',
  };

  try {
    const validated = bookingSchema.parse(data);
    const serviceClient = await createServiceClient();

    // Validate booking date is not in the past
    const bookingDate = new Date(validated.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      return { error: 'Cannot book for past dates' };
    }

    // Validate time slots are not in the past if booking is for today
    const isToday = bookingDate.getTime() === today.getTime();
    if (isToday) {
      const currentHour = new Date().getHours();
      // Only allow hours greater than current hour
      // This means if it's 11:04 AM (hour 11), hour 12 (12 PM) will be allowed
      const pastHours = validated.selected_hours.filter(hour => hour <= currentHour);
      if (pastHours.length > 0) {
        return { error: 'Cannot book past time slots. Please select future time slots.' };
      }
    }

    // Get turf pricing
    const { data: turf, error: turfError } = await serviceClient
      .from('turfs')
      .select('*, hourly_pricing(*), location:locations(*), service:services(*)')
      .eq('id', validated.turf_id)
      .single();

    if (turfError || !turf) {
      return { error: turfError?.message || 'Turf not found' };
    }

    // Calculate total amount
    const turfData = turf as any;
    const hourlyPrices = (turfData.hourly_pricing || []).sort((a: any, b: any) => a.hour - b.hour);
    let totalAmount = 0;

    validated.selected_hours.forEach((hour) => {
      const price = hourlyPrices.find((p: any) => p.hour === hour);
      if (price) {
        totalAmount += price.price;
      }
    });

    // Calculate advance amount and apply discount for full payment
    let advanceAmount: number;
    if (validated.payment_type === 'full') {
      // Full payment: apply 10% discount and advance = total (100%)
      totalAmount = totalAmount * 0.9; // 10% discount
      advanceAmount = totalAmount; // Full payment = 100% of discounted amount
    } else {
      // Advance payment: 30% of original total
      advanceAmount = totalAmount * 0.3; // 30% advance
    }

    // Generate unique booking ID
    const bookingId = `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create booking with transaction
    const { data: bookingRow, error: bookingError } = await (serviceClient.from('bookings') as any)
      .insert({
        user_id: user.id,
        turf_id: validated.turf_id,
        booking_date: validated.booking_date,
        booking_id: bookingId,
        total_amount: totalAmount,
        advance_amount: advanceAmount,
        received_amount: 0, // Initially no payment received
        booking_status: 'pending_payment',
      })
      .select()
      .single();

    if (bookingError || !bookingRow) {
      return { error: bookingError?.message || 'Failed to create booking' };
    }

    const bookingData = bookingRow as { id: string };

    // Create booking slots
    const slots = validated.selected_hours.map((hour) => ({
      booking_id: bookingData.id,
      hour,
    }));

    const { error: slotsError } = await (serviceClient.from('booking_slots') as any).insert(slots);

    if (slotsError) {
      // Rollback booking
      await serviceClient.from('bookings').delete().eq('id', bookingData.id);
      return { error: slotsError.message || 'Failed to create booking slots' };
    }

    return { success: true, bookingId: bookingData.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues && error.issues.length > 0 ? error.issues[0] : null;
      return { error: firstError?.message || 'Validation failed' };
    }
    return { error: 'Failed to create booking' };
  }
}

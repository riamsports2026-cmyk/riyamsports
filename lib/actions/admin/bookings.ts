'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { BookingWithDetails } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getAllBookings(filters?: {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
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

  // Build query for count
  let countQuery = serviceClient
    .from('bookings')
    .select('*', { count: 'exact', head: true });

  // Build query for data
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
    `, { count: 'exact' });

  // Apply filters (past, future, or mixed; start <= end enforced)
  if (startDate) {
    query = query.gte('booking_date', startDate);
    countQuery = countQuery.gte('booking_date', startDate);
  }
  if (endDate) {
    query = query.lte('booking_date', endDate);
    countQuery = countQuery.lte('booking_date', endDate);
  }
  if (filters?.status) {
    query = query.eq('booking_status', filters.status);
    countQuery = countQuery.eq('booking_status', filters.status);
  }
  if (filters?.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus);
    countQuery = countQuery.eq('payment_status', filters.paymentStatus);
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
    case 'payment_status':
      orderColumn = 'payment_status';
      break;
    case 'created_at':
    default:
      orderColumn = 'created_at';
      break;
  }

  // Apply pagination with sorting
  query = query.order(orderColumn, { ascending: sortOrder === 'asc' }).range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error || !data) {
    return { data: [], total: 0, page, totalPages: 0 };
  }

  // Apply time filters (filter by booking slots) - in memory
  let filteredData = data;
  if (startTime || endTime) {
    filteredData = data.filter((booking: any) => {
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

  return {
    data: filteredData as BookingWithDetails[],
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

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const serviceClient = await createServiceClient();

  const { data: existing } = await serviceClient
    .from('bookings')
    .select('booking_status')
    .eq('id', bookingId)
    .single();

  if (existing && (existing as { booking_status: string }).booking_status === 'cancelled') {
    return { error: 'Cannot change status of a cancelled booking.' };
  }

  const { error } = await (serviceClient.from('bookings') as any)
    .update({ booking_status: status })
    .eq('id', bookingId);

  if (error) {
    return { error: error.message };
  }

  // WhatsApp cancellation notification when status set to cancelled
  if (status === 'cancelled') {
    const { BookingReminderService } = await import('@/lib/services/booking-reminders');
    BookingReminderService.sendCancellationByBookingId(bookingId).catch(() => {});
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

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const serviceClient = await createServiceClient();

  // Get booking to validate
  const { data: bookRow, error: bookingError } = await serviceClient
    .from('bookings')
    .select('total_amount, received_amount')
    .eq('id', bookingId)
    .single();

  if (bookingError || !bookRow) {
    return { error: 'Booking not found' };
  }

  const booking = bookRow as { total_amount: number; received_amount?: number | null };

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

  // Only create payment record if there's an increase
  if (paymentDifference > 0) {
    // Create payment record for manual balance update
    const { error: paymentError } = await (serviceClient.from('payments') as any).insert({
      booking_id: bookingId,
      amount: paymentDifference,
      payment_type: 'manual',
      payment_gateway: 'manual',
      gateway_order_id: `MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'success',
      payment_method: 'manual',
      notes: `Manual balance update by admin`,
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

  // Update booking
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

  // Revalidate booking pages
  revalidatePath('/admin/bookings');
  revalidatePath('/admin');
  revalidatePath('/staff');

  return { success: true, paymentStatus };
}

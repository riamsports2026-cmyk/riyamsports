'use server';

import { BookingReminderService } from '@/lib/services/booking-reminders';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

type BookingReminderRow = {
  id: string;
  booking_id: string;
  booking_date: string;
  total_amount: number;
  advance_amount?: number;
  user?: { full_name: string | null; mobile_number: string | null } | null;
  turf?: {
    name: string;
    location?: { name: string } | null;
    service?: { name: string } | null;
  } | null;
  slots: { hour: number }[];
};

/**
 * Send booking confirmation WhatsApp message
 */
export async function sendBookingConfirmation(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const serviceClient = await createServiceClient();

  const { data, error } = await serviceClient
    .from('bookings')
    .select(`
      id,
      booking_id,
      booking_date,
      total_amount,
      user:profiles!bookings_user_id_fkey(
        full_name,
        mobile_number
      ),
      turf:turfs(
        name,
        location:locations(name),
        service:services(name)
      ),
      slots:booking_slots(hour)
    `)
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return { error: 'Booking not found' };
  }

  const booking = data as BookingReminderRow;

  if (!booking.user?.mobile_number) {
    return { error: 'Customer phone number not found' };
  }

  const reminderData = {
    bookingId: booking.booking_id,
    bookingDate: booking.booking_date,
    timeSlots: booking.slots
      .map((slot: { hour: number }) => `${String(slot.hour).padStart(2, '0')}:00`)
      .sort(),
    location: booking.turf?.location?.name || '',
    service: booking.turf?.service?.name || '',
    turf: booking.turf?.name || '',
    customerName: booking.user?.full_name || 'Customer',
    customerPhone: booking.user?.mobile_number || '',
    totalAmount: booking.total_amount,
  };

  const result = await BookingReminderService.sendConfirmationReminder(reminderData);

  return result;
}

/**
 * Send payment reminder
 */
export async function sendPaymentReminder(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const serviceClient = await createServiceClient();

  const { data, error } = await serviceClient
    .from('bookings')
    .select(`
      id,
      booking_id,
      booking_date,
      advance_amount,
      total_amount,
      user:profiles!bookings_user_id_fkey(
        full_name,
        mobile_number
      ),
      turf:turfs(
        name,
        location:locations(name),
        service:services(name)
      ),
      slots:booking_slots(hour)
    `)
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return { error: 'Booking not found' };
  }

  const booking = data as BookingReminderRow;

  if (!booking.user?.mobile_number) {
    return { error: 'Customer phone number not found' };
  }

  const reminderData = {
    bookingId: booking.booking_id,
    bookingDate: booking.booking_date,
    timeSlots: booking.slots
      .map((slot: { hour: number }) => `${String(slot.hour).padStart(2, '0')}:00`)
      .sort(),
    location: booking.turf?.location?.name || '',
    service: booking.turf?.service?.name || '',
    turf: booking.turf?.name || '',
    customerName: booking.user?.full_name || 'Customer',
    customerPhone: booking.user?.mobile_number || '',
    totalAmount: booking.total_amount,
    paymentAmount: Number(booking.advance_amount ?? 0),
    bookingRowId: (booking as { id?: string }).id,
  };

  const result = await BookingReminderService.sendPaymentReminder(reminderData);

  return result;
}






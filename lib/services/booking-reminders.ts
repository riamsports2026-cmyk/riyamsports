import { WhatsAppService } from './whatsapp';
import { createServiceClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { getRenderedTemplate } from './notification-templates';

export interface BookingReminderData {
  bookingId: string;
  bookingDate: string;
  timeSlots: string[];
  location: string;
  service: string;
  turf: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
}

function buildTemplateContext(data: BookingReminderData, extra: Record<string, string | number> = {}): Record<string, string | number> {
  const formattedDate = format(new Date(data.bookingDate), 'dd MMM yyyy');
  const timeSlots = data.timeSlots.join(', ');
  return {
    bookingid: data.bookingId,
    date: formattedDate,
    timeslots: timeSlots,
    location: data.location,
    service: data.service,
    turf: data.turf,
    totalamount: data.totalAmount,
    customername: data.customerName,
    ...extra,
  };
}

export class BookingReminderService {
  /**
   * Send booking confirmation (dynamic template)
   */
  static async sendConfirmationReminder(data: BookingReminderData): Promise<{ success: boolean; error?: string }> {
    const message = getRenderedTemplate('booking_confirmation', buildTemplateContext(data));
    return WhatsAppService.send({
      to: WhatsAppService.formatPhoneNumber(data.customerPhone),
      message,
      askevaTemplateName: WhatsAppService.getTemplateNameFor('booking_confirmation'),
    });
  }

  /**
   * Send booking reminder 24 hours before (scheduled; dynamic template)
   */
  static async sendReminder(data: BookingReminderData): Promise<{ success: boolean; error?: string }> {
    const message = getRenderedTemplate('booking_reminder', buildTemplateContext(data));
    return WhatsAppService.send({
      to: WhatsAppService.formatPhoneNumber(data.customerPhone),
      message,
      askevaTemplateName: WhatsAppService.getTemplateNameFor('booking_reminder'),
    });
  }

  /**
   * Send payment success notification (dynamic template)
   */
  static async sendPaymentSuccess(
    data: BookingReminderData & { amountPaid: number }
  ): Promise<{ success: boolean; error?: string }> {
    const message = getRenderedTemplate('payment_success', {
      ...buildTemplateContext(data),
      amount_paid: data.amountPaid,
    });
    return WhatsAppService.send({
      to: WhatsAppService.formatPhoneNumber(data.customerPhone),
      message,
      askevaTemplateName: WhatsAppService.getTemplateNameFor('payment_success'),
    });
  }

  /**
   * Send payment reminder (dynamic template).
   * Pass bookingRowId (uuid) for payment_url; otherwise falls back to bookingId.
   */
  static async sendPaymentReminder(
    data: BookingReminderData & { paymentAmount: number; bookingRowId?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentUrl = data.bookingRowId
      ? `${base}/bookings/${data.bookingRowId}/payment`
      : `${base}/bookings/${data.bookingId}/payment`;
    const message = getRenderedTemplate('payment_reminder', {
      ...buildTemplateContext(data),
      amountdue: data.paymentAmount,
      paymenturl: paymentUrl,
    });
    return WhatsAppService.send({
      to: WhatsAppService.formatPhoneNumber(data.customerPhone),
      message,
      askevaTemplateName: WhatsAppService.getTemplateNameFor('payment_reminder'),
    });
  }

  /**
   * Get bookings that need reminders (24 hours before booking date)
   */
  static async getBookingsNeedingReminders(): Promise<BookingReminderData[]> {
    const serviceClient = await createServiceClient();
    
    // Get bookings for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = format(tomorrow, 'yyyy-MM-dd');

    const { data: bookings, error } = await serviceClient
      .from('bookings')
      .select(`
        id,
        booking_id,
        booking_date,
        total_amount,
        reminder_sent,
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
      .eq('booking_date', tomorrowDate)
      .eq('booking_status', 'confirmed')
      .is('reminder_sent', null);

    if (error || !bookings) {
      return [];
    }

    return bookings
      .filter((booking: any) => booking.user?.mobile_number)
      .map((booking: any) => ({
        bookingId: booking.booking_id,
        bookingDate: booking.booking_date,
        timeSlots: booking.slots
          .map((slot: any) => `${String(slot.hour).padStart(2, '0')}:00`)
          .sort(),
        location: booking.turf?.location?.name || '',
        service: booking.turf?.service?.name || '',
        turf: booking.turf?.name || '',
        customerName: booking.user?.full_name || 'Customer',
        customerPhone: booking.user?.mobile_number || '',
        totalAmount: booking.total_amount,
      }));
  }

  /**
   * Fetch booking details and send payment success notification (for use from webhook/server).
   */
  static async sendPaymentSuccessByBookingId(
    bookingRowId: string,
    amountPaid: number
  ): Promise<{ success: boolean; error?: string }> {
    const serviceClient = await createServiceClient();
    const { data: booking, error } = await serviceClient
      .from('bookings')
      .select(`
        booking_id,
        booking_date,
        total_amount,
        user:profiles!bookings_user_id_fkey(full_name, mobile_number),
        turf:turfs(
          name,
          location:locations(name),
          service:services(name)
        ),
        slots:booking_slots(hour)
      `)
      .eq('id', bookingRowId)
      .single();

    if (error || !booking) {
      return { success: false, error: 'Booking not found' };
    }

    const b = booking as any;
    if (!b.user?.mobile_number) {
      return { success: false, error: 'Customer phone number not found' };
    }

    const data: BookingReminderData & { amountPaid: number } = {
      bookingId: b.booking_id,
      bookingDate: b.booking_date,
      timeSlots: (b.slots || [])
        .map((slot: { hour: number }) => `${String(slot.hour).padStart(2, '0')}:00`)
        .sort(),
      location: b.turf?.location?.name || '',
      service: b.turf?.service?.name || '',
      turf: b.turf?.name || '',
      customerName: b.user?.full_name || 'Customer',
      customerPhone: b.user?.mobile_number || '',
      totalAmount: Number(b.total_amount),
      amountPaid,
    };
    return this.sendPaymentSuccess(data);
  }
}






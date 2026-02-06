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
   * Send booking confirmation. Template expects 7 params: bookingid, location, service, turf, date, timeslots, totalamount.
   */
  static async sendConfirmationReminder(data: BookingReminderData): Promise<{ success: boolean; error?: string }> {
    const formattedDate = format(new Date(data.bookingDate), 'dd MMM yyyy');
    const timeSlotsStr = data.timeSlots.join(', ');
    const templateName = WhatsAppService.getTemplateNameFor('booking_confirmation');
    return WhatsAppService.send({
      to: WhatsAppService.formatPhoneNumber(data.customerPhone),
      message: '',
      template: templateName,
      variables: {
        _paramOrder: '1,2,3,4,5,6,7',
        '1': data.bookingId,
        '2': data.location,
        '3': data.service,
        '4': data.turf,
        '5': formattedDate,
        '6': timeSlotsStr,
        '7': String(data.totalAmount),
      },
      askevaTemplateName: templateName,
    });
  }

  /**
   * Send booking reminder (scheduled). Same variables as notification-templates.ts: 6 params – bookingid, location, service, turf, date, timeslots.
   */
  static async sendReminder(data: BookingReminderData): Promise<{ success: boolean; error?: string }> {
    const formattedDate = format(new Date(data.bookingDate), 'dd MMM yyyy');
    const timeSlotsStr = data.timeSlots.join(', ');
    const templateName = WhatsAppService.getTemplateNameFor('booking_reminder');
    return WhatsAppService.send({
      to: WhatsAppService.formatPhoneNumber(data.customerPhone),
      message: '',
      template: templateName,
      variables: {
        _paramOrder: '1,2,3,4,5,6',
        '1': data.bookingId,
        '2': data.location,
        '3': data.service,
        '4': data.turf,
        '5': formattedDate,
        '6': timeSlotsStr,
      },
      askevaTemplateName: templateName,
    });
  }

  /**
   * Send payment success. Same as notification-templates.ts: 8 params – bookingid, location, service, turf, date, timeslots, amountpaid, totalamount.
   */
  static async sendPaymentSuccess(
    data: BookingReminderData & { amountPaid: number }
  ): Promise<{ success: boolean; error?: string }> {
    const formattedDate = format(new Date(data.bookingDate), 'dd MMM yyyy');
    const timeSlotsStr = data.timeSlots.join(', ');
    const templateName = WhatsAppService.getTemplateNameFor('payment_success');
    return WhatsAppService.send({
      to: WhatsAppService.formatPhoneNumber(data.customerPhone),
      message: '',
      template: templateName,
      variables: {
        _paramOrder: '1,2,3,4,5,6,7,8',
        '1': data.bookingId,
        '2': data.location,
        '3': data.service,
        '4': data.turf,
        '5': formattedDate,
        '6': timeSlotsStr,
        '7': String(data.amountPaid),
        '8': String(data.totalAmount),
      },
      askevaTemplateName: templateName,
    });
  }

  /**
   * Send payment reminder. Same as notification-templates.ts: 5 params – bookingid, date, location, amountdue, paymenturl.
   */
  static async sendPaymentReminder(
    data: BookingReminderData & { paymentAmount: number; bookingRowId?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentUrl = data.bookingRowId
      ? `${base}/bookings/${data.bookingRowId}/payment`
      : `${base}/bookings/${data.bookingId}/payment`;
    const formattedDate = format(new Date(data.bookingDate), 'dd MMM yyyy');
    const templateName = WhatsAppService.getTemplateNameFor('payment_reminder');
    return WhatsAppService.send({
      to: WhatsAppService.formatPhoneNumber(data.customerPhone),
      message: '',
      template: templateName,
      variables: {
        _paramOrder: '1,2,3,4,5',
        '1': data.bookingId,
        '2': formattedDate,
        '3': data.location,
        '4': String(data.paymentAmount),
        '5': paymentUrl,
      },
      askevaTemplateName: templateName,
    });
  }

  /**
   * Send booking cancellation notification. Template expects 6 params: bookingid, location, service, turf, date, timeslots.
   */
  static async sendCancellation(data: BookingReminderData): Promise<{ success: boolean; error?: string }> {
    const formattedDate = format(new Date(data.bookingDate), 'dd MMM yyyy');
    const timeSlotsStr = data.timeSlots.join(', ');
    const templateName = WhatsAppService.getTemplateNameFor('booking_cancellation');
    return WhatsAppService.send({
      to: WhatsAppService.formatPhoneNumber(data.customerPhone),
      message: '',
      template: templateName,
      variables: {
        _paramOrder: '1,2,3,4,5,6',
        '1': data.bookingId,
        '2': data.location,
        '3': data.service,
        '4': data.turf,
        '5': formattedDate,
        '6': timeSlotsStr,
      },
      askevaTemplateName: templateName,
    });
  }

  /**
   * Fetch booking details and send cancellation notification (for use from actions).
   */
  static async sendCancellationByBookingId(bookingRowId: string): Promise<{ success: boolean; error?: string }> {
    const serviceClient = await createServiceClient();
    // Don't join profiles here: bookings_user_id_fkey points to auth.users, not profiles. Query booking + profile separately.
    const { data: booking, error } = await serviceClient
      .from('bookings')
      .select(`
        booking_id,
        booking_date,
        total_amount,
        user_id,
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
      console.error('[WhatsApp] Cancellation: booking fetch failed', { bookingRowId, supabaseError: error });
      return { success: false, error: 'Booking not found' };
    }

    const b = booking as any;
    const userId = b.user_id as string | undefined;
    if (!userId) {
      return { success: false, error: 'Booking has no user_id' };
    }

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('full_name, mobile_number')
      .eq('id', userId)
      .maybeSingle();
    const p = profile as { full_name?: string | null; mobile_number?: string | null } | null;
    const customerPhone = p?.mobile_number ?? undefined;
    const customerName = p?.full_name ?? 'Customer';

    if (!customerPhone) {
      console.error('[WhatsApp] Cancellation not sent: customer has no mobile_number in profile (booking id:', bookingRowId, ')');
      return { success: false, error: 'Customer phone number not found' };
    }

    const data: BookingReminderData = {
      bookingId: b.booking_id,
      bookingDate: b.booking_date,
      timeSlots: (b.slots || [])
        .map((slot: { hour: number }) => `${String(slot.hour).padStart(2, '0')}:00`)
        .sort(),
      location: b.turf?.location?.name || '',
      service: b.turf?.service?.name || '',
      turf: b.turf?.name || '',
      customerName,
      customerPhone,
      totalAmount: Number(b.total_amount),
    };
    return this.sendCancellation(data);
  }

  /**
   * Send welcome WhatsApp when user first adds mobile (complete profile / new account).
   * Only sends if ASKEVA_TEMPLATE_WELCOME is set (create a template with 1 body param {{1}} in your dashboard).
   */
  static async sendWelcome(customerPhone: string, customerName: string): Promise<{ success: boolean; error?: string }> {
    if (!process.env.ASKEVA_TEMPLATE_WELCOME) {
      return { success: true }; // skip if no welcome template configured (avoids "Template is not valid" API error)
    }
    const message = getRenderedTemplate('welcome', { customername: customerName || 'there' });
    return WhatsAppService.send({
      to: WhatsAppService.formatPhoneNumber(customerPhone),
      message,
      askevaTemplateName: WhatsAppService.getTemplateNameFor('welcome'),
    });
  }

  /**
   * Fetch booking details and send confirmation notification (e.g. when admin/staff set status to confirmed).
   */
  static async sendConfirmationByBookingId(bookingRowId: string): Promise<{ success: boolean; error?: string }> {
    const serviceClient = await createServiceClient();
    const { data: booking, error } = await serviceClient
      .from('bookings')
      .select(`
        booking_id,
        booking_date,
        total_amount,
        user_id,
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
    const userId = b.user_id as string | undefined;
    if (!userId) return { success: false, error: 'Booking has no user_id' };

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('full_name, mobile_number')
      .eq('id', userId)
      .maybeSingle();
    const p = profile as { full_name?: string | null; mobile_number?: string | null } | null;
    const customerPhone = p?.mobile_number ?? undefined;
    const customerName = p?.full_name ?? 'Customer';

    if (!customerPhone) {
      return { success: false, error: 'Customer phone number not found' };
    }

    const data: BookingReminderData = {
      bookingId: b.booking_id,
      bookingDate: b.booking_date,
      timeSlots: (b.slots || []).map((slot: { hour: number }) => `${String(slot.hour).padStart(2, '0')}:00`).sort(),
      location: b.turf?.location?.name || '',
      service: b.turf?.service?.name || '',
      turf: b.turf?.name || '',
      customerName,
      customerPhone,
      totalAmount: Number(b.total_amount),
    };
    return this.sendConfirmationReminder(data);
  }

  /**
   * Get bookings that need a reminder for a given "minutes before" window.
   * Booking start = booking_date + min(slots).hour. Send when that is ~minutesBefore from now.
   * Excludes bookings that already have a reminder sent for this minutes_before.
   */
  static async getBookingsNeedingRemindersForMinutes(
    minutesBefore: number,
    windowMinutes: number = 5
  ): Promise<(BookingReminderData & { bookingRowId: string })[]> {
    const serviceClient = await createServiceClient();
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + 3);
    const maxDateStr = format(maxDate, 'yyyy-MM-dd');

    const { data: bookings, error } = await serviceClient
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
      .gte('booking_date', today)
      .lte('booking_date', maxDateStr)
      .eq('booking_status', 'confirmed');

    if (error || !bookings?.length) return [];

    const { data: sentRows } = await (serviceClient.from('booking_reminders_sent') as any)
      .select('booking_id')
      .eq('minutes_before', minutesBefore);
    const sentBookingIds = new Set((sentRows ?? []).map((r: { booking_id: string }) => r.booking_id));

    const minMs = (minutesBefore - windowMinutes) * 60 * 1000;
    const maxMs = (minutesBefore + windowMinutes) * 60 * 1000;
    const result: (BookingReminderData & { bookingRowId: string })[] = [];

    for (const b of bookings as any[]) {
      if (!b.user?.mobile_number || sentBookingIds.has(b.id)) continue;
      const slots = b.slots ?? [];
      const minHour = slots.length ? Math.min(...slots.map((s: { hour: number }) => s.hour)) : 0;
      const startStr = `${b.booking_date}T${String(minHour).padStart(2, '0')}:00:00`;
      const bookingStart = new Date(startStr);
      const diffMs = bookingStart.getTime() - now.getTime();
      if (diffMs < minMs || diffMs > maxMs) continue;
      result.push({
        bookingRowId: b.id,
        bookingId: b.booking_id,
        bookingDate: b.booking_date,
        timeSlots: slots.map((s: { hour: number }) => `${String(s.hour).padStart(2, '0')}:00`).sort(),
        location: b.turf?.location?.name || '',
        service: b.turf?.service?.name || '',
        turf: b.turf?.name || '',
        customerName: b.user?.full_name || 'Customer',
        customerPhone: b.user?.mobile_number || '',
        totalAmount: b.total_amount,
      });
    }
    return result;
  }

  /**
   * Record that a reminder was sent for a booking at this "minutes before" slot.
   */
  static async recordReminderSent(bookingRowId: string, minutesBefore: number): Promise<void> {
    const serviceClient = await createServiceClient();
    await (serviceClient.from('booking_reminders_sent') as any).insert({
      booking_id: bookingRowId,
      minutes_before: minutesBefore,
    });
  }

  /**
   * Get active reminder schedules from DB (for cron).
   */
  static async getActiveReminderSchedules(): Promise<{ id: string; minutes_before: number; label: string }[]> {
    const serviceClient = await createServiceClient();
    const { data } = await (serviceClient.from('reminder_schedules') as any)
      .select('id, minutes_before, label')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    return (data ?? []) as { id: string; minutes_before: number; label: string }[];
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






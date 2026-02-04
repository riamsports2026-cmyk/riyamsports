import { WhatsAppService } from './whatsapp';
import { createServiceClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

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

export class BookingReminderService {
  /**
   * Send booking confirmation reminder
   */
  static async sendConfirmationReminder(data: BookingReminderData): Promise<{ success: boolean; error?: string }> {
    const formattedDate = format(new Date(data.bookingDate), 'dd MMM yyyy');
    const timeSlots = data.timeSlots.join(', ');
    
    const message = `🏸 *RIAM Sports - Booking Confirmation*

Your booking has been confirmed!

📋 *Booking Details:*
• Booking ID: ${data.bookingId}
• Location: ${data.location}
• Service: ${data.service}
• Turf: ${data.turf}
• Date: ${formattedDate}
• Time: ${timeSlots}
• Amount: ₹${data.totalAmount}

We look forward to seeing you! 🎾

For any queries, please contact us.`;

    return WhatsAppService.send({
      to: WhatsAppService.formatPhoneNumber(data.customerPhone),
      message,
    });
  }

  /**
   * Send booking reminder (24 hours before)
   */
  static async sendReminder(data: BookingReminderData): Promise<{ success: boolean; error?: string }> {
    const formattedDate = format(new Date(data.bookingDate), 'dd MMM yyyy');
    const timeSlots = data.timeSlots.join(', ');
    
    const message = `⏰ *RIAM Sports - Booking Reminder*

This is a reminder for your upcoming booking:

📋 *Booking Details:*
• Booking ID: ${data.bookingId}
• Location: ${data.location}
• Service: ${data.service}
• Turf: ${data.turf}
• Date: ${formattedDate}
• Time: ${timeSlots}

See you tomorrow! 🎾

For any changes or cancellations, please contact us.`;

    return WhatsAppService.send({
      to: WhatsAppService.formatPhoneNumber(data.customerPhone),
      message,
    });
  }

  /**
   * Send payment reminder
   */
  static async sendPaymentReminder(data: BookingReminderData & { paymentAmount: number }): Promise<{ success: boolean; error?: string }> {
    const formattedDate = format(new Date(data.bookingDate), 'dd MMM yyyy');
    
    const message = `💳 *RIAM Sports - Payment Reminder*

Your booking payment is pending:

📋 *Booking Details:*
• Booking ID: ${data.bookingId}
• Date: ${formattedDate}
• Location: ${data.location}
• Amount Due: ₹${data.paymentAmount}

Please complete the payment to confirm your booking.

Pay now: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bookings/${data.bookingId}/payment`;

    return WhatsAppService.send({
      to: WhatsAppService.formatPhoneNumber(data.customerPhone),
      message,
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
}






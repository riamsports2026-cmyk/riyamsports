import { NextRequest, NextResponse } from 'next/server';
import { BookingReminderService } from '@/lib/services/booking-reminders';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Cron job endpoint to send booking reminders
 * Should be called daily (e.g., via Vercel Cron, Supabase Edge Functions, or external cron service)
 * 
 * Setup:
 * 1. Vercel: Add to vercel.json
 * 2. Supabase: Create Edge Function with pg_cron
 * 3. External: Use cron-job.org or similar
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bookings = await BookingReminderService.getBookingsNeedingReminders();
    const results = [];

    for (const booking of bookings) {
      const result = await BookingReminderService.sendReminder(booking);
      
      if (result.success) {
        const serviceClient = await createServiceClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (serviceClient.from('bookings') as any)
          .update({ reminder_sent: new Date().toISOString() })
          .eq('booking_id', booking.bookingId);
      }

      results.push({
        bookingId: booking.bookingId,
        success: result.success,
        error: result.error,
      });
    }

    return NextResponse.json({
      success: true,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to send reminders' },
      { status: 500 }
    );
  }
}






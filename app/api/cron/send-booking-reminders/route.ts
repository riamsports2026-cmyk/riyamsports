import { NextRequest, NextResponse } from 'next/server';
import { BookingReminderService } from '@/lib/services/booking-reminders';

/**
 * Cron: send booking reminders for each active schedule (e.g. 1 day, 1 hour, 5 min before).
 * Call every 5 minutes so 5-min and 1-hour windows are hit (e.g. cron-job.org or Vercel Cron).
 *
 * Setup:
 * - Vercel: add to vercel.json crons, e.g. every 5 min or hourly
 * - External: GET /api/cron/send-booking-reminders with Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const schedules = await BookingReminderService.getActiveReminderSchedules();
    if (!schedules?.length) {
      return NextResponse.json({
        success: true,
        message: 'No active reminder schedules. Add schedules in Admin → Reminders.',
        results: [],
      });
    }

    const results: { schedule: string; minutes_before: number; sent: number; failed: number; details: { bookingId: string; success: boolean; error?: string }[] }[] = [];

    for (const schedule of schedules) {
      const bookings = await BookingReminderService.getBookingsNeedingRemindersForMinutes(schedule.minutes_before);
      const details: { bookingId: string; success: boolean; error?: string }[] = [];

      for (const booking of bookings) {
        const result = await BookingReminderService.sendReminder(booking);
        if (result.success) {
          await BookingReminderService.recordReminderSent(booking.bookingRowId, schedule.minutes_before);
        } else if (result.error) {
          console.error('[Cron] Reminder send failed', { bookingId: booking.bookingId, error: result.error });
        }
        details.push({
          bookingId: booking.bookingId,
          success: result.success,
          error: result.error,
        });
      }

      results.push({
        schedule: schedule.label,
        minutes_before: schedule.minutes_before,
        sent: details.filter((d) => d.success).length,
        failed: details.filter((d) => !d.success).length,
        details,
      });
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send reminders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

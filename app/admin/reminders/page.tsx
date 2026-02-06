import { getReminderSchedules } from '@/lib/actions/admin/reminders';
import { ReminderSchedulesList } from '@/components/admin/reminder-schedules-list';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Booking Reminders | Admin',
  description: 'Configure when to send WhatsApp reminders (e.g. 1 day, 1 hour, 5 min before)',
};

export default async function AdminRemindersPage() {
  const schedules = await getReminderSchedules();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
          Booking Reminders
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Choose when to send WhatsApp reminders (e.g. 1 day before, 1 hour before, 5 minutes before). 
          Cron should call <code className="bg-gray-100 px-1 rounded">/api/cron/send-booking-reminders</code> every 5 minutes.
        </p>
      </div>

      <div className="bg-white shadow-xl rounded-xl border-2 border-[#1E3A5F]/10 p-6 sm:p-8">
        <ReminderSchedulesList initialSchedules={schedules} />
      </div>
    </div>
  );
}

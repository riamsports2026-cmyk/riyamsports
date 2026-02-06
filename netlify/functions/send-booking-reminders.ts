/**
 * Netlify Scheduled Function: runs every 5 minutes and calls the Next.js cron API
 * so booking reminders (1 day, 1 hour, 5 min before) are sent.
 *
 * Requires env: CRON_SECRET. Netlify sets URL to the site URL.
 */

export default async () => {
  const baseUrl = process.env.URL || process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.CRON_SECRET;
  if (!baseUrl) {
    console.error('send-booking-reminders: URL or NEXT_PUBLIC_APP_URL not set');
    return;
  }
  if (!secret) {
    console.error('send-booking-reminders: CRON_SECRET not set');
    return;
  }
  const url = `${baseUrl.replace(/\/$/, '')}/api/cron/send-booking-reminders`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!res.ok) {
      console.error('send-booking-reminders:', res.status, await res.text());
    }
  } catch (err) {
    console.error('send-booking-reminders:', err);
  }
};

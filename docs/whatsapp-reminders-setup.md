# WhatsApp Booking Reminders Setup

This guide explains how to set up WhatsApp reminders for bookings.

## Features (Notifications Module)

- ✅ **WhatsApp Booking Confirmation** – Sent automatically when a booking is created
- ✅ **Payment Success Notification** – Sent when payment is captured (Razorpay/PayGlobal webhook)
- ✅ **Booking Reminder (Scheduled)** – Sent 24 hours before booking via cron (`/api/cron/send-booking-reminders`)
- ✅ **Dynamic Message Templates** – Templates in `lib/services/notification-templates.ts` with placeholders (`{{booking_id}}`, `{{date}}`, etc.)
- ✅ **Customer Mobile Number Validation** – Validation and normalization in `lib/utils/phone.ts`; used in profile, complete-profile, admin create-user, and before sending WhatsApp

## Setup (AskEva only)

WhatsApp notifications use the **AskEva Consumer API** only. Messages are sent as **template messages** (one template with a single body variable for the full message text).

1. **Get API key**
   - Log in to AskEva Dashboard → **Settings** → **API Settings** → **Create New API Key**
   - Copy the token (used as query parameter on every request)

2. **Create a default message template (for all notifications)**
   - In AskEva / Facebook WhatsApp Manager, create a template with **one body variable** (e.g. `{{1}}` or your template’s variable).
   - Example body: `Hello, here is your message: {{1}}`
   - Note the template **name** (e.g. `riamsports_message`).

3. **Add to Environment Variables**
   ```env
   ASKEVA_API_TOKEN=your_api_key_from_dashboard
   ASKEVA_DEFAULT_MESSAGE_TEMPLATE=riamsports_message
   ```
   - **One template for all:** Set only `ASKEVA_DEFAULT_MESSAGE_TEMPLATE`; every notification uses it (message text in the single body variable).
   - **Different template per notification (recommended):** Create four templates in AskEva (each with one body variable `{{1}}`) and set:
   ```env
   ASKEVA_TEMPLATE_BOOKING_CONFIRMATION=riamsports_booking_confirm
   ASKEVA_TEMPLATE_PAYMENT_SUCCESS=riamsports_payment_success
   ASKEVA_TEMPLATE_BOOKING_REMINDER=riamsports_booking_reminder
   ASKEVA_TEMPLATE_PAYMENT_REMINDER=riamsports_payment_reminder
   ```
   If a per-type variable is missing, the app falls back to `ASKEVA_DEFAULT_MESSAGE_TEMPLATE`, then `postman_textvariable`.

4. **API details (for reference)**
   - Base URL: `https://backend.askeva.io/v1`
   - Send message: `POST /v1/message/send-message?token=YOUR_TOKEN`
   - Body: `{ "to": "919876543210", "type": "template", "template": { "language": { "policy": "deterministic", "code": "en" }, "name": "...", "components": [ { "type": "body", "parameters": [ { "type": "text", "text": "..." } ] } ] } }`
   - Get templates: `GET https://backend.askeva.io/v1/templates?token=YOUR_TOKEN`

## Setting Up Automated Reminders

### Using Vercel Cron Jobs

1. **Add to `vercel.json`**
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/send-booking-reminders",
         "schedule": "0 9 * * *"
       }
     ]
   }
   ```

2. **Set CRON_SECRET**
   ```env
   CRON_SECRET=your_random_secret_string
   ```

### Using External Cron Service

1. **Use a service like cron-job.org**
   - URL: `https://yourdomain.com/api/cron/send-booking-reminders`
   - Schedule: Daily at 9 AM
   - Method: GET
   - Headers: `Authorization: Bearer your_cron_secret`

### Using Supabase Edge Functions

Create a Supabase Edge Function that calls the API endpoint daily.

## Manual Sending

You can also send reminders manually using the server actions:

```typescript
import { sendBookingConfirmation, sendPaymentReminder } from '@/lib/actions/notifications';

// Send confirmation after booking
await sendBookingConfirmation(bookingId);

// Send payment reminder
await sendPaymentReminder(bookingId);
```

## Database Migration

Run the migration to add the `reminder_sent` column:

```sql
-- Run in Supabase SQL Editor
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reminder_sent TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_reminder_sent 
ON bookings(reminder_sent) 
WHERE reminder_sent IS NULL;
```

## Testing

1. **Test WhatsApp Service**
   ```typescript
   import { WhatsAppService } from '@/lib/services/whatsapp';
   
   const result = await WhatsAppService.send({
     to: '+919876543210',
     message: 'Test message from RIAM Sports'
   });
   ```

2. **Test Reminder**
   - Create a test booking for tomorrow
   - Call the cron endpoint manually
   - Check if reminder is sent

## Message Templates

Templates are defined in `lib/services/notification-templates.ts` with placeholders like `{{booking_id}}`, `{{date}}`, `{{time_slots}}`, `{{location}}`, `{{amount_paid}}`, etc. The system sends:

1. **Booking Confirmation** – After booking creation (with payment link if pending)
2. **Payment Success** – When payment is captured (webhook)
3. **Booking Reminder** – 24 hours before booking (cron)
4. **Payment Reminder** – For pending payments (manual or scheduled)

All messages include booking ID, location, service, turf, date, time slots, and amount info. To change copy, edit the template strings in `notification-templates.ts`.

## Troubleshooting

### Messages Not Sending

1. Check environment variables are set correctly
2. Verify phone number format (should include country code)
3. Check Twilio/Meta account status and credits
4. Review error logs in the API response

### Phone Number Format and Validation

Customer mobile numbers are validated in:
- **Profile / Complete Profile** – `lib/actions/profile.ts` uses `lib/utils/phone.ts`
- **Admin Create User** – `lib/actions/admin/create-user.ts`
- **WhatsApp send** – `WhatsAppService.send()` validates and normalizes before sending

Accepted formats:
- ✅ Indian 10-digit: `9876543210`, `919876543210`, `+919876543210`
- ✅ E.164 for other countries (10–15 digits with country code)
- ❌ Invalid: missing digits, wrong length, or non-numeric

The service normalizes to a consistent format (e.g. `+91` + 10 digits) before saving or sending.

## Cost Considerations

Check AskEva pricing for WhatsApp message/conversation costs.






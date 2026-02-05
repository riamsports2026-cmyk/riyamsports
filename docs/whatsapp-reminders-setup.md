# WhatsApp Booking Reminders Setup

This guide explains how to set up WhatsApp reminders for bookings.

## Features (Notifications Module)

- ✅ **WhatsApp Booking Confirmation** – Sent automatically when a booking is created
- ✅ **Payment Success Notification** – Sent when payment is captured (Razorpay/PayGlobal webhook)
- ✅ **Booking Reminder (Scheduled)** – Sent 24 hours before booking via cron (`/api/cron/send-booking-reminders`)
- ✅ **Dynamic Message Templates** – Templates in `lib/services/notification-templates.ts` with placeholders (`{{booking_id}}`, `{{date}}`, etc.)
- ✅ **Customer Mobile Number Validation** – Validation and normalization in `lib/utils/phone.ts`; used in profile, complete-profile, admin create-user, and before sending WhatsApp

## Setup Options

### Option 1: Twilio WhatsApp API (Recommended for Quick Setup)

1. **Sign up for Twilio**
   - Go to https://www.twilio.com
   - Create an account and verify your phone number
   - Get a Twilio WhatsApp-enabled number

2. **Get Credentials**
   - Account SID: Found in Twilio Console Dashboard
   - Auth Token: Found in Twilio Console Dashboard
   - WhatsApp From Number: Format `whatsapp:+14155238886`

3. **Add to Environment Variables**
   ```env
   WHATSAPP_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```

### Option 2: Meta WhatsApp Business API

1. **Set up Meta Business Account**
   - Go to https://business.facebook.com
   - Create a Business Account
   - Set up WhatsApp Business API

2. **Get Credentials**
   - Access Token: From Meta Business Manager
   - Phone Number ID: Your WhatsApp Business phone number ID

3. **Add to Environment Variables**
   ```env
   WHATSAPP_PROVIDER=meta
   WHATSAPP_ACCESS_TOKEN=your_access_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   ```

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

- **Twilio**: Pay per message (varies by country)
- **Meta**: Free tier available, then pay per conversation

Check pricing on respective provider websites.






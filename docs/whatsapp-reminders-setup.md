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
   WHATSAPP_API_URL=https://wpapi.propluslogics.com/v1
   ASKEVA_DEFAULT_MESSAGE_TEMPLATE=riamsports_message
   ```
   - **WHATSAPP_API_URL** (optional): API base URL. Default is `https://wpapi.propluslogics.com/v1`. Send endpoint is `{WHATSAPP_API_URL}/message/send-message`.
   - **One template for all:** Set only `ASKEVA_DEFAULT_MESSAGE_TEMPLATE`; every notification uses it (message text in the single body variable).
   - **Different template per notification (recommended):** Create five templates in AskEva (each with one body variable `{{1}}`) and set:
   ```env
   ASKEVA_TEMPLATE_BOOKING_CONFIRMATION=riamsports_booking_confirm
   ASKEVA_TEMPLATE_PAYMENT_SUCCESS=riamsports_payment_success
   ASKEVA_TEMPLATE_BOOKING_REMINDER=riamsports_booking_reminder
   ASKEVA_TEMPLATE_PAYMENT_REMINDER=riamsports_payment_reminder
   ASKEVA_TEMPLATE_BOOKING_CANCELLATION=riamsports_booking_cancellation
   ```
   If a per-type variable is missing, the app falls back to `ASKEVA_DEFAULT_MESSAGE_TEMPLATE`, then `postman_textvariable`.

---

### AskEva dashboard – template structure (create these in AskEva)

Create templates in the AskEva dashboard (or Meta WhatsApp Manager). Each template needs **one body variable** `{{1}}`. The app sends the full message text as that variable.

**AskEva rules:**
- **Template name:** Use only **letters, numbers, and underscores** (no spaces, hyphens, or special characters). Example: `riamsports_booking_confirmation`.
- **Variable content:** In the dashboard you cannot use special characters in the variable (or in the sample for `{{1}}`). Use only letters, numbers, spaces, and basic punctuation. The app automatically strips emojis and symbols (₹ → "Rs ", • → "- ", * removed) from the message before sending, so it fits this rule.

**Option 1 – One template for all notifications**

| Field | Value |
|-------|--------|
| **Template name** | `riamsports_message` (or any name you like) |
| **Language** | English (`en`) |
| **Body** | `{{1}}` |
| **Sample for {{1}}** | `Your booking is confirmed. ID: BK123. Date: 15 Jan 2025.` |

Then set only: `ASKEVA_DEFAULT_MESSAGE_TEMPLATE=riamsports_message`

---

**Option 2 – Five templates (one per notification type)**

Use this **exact structure** when creating each template:

| # | Template name (use in env) | Language | Body text | When it's used |
|---|----------------------------|----------|-----------|-----------------|
| 1 | `riamsports_booking_confirmation` | English (en) | See below | After customer creates a booking |
| 2 | `riamsports_payment_success`      | English (en) | See below | After payment is successful |
| 3 | `riamsports_booking_reminder`    | English (en) | See below | Before booking (configurable) |
| 4 | `riamsports_payment_reminder`    | English (en) | See below | When you send a payment reminder |
| 5 | `riamsports_booking_cancellation` | English (en) | See below | When a booking is cancelled (customer or admin/staff) |

**Body text for each template:** use exactly **one variable** `{{1}}`. The app will replace it with the full message.

- **Option A (recommended):** Body = `{{1}}`  
  (The entire message is dynamic; our app sends the full formatted text here.)

- **Option B:** If the dashboard requires static text, use:  
  `RIAM Sports: {{1}}`  
  (Our app still sends the full message; it will appear after "RIAM Sports: ".)

**Sample value for approval (use when AskEva/Meta asks for a sample for `{{1}}`):**  
Use only letters, numbers, spaces, and basic punctuation (no emojis, no ₹, no •). Example:

```
Booking confirmed. ID: BK123. Date: 15 Jan 2025. Location: Main Turf. Amount: Rs 500.
```

**Example of what the app sends in `{{1}}` for each type:**

1. **Booking confirmation** – multi-line with booking ID, location, service, turf, date, time, amount.
2. **Payment success** – thank you + booking details + amount paid and total.
3. **Booking reminder** – reminder text + booking details (no amount).
4. **Payment reminder** – pending payment + booking ID, date, location, amount due + payment link.
5. **Booking cancellation** – cancellation notice + booking details (ID, location, service, turf, date, time).

After creating the templates, set in your env (names must match exactly):

```env
ASKEVA_TEMPLATE_BOOKING_CONFIRMATION=riamsports_booking_confirmation
ASKEVA_TEMPLATE_PAYMENT_SUCCESS=riamsports_payment_success
ASKEVA_TEMPLATE_BOOKING_REMINDER=riamsports_booking_reminder
ASKEVA_TEMPLATE_PAYMENT_REMINDER=riamsports_payment_reminder
ASKEVA_TEMPLATE_BOOKING_CANCELLATION=riamsports_booking_cancellation
```

---

4. **API details (for reference)**
   - Default base URL: `https://wpapi.propluslogics.com/v1` (override with `WHATSAPP_API_URL`).
   - Send message: `POST {base}/message/send-message?token=YOUR_TOKEN`
   - Body: `{ "to": "919876543210", "type": "template", "template": { "language": { "policy": "deterministic", "code": "en" }, "name": "...", "components": [ { "type": "body", "parameters": [ { "type": "text", "text": "..." } ] } ] } }`

## Setting Up Automated Reminders

Reminders are configurable in **Admin → Reminders**: you can add multiple times (e.g. 1 day before, 1 hour before, 5 minutes before). The cron runs for each active schedule and sends WhatsApp when a booking start time falls in that window.

### Using Vercel Cron Jobs

1. **Add to `vercel.json`**  
   Call the endpoint **every 5 minutes** so that "5 min before" and "1 hour before" windows are hit:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/send-booking-reminders",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```

2. **Set CRON_SECRET**
   ```env
   CRON_SECRET=your_random_secret_string
   ```

3. **Configure reminder times in Admin**  
   Go to **Admin → Reminders** to add or edit schedules (e.g. "1 day before", "1 hour before", "5 minutes before"). Each schedule is sent at most once per booking. Default seed: 1 day (1440 min), 1 hour (60 min), 5 min.

### Using Netlify (this project)

If you deploy on **Netlify**, a scheduled function is already set up:

1. **`netlify/functions/send-booking-reminders.ts`** runs **every 5 minutes** (configured in `netlify.toml`). It calls your site’s `GET /api/cron/send-booking-reminders` with `Authorization: Bearer CRON_SECRET`.

2. **Set in Netlify env**
   - `CRON_SECRET` – same secret you use to protect the cron API.
   - `URL` is set by Netlify to your site URL; optionally set `NEXT_PUBLIC_APP_URL` if you need to override.

3. After deploy, the function appears under **Netlify → Functions** with a **Scheduled** badge. You can run it once manually with **Run now** to test.

### Using External Cron Service

1. **Use a service like cron-job.org**
   - URL: `https://yourdomain.com/api/cron/send-booking-reminders`
   - Schedule: **Every 5 minutes** (so 5-min and 1-hour reminders work)
   - Method: GET
   - Headers: `Authorization: Bearer your_cron_secret`

### Using Supabase Edge Functions

Create a Supabase Edge Function (or pg_cron) that calls the API endpoint every 5 minutes.

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

Templates are defined in `lib/services/notification-templates.ts` with placeholders like `{{bookingid}}`, `{{date}}`, `{{timeslots}}`, `{{location}}`, `{{amountpaid}}`, `{{paymenturl}}` (letters/numbers only, no underscores or special chars for AskEva compatibility). The system sends:

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

## Troubleshooting: Not receiving WhatsApp messages

If you cancel a booking (or create one, pay, etc.) but no WhatsApp is received:

1. **Check server logs** (terminal when running `npm run dev`, or Vercel/Netlify function logs). You should see one of:
   - `[WhatsApp] ASKEVA_API_TOKEN is not set` → Add `ASKEVA_API_TOKEN` to your `.env`.
   - `[WhatsApp] Cancellation not sent: customer has no mobile_number in profile` → The customer’s profile has no phone number. They must add it in Profile or Complete Profile (or you add it in Admin).
   - `[WhatsApp] API error 401 ...` or `[WhatsApp] Send failed: ...` → Token wrong, or `WHATSAPP_API_URL` wrong, or API returned an error (check the logged message).

2. **Ensure the customer has a mobile number** in **Profile** (or **Complete profile**). The app sends to `profiles.mobile_number` for the booking’s user.

3. **Env vars:** `ASKEVA_API_TOKEN` is required. `WHATSAPP_API_URL` is optional (default `https://wpapi.propluslogics.com/v1`). Use the same URL and token your WhatsApp provider (e.g. ProPlus Logics) gave you.

4. **Cancel a test booking** and watch the terminal; you should see either no error (message sent) or a clear `[WhatsApp] ...` error line.

## Cost Considerations

Check AskEva pricing for WhatsApp message/conversation costs.






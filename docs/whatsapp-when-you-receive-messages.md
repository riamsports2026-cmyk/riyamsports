# When You Receive WhatsApp Messages

This list shows **every case** when a customer receives a WhatsApp message from RIAM Sports.

---

## 1. Booking confirmation  
**When:** Right after the customer **creates a booking** (Book Now on the booking form).  
**Trigger:** Customer completes the booking form and submits.  
**Message:** Booking details (ID, location, service, turf, date, time, amount).  
**Template:** `booking_confirmation`

---

## 2. Payment success  
**When:** After a **successful payment** (advance or full) via Razorpay or PayGlobal.  
**Trigger:** Payment webhook receives a successful payment event.  
**Message:** Thank you + booking details + amount paid and total.  
**Template:** `payment_success`

---

## 3. Booking reminder (scheduled)  
**When:** **Before the booking start time**, at the times you configure in **Admin → Reminders** (e.g. 1 day before, 1 hour before, 30 minutes before).  
**Trigger:** Cron job runs (e.g. every 5 minutes) and sends reminders for bookings that fall in each schedule’s window.  
**Message:** Reminder text + booking details (no amount).  
**Template:** `booking_reminder`  
**Note:** You can add multiple reminder schedules (e.g. 24 hours, 1 hour, 5 minutes before).

---

## 4. Payment reminder (pending payment)  
**When:** Only when **you manually send** a payment reminder (e.g. from admin or an action that calls `sendPaymentReminder(bookingId)`).  
**Trigger:** Not automatic by default; triggered by your code or an admin action.  
**Message:** Pending payment + booking ID, date, location, amount due + payment link.  
**Template:** `payment_reminder`

---

## 5. Booking cancelled  
**When:** Whenever a booking is **cancelled**, in any of these cases:  
- Customer cancels their own booking (Cancel button on booking page)  
- Admin sets booking status to **Cancelled** (Admin → Bookings)  
- Staff sets booking status to **Cancelled** (Staff → Bookings)  
**Message:** Cancellation notice + booking details.  
**Template:** `booking_cancellation`

---

## Summary table

| # | Message type        | When you receive it                          |
|---|---------------------|-----------------------------------------------|
| 1 | Booking confirmation| After creating a booking                      |
| 2 | Payment success     | After payment is successful (webhook)         |
| 3 | Booking reminder    | At configured times before booking (cron)     |
| 4 | Payment reminder    | When you manually send it                     |
| 5 | Booking cancelled   | When booking is cancelled (customer/admin/staff) |

---

## Requirements for messages to be sent

- **ASKEVA_API_TOKEN** (or your WhatsApp API token) must be set.  
- **WHATSAPP_API_URL** can be set (default: `https://wpapi.propluslogics.com/v1`).  
- Customer **mobile number** must be saved in their profile and valid.  
- For reminders: cron must be set up (e.g. Netlify/Vercel cron hitting `/api/cron/send-booking-reminders`).

See **whatsapp-reminders-setup.md** for full setup.

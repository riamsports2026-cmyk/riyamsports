# Razorpay Webhook Setup

Use this so your app automatically confirms payments and sends the "Payment success" WhatsApp when a customer pays via Razorpay.

---

## Option A: Single webhook (recommended)

Use **one** webhook in Razorpay for both Payment and Order events. One URL ⇒ one Webhook Secret ⇒ no 401 on `order.paid`.

### Checklist

1. **Razorpay Dashboard**
   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com/) → **Settings** → **Webhooks** (or **Developers** → **Webhooks**).
   - If you already have **two** webhooks (e.g. one for Payment, one for Order): **delete** the extra one, or edit so you end up with **only one** webhook entry.

2. **Create or edit the single webhook**
   - **Webhook URL:** `https://booking.riamsportsarena.com/api/webhooks/payment` (or your production domain).
   - **Active events** – enable **both**:
     - **Payment** → **payment.captured**
     - **Order** → **order.paid**
   - Save.

3. **Copy the Webhook Secret**
   - After saving, Razorpay shows a **Webhook Secret** for this webhook. Copy it (you won’t see it again unless you regenerate).

4. **Set the secret in Netlify**
   - Netlify → your site → **Site configuration** → **Environment variables**.
   - Add or edit: **Key** `RAZORPAY_WEBHOOK_SECRET`, **Value** = the secret you copied.
   - **Redeploy** the site so the new variable is used.

5. **Verify**
   - Make a test payment. In Razorpay Dashboard → Webhooks → your webhook → **Event Log**, both `payment.captured` / `payment.authorized` and `order.paid` should show **200**.

---

## 1. Webhook URL

Use this URL in the Razorpay dashboard (replace with your real domain):

```
https://YOUR_DOMAIN.com/api/webhooks/payment
```

Examples:
- Production: `https://riamsports.com/api/webhooks/payment`
- Local (ngrok): `https://abc123.ngrok.io/api/webhooks/payment`

Razorpay will send a **POST** request to this URL when a payment is captured. Your app verifies the signature using the **Webhook Secret** from Razorpay Dashboard (see below).

---

## 2. Steps in Razorpay Dashboard

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Go to **Settings** → **Webhooks** (or **Developers** → **Webhooks**).
3. Click **+ Add New Webhook**.
4. **Webhook URL:** `https://YOUR_DOMAIN.com/api/webhooks/payment`
5. **Alert email:** Your email (optional).
6. **Active events:** Enable at least one (both recommended so either event confirms the payment):
   - **Payment** → **payment.captured**
   - **Order** → **order.paid**
7. Save.
8. **Use a single webhook** for all events. If you create two webhooks (e.g. one for Payment, one for Order), each has its own **Webhook Secret** – you can only set one in `RAZORPAY_WEBHOOK_SECRET`, so one of them will get 401. Prefer one webhook URL with both events.
9. **Copy the Webhook Secret** shown after saving (or when you edit the webhook). This is **not** the same as your API Key Secret. Set it as `RAZORPAY_WEBHOOK_SECRET` in Netlify (see next section).

Razorpay sends the header **x-razorpay-signature** (HMAC SHA256 of the raw request body using the Webhook Secret). If you don’t set `RAZORPAY_WEBHOOK_SECRET`, the app falls back to `RAZORPAY_KEY_SECRET` for verification (not recommended for production).

---

## 3. Environment variables

In `.env` or **Netlify** (Site → Environment variables):

```env
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_dashboard
```

- **RAZORPAY_WEBHOOK_SECRET** – **Required for production.** Copy from Razorpay Dashboard → Webhooks → your webhook → Secret. If this is missing or wrong, the webhook will return **401 Unauthorized** (signature verification fails).
- **RAZORPAY_KEY_SECRET** – Used for creating orders and (if `RAZORPAY_WEBHOOK_SECRET` is not set) for webhook verification.

---

## 4. What the app does when it receives the webhook

1. Verifies **x-razorpay-signature** using `RAZORPAY_WEBHOOK_SECRET` (or `RAZORPAY_KEY_SECRET` if webhook secret is not set).
2. Handles **payment.captured** and **order.paid** (same logic for both):
   - Finds the payment row by `gateway_order_id` (Razorpay order id).
   - Updates payment: `gateway_payment_id`, `status: success`.
   - Updates booking: `received_amount`, `payment_status`, `booking_status: confirmed`.
   - Sends **Payment success** and **Booking confirmation** WhatsApp to the customer.

If the signature is invalid, the API returns **401**. If the payment/booking is not found, it still returns **200** so Razorpay doesn’t retry unnecessarily.

**Why does order.paid show 401 but payment.authorized show 200?** Razorpay sends different events to the same URL. If you have **two webhooks** in the Dashboard (e.g. one for Payment events, one for Order events), each has its **own Webhook Secret**. The app only has one `RAZORPAY_WEBHOOK_SECRET`, so one webhook’s events will fail signature verification (401). **Fix:** Use **one webhook** that subscribes to both **payment.captured** and **order.paid**, and set `RAZORPAY_WEBHOOK_SECRET` to that webhook’s secret.

---

## 5. Local testing (optional)

1. Expose your local server with [ngrok](https://ngrok.com/):  
   `ngrok http 3000`
2. In Razorpay, add the ngrok URL:  
   `https://xxxx.ngrok.io/api/webhooks/payment`
3. Use **Test mode** and make a test payment to trigger the webhook.

---

## Summary

| Item | Value |
|------|--------|
| **URL** | `https://YOUR_DOMAIN/api/webhooks/payment` |
| **Method** | POST |
| **Events** | `payment.captured`, `order.paid` (use one webhook for both) |
| **Auth** | Signature in header `x-razorpay-signature` (verified with RAZORPAY_WEBHOOK_SECRET from Dashboard) |
| **401 cause** | Missing or wrong `RAZORPAY_WEBHOOK_SECRET` in Netlify → set it from Razorpay Dashboard → Webhooks → Secret |

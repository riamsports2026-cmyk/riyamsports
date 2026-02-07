# Razorpay Webhook Setup

Use this so your app automatically confirms payments and sends the "Payment success" WhatsApp when a customer pays via Razorpay.

---

## 1. Webhook URL

Use this URL in the Razorpay dashboard (replace with your real domain):

```
https://YOUR_DOMAIN.com/api/webhooks/payment
```

Examples:
- Production: `https://riamsports.com/api/webhooks/payment`
- Local (ngrok): `https://abc123.ngrok.io/api/webhooks/payment`

Razorpay will send a **POST** request to this URL when a payment is captured. Your app verifies the signature using **RAZORPAY_KEY_SECRET** (no separate webhook secret).

---

## 2. Steps in Razorpay Dashboard

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Go to **Settings** → **Webhooks** (or **Developers** → **Webhooks**).
3. Click **+ Add New Webhook**.
4. **Webhook URL:** `https://YOUR_DOMAIN.com/api/webhooks/payment`
5. **Alert email:** Your email (optional).
6. **Active events:** Enable at least:
   - **Payment** → **payment.captured**
7. Save.

Razorpay will send the webhook with header **x-razorpay-signature**. Your app verifies it using `RAZORPAY_KEY_SECRET` (HMAC SHA256 of the request body).

---

## 3. Environment variables

In `.env` (or your host’s env):

```env
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=your_key_secret
```

The **same** key secret is used for:
- Creating orders (API).
- Verifying webhook signature (so no separate webhook secret).

---

## 4. What the app does when it receives the webhook

1. Verifies **x-razorpay-signature** using `RAZORPAY_KEY_SECRET`.
2. If the event is **payment.captured**:
   - Finds the payment row by `gateway_order_id` (Razorpay order id).
   - Updates payment: `gateway_payment_id`, `status: success`.
   - Updates booking: `received_amount`, `payment_status`, `booking_status: confirmed`.
   - Sends **Payment success** WhatsApp to the customer.

If the signature is invalid, the API returns **401**. If the payment/booking is not found, it still returns **200** so Razorpay doesn’t retry unnecessarily.

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
| **Event** | `payment.captured` |
| **Auth** | Signature in header `x-razorpay-signature` (verified with RAZORPAY_KEY_SECRET) |
| **No extra secret** | Razorpay uses the same key secret for webhook verification |

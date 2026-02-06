/**
 * Dynamic message templates for WhatsApp notifications.
 * Placeholders: {{key}} replaced with values from context.
 * Use only letters and numbers in placeholder names (no underscores/special chars) for AskEva compatibility.
 */

export type TemplateContext = Record<string, string | number | undefined>;

const PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g;

/**
 * Render a template string with {{placeholder}} replaced by context values.
 */
export function renderTemplate(
  template: string,
  context: TemplateContext
): string {
  return template.replace(PLACEHOLDER_REGEX, (_, key) => {
    const value = context[key];
    return value !== undefined && value !== null ? String(value) : '';
  });
}

export const NOTIFICATION_TEMPLATES = {
  /** Sent when a booking is created (pending or confirmed). */
  booking_confirmation: `🏸 *RIAM Sports - Booking Confirmation*

Your booking has been confirmed!

📋 *Booking Details:*
• Booking ID: {{bookingid}}
• Location: {{location}}
• Service: {{service}}
• Turf: {{turf}}
• Date: {{date}}
• Time: {{timeslots}}
• Amount: ₹{{totalamount}}

We look forward to seeing you! 🎾

For any queries, please contact us.`,

  /** Sent when payment is successful. */
  payment_success: `✅ *RIAM Sports - Payment Received*

Thank you for your payment!

📋 *Booking Details:*
• Booking ID: {{bookingid}}
• Location: {{location}}
• Service: {{service}}
• Turf: {{turf}}
• Date: {{date}}
• Time: {{timeslots}}
• Amount Paid: ₹{{amountpaid}}
• Total: ₹{{totalamount}}

Your booking is confirmed. See you! 🎾`,

  /** Sent before booking (scheduled reminder; time is configurable per schedule). */
  booking_reminder: `⏰ *RIAM Sports - Booking Reminder*

This is a reminder for your upcoming booking:

📋 *Booking Details:*
• Booking ID: {{bookingid}}
• Location: {{location}}
• Service: {{service}}
• Turf: {{turf}}
• Date: {{date}}
• Time: {{timeslots}}

We look forward to seeing you! 🎾

For any changes or cancellations, please contact us.`,

  /** Payment reminder (pending payment). */
  payment_reminder: `💳 *RIAM Sports - Payment Reminder*

Your booking payment is pending:

📋 *Booking Details:*
• Booking ID: {{bookingid}}
• Date: {{date}}
• Location: {{location}}
• Amount Due: ₹{{amountdue}}

Please complete the payment to confirm your booking.

Pay now: {{paymenturl}}`,
} as const;

export type TemplateKey = keyof typeof NOTIFICATION_TEMPLATES;

export function getRenderedTemplate(
  key: TemplateKey,
  context: TemplateContext
): string {
  const template = NOTIFICATION_TEMPLATES[key];
  return renderTemplate(template, context);
}

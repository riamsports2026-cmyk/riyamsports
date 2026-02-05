/**
 * Dynamic message templates for WhatsApp notifications.
 * Placeholders: {{key}} replaced with values from context.
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
• Booking ID: {{booking_id}}
• Location: {{location}}
• Service: {{service}}
• Turf: {{turf}}
• Date: {{date}}
• Time: {{time_slots}}
• Amount: ₹{{total_amount}}

We look forward to seeing you! 🎾

For any queries, please contact us.`,

  /** Sent when payment is successful. */
  payment_success: `✅ *RIAM Sports - Payment Received*

Thank you for your payment!

📋 *Booking Details:*
• Booking ID: {{booking_id}}
• Location: {{location}}
• Service: {{service}}
• Turf: {{turf}}
• Date: {{date}}
• Time: {{time_slots}}
• Amount Paid: ₹{{amount_paid}}
• Total: ₹{{total_amount}}

Your booking is confirmed. See you! 🎾`,

  /** Sent 24 hours before booking (scheduled reminder). */
  booking_reminder: `⏰ *RIAM Sports - Booking Reminder*

This is a reminder for your upcoming booking:

📋 *Booking Details:*
• Booking ID: {{booking_id}}
• Location: {{location}}
• Service: {{service}}
• Turf: {{turf}}
• Date: {{date}}
• Time: {{time_slots}}

See you tomorrow! 🎾

For any changes or cancellations, please contact us.`,

  /** Payment reminder (pending payment). */
  payment_reminder: `💳 *RIAM Sports - Payment Reminder*

Your booking payment is pending:

📋 *Booking Details:*
• Booking ID: {{booking_id}}
• Date: {{date}}
• Location: {{location}}
• Amount Due: ₹{{amount_due}}

Please complete the payment to confirm your booking.

Pay now: {{payment_url}}`,
} as const;

export type TemplateKey = keyof typeof NOTIFICATION_TEMPLATES;

export function getRenderedTemplate(
  key: TemplateKey,
  context: TemplateContext
): string {
  const template = NOTIFICATION_TEMPLATES[key];
  return renderTemplate(template, context);
}

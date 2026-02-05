import { validateMobileNumber } from '@/lib/utils/phone';

export type AskEvaNotificationType =
  | 'booking_confirmation'
  | 'payment_success'
  | 'booking_reminder'
  | 'payment_reminder';

export interface WhatsAppMessage {
  to: string; // Phone number with country code (e.g., +919876543210)
  message: string;
  template?: string; // AskEva template name (for multi-param templates)
  variables?: Record<string, string>; // Template variables (optional _paramOrder for parameter order)
  /** AskEva template name for this notification type. Overrides ASKEVA_DEFAULT_MESSAGE_TEMPLATE when set. */
  askevaTemplateName?: string;
}

/**
 * WhatsApp via AskEva Consumer API only.
 * Uses template messages. For plain text, use ASKEVA_DEFAULT_MESSAGE_TEMPLATE
 * (one template with a single body variable – we pass the full message as that variable).
 */
export class WhatsAppService {
  /**
   * Send WhatsApp message via AskEva Consumer API.
   * Requires: ASKEVA_API_TOKEN; optional: ASKEVA_DEFAULT_MESSAGE_TEMPLATE
   * Docs: Dashboard → Settings → API Settings → Create New API Key. Token in query param.
   */
  static async sendViaAskEva(message: WhatsAppMessage): Promise<{ success: boolean; error?: string }> {
    const token = process.env.ASKEVA_API_TOKEN;
    if (!token) {
      return { success: false, error: 'AskEva API token not configured (ASKEVA_API_TOKEN)' };
    }

    const to = message.to.replace(/\D/g, ''); // digits only, no +
    const defaultTemplate =
      message.askevaTemplateName ||
      process.env.ASKEVA_DEFAULT_MESSAGE_TEMPLATE ||
      'postman_textvariable';

    let body: {
      to: string;
      type: 'template';
      template: {
        language: { policy: string; code: string };
        name: string;
        components?: Array<{
          type: string;
          parameters: Array<{ type: string; text?: string; image?: { link: string }; document?: { link: string; filename?: string }; video?: { link: string } }>;
        }>;
      };
    };

    if (message.template && message.variables && Object.keys(message.variables).length > 0) {
      const paramOrder = message.variables._paramOrder
        ? (message.variables._paramOrder as string).split(',').map((s) => s.trim())
        : Object.keys(message.variables).filter((k) => k !== '_paramOrder');
      const params = paramOrder.map((key) => ({
        type: 'text' as const,
        text: message.variables![key] ?? '',
      }));
      body = {
        to,
        type: 'template',
        template: {
          language: { policy: 'deterministic', code: 'en' },
          name: message.template,
          components: [{ type: 'body', parameters: params }],
        },
      };
    } else {
      body = {
        to,
        type: 'template',
        template: {
          language: { policy: 'deterministic', code: 'en' },
          name: defaultTemplate,
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: message.message }],
            },
          ],
        },
      };
    }

    try {
      const url = `https://backend.askeva.io/v1/message/send-message?token=${encodeURIComponent(token)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = (data as { message?: string })?.message ?? (data as { error?: string })?.error ?? response.statusText;
        return { success: false, error: errMsg || 'AskEva send failed' };
      }
      return { success: true };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : 'Failed to send WhatsApp message via AskEva';
      return { success: false, error: err };
    }
  }

  /**
   * Send WhatsApp message (AskEva only).
   * Validates and normalizes the recipient number before sending.
   */
  static async send(message: WhatsAppMessage): Promise<{ success: boolean; error?: string }> {
    const validation = validateMobileNumber(message.to, { normalize: true });
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Invalid mobile number' };
    }
    const normalizedMessage: WhatsAppMessage = {
      ...message,
      to: validation.normalized ?? message.to,
    };
    return this.sendViaAskEva(normalizedMessage);
  }

  /**
   * Get AskEva template name for a notification type.
   * Env: ASKEVA_TEMPLATE_BOOKING_CONFIRMATION, ASKEVA_TEMPLATE_PAYMENT_SUCCESS,
   * ASKEVA_TEMPLATE_BOOKING_REMINDER, ASKEVA_TEMPLATE_PAYMENT_REMINDER.
   * Falls back to ASKEVA_DEFAULT_MESSAGE_TEMPLATE, then postman_textvariable.
   */
  static getTemplateNameFor(type: AskEvaNotificationType): string {
    const envKey = `ASKEVA_TEMPLATE_${type.toUpperCase()}` as const;
    const value = process.env[envKey];
    if (value) return value;
    return process.env.ASKEVA_DEFAULT_MESSAGE_TEMPLATE || 'postman_textvariable';
  }

  /**
   * Format phone number to include country code
   */
  static formatPhoneNumber(phone: string, countryCode: string = '+91'): string {
    const cleaned = phone.replace(/[\s\+\-]/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    const withoutZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
    if (withoutZero.length === 10) {
      return `${countryCode}${withoutZero}`;
    }
    return phone.startsWith('+') ? phone : `${countryCode}${phone}`;
  }
}

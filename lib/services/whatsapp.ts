import { validateMobileNumber } from '@/lib/utils/phone';

export type AskEvaNotificationType =
  | 'booking_confirmation'
  | 'payment_success'
  | 'booking_reminder'
  | 'payment_reminder'
  | 'booking_cancellation'
  | 'welcome';

export interface WhatsAppMessage {
  to: string; // Phone number with country code (e.g., +919876543210)
  message: string;
  template?: string; // AskEva template name (for multi-param templates)
  variables?: Record<string, string>; // Template variables (optional _paramOrder for parameter order)
  /** AskEva template name for this notification type. Overrides ASKEVA_DEFAULT_MESSAGE_TEMPLATE when set. */
  askevaTemplateName?: string;
}

/** AskEva: allow only alphanumeric and underscore in template names (no special characters). */
function sanitizeAskEvaTemplateName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * WhatsApp API: param text cannot have newlines, tabs, or more than 4 consecutive spaces.
 * Also strip emojis/symbols for template variable safety.
 */
function sanitizeAskEvaMessageText(text: string): string {
  return text
    .replace(/\r\n|\r|\n/g, ' ') // newlines → space (API rejects new-line in param)
    .replace(/\t/g, ' ') // tabs → space (API rejects tab)
    .replace(/ {5,}/g, '    ') // more than 4 consecutive spaces → 4 spaces (API rule)
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width and BOM
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
    .replace(/\*/g, '') // asterisk (bold in WhatsApp) – remove
    .replace(/•/g, '- ') // bullet
    .replace(/₹/g, 'Rs ') // rupee
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F910}-\u{1F92F}\u{1F3C0}-\u{1F3FF}\u{1F400}-\u{1F4FF}]/gu, '') // emojis
    .trim();
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
      console.error('[WhatsApp] ASKEVA_API_TOKEN is not set. Set it in .env to send messages.');
      return { success: false, error: 'AskEva API token not configured (ASKEVA_API_TOKEN)' };
    }

    const to = message.to.replace(/\D/g, ''); // digits only, no +
    const rawTemplateName =
      message.askevaTemplateName ||
      process.env.ASKEVA_DEFAULT_MESSAGE_TEMPLATE ||
      'postman_textvariable';
    const defaultTemplate = sanitizeAskEvaTemplateName(rawTemplateName) || 'postman_textvariable';

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
        text: sanitizeAskEvaMessageText(String(message.variables![key] ?? '')),
      }));
      body = {
        to,
        type: 'template',
        template: {
          language: { policy: 'deterministic', code: 'en' },
          name: sanitizeAskEvaTemplateName(message.template),
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
              parameters: [{ type: 'text', text: sanitizeAskEvaMessageText(message.message) }],
            },
          ],
        },
      };
    }

    try {
      // WHATSAPP_API_URL: full endpoint (e.g. https://wpapi.propluslogics.com/v1/message/send-message) or base (e.g. https://wpapi.propluslogics.com/v1)
      const base = (process.env.WHATSAPP_API_URL ?? 'https://wpapi.propluslogics.com/v1').replace(/\/$/, '');
      const endpoint = base.includes('/message/') ? base : `${base}/message/send-message`;
      const url = `${endpoint}?token=${encodeURIComponent(token)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = (data as { message?: string })?.message ?? (data as { error?: string })?.error ?? response.statusText;
        console.error('[WhatsApp] API error', response.status, errMsg, data);
        return { success: false, error: errMsg || 'AskEva send failed' };
      }
      return { success: true };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : 'Failed to send WhatsApp message via AskEva';
      console.error('[WhatsApp] Send failed:', err);
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

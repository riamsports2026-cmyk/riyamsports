import { validateMobileNumber } from '@/lib/utils/phone';

export interface WhatsAppMessage {
  to: string; // Phone number with country code (e.g., +919876543210)
  message: string;
  template?: string; // Template name for WhatsApp Business API
  variables?: Record<string, string>; // Template variables
}

export class WhatsAppService {
  /**
   * Send WhatsApp message using Twilio
   * Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
   */
  static async sendViaTwilio(message: WhatsAppMessage): Promise<{ success: boolean; error?: string }> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // Format: whatsapp:+14155238886

    if (!accountSid || !authToken || !fromNumber) {
      return { success: false, error: 'Twilio credentials not configured' };
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            From: fromNumber,
            To: `whatsapp:${message.to}`,
            Body: message.message,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to send WhatsApp message' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to send WhatsApp message' };
    }
  }

  /**
   * Send WhatsApp message using WhatsApp Business API (Meta)
   * Requires: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
   */
  static async sendViaMeta(message: WhatsAppMessage): Promise<{ success: boolean; error?: string }> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      return { success: false, error: 'WhatsApp Business API credentials not configured' };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: message.to.replace('+', ''), // Remove + for Meta API
            type: 'text',
            text: {
              body: message.message,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message || 'Failed to send WhatsApp message' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to send WhatsApp message' };
    }
  }

  /**
   * Send WhatsApp message - automatically selects provider based on env config.
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
    const provider = process.env.WHATSAPP_PROVIDER || 'twilio';
    if (provider === 'meta') {
      return this.sendViaMeta(normalizedMessage);
    }
    return this.sendViaTwilio(normalizedMessage);
  }

  /**
   * Format phone number to include country code
   */
  static formatPhoneNumber(phone: string, countryCode: string = '+91'): string {
    // Remove any existing + or spaces
    const cleaned = phone.replace(/[\s\+\-]/g, '');
    
    // If already has country code, return with +
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    
    // If starts with 0, remove it
    const withoutZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
    
    // Add country code if not present
    if (withoutZero.length === 10) {
      return `${countryCode}${withoutZero}`;
    }
    
    return phone.startsWith('+') ? phone : `${countryCode}${phone}`;
  }
}






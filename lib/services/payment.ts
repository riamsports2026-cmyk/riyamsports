import { env } from '@/lib/env';
import Razorpay from 'razorpay';

export type PaymentGateway = 'razorpay' | 'payglobal';

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  checkoutUrl?: string;
}

export class PaymentService {
  private static activeGateway: PaymentGateway = 'razorpay';

  static setActiveGateway(gateway: PaymentGateway) {
    this.activeGateway = gateway;
  }

  static getActiveGateway(): PaymentGateway {
    return this.activeGateway;
  }

  static async createOrder(params: CreateOrderParams): Promise<PaymentOrder> {
    if (this.activeGateway === 'razorpay') {
      return this.createRazorpayOrder(params);
    } else {
      return this.createPayGlobalOrder(params);
    }
  }

  private static async createRazorpayOrder(
    params: CreateOrderParams
  ): Promise<PaymentOrder> {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    const razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: params.amount * 100,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes,
    });

    return {
      id: order.id,
      amount: Number(order.amount) / 100,
      currency: order.currency,
      receipt: order.receipt,
    };
  }

  private static async createPayGlobalOrder(
    params: CreateOrderParams
  ): Promise<PaymentOrder> {
    if (!env.PAYGLOBAL_MERCHANT_ID || !env.PAYGLOBAL_API_KEY) {
      throw new Error('PayGlocal credentials not configured');
    }

    const baseUrl = env.PAYGLOBAL_BASE_URL || 'https://api.payglocal.in';
    const response = await fetch(`${baseUrl}/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MERCHANT-ID': env.PAYGLOBAL_MERCHANT_ID,
        'X-API-KEY': env.PAYGLOBAL_API_KEY,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create PayGlocal order');
    }

    const data = await response.json();

    return {
      id: data.order_id,
      amount: params.amount,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      checkoutUrl: data.checkout_url,
    };
  }

  static async verifyWebhook(
    gateway: PaymentGateway,
    payload: string | Record<string, unknown>,
    signature: string
  ): Promise<boolean> {
    if (gateway === 'razorpay') {
      return this.verifyRazorpayWebhook(payload, signature);
    } else {
      return this.verifyPayGlobalWebhook(payload, signature);
    }
  }

  private static async verifyRazorpayWebhook(
    payload: string | Record<string, unknown>,
    signature: string
  ): Promise<boolean> {
    if (!env.RAZORPAY_KEY_SECRET) {
      return false;
    }

    const crypto = await import('crypto');
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  private static async verifyPayGlobalWebhook(
    payload: string | Record<string, unknown>,
    signature: string
  ): Promise<boolean> {
    if (!env.PAYGLOBAL_WEBHOOK_SECRET) {
      return false;
    }

    const crypto = await import('crypto');
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', env.PAYGLOBAL_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /** Fetch Razorpay order payments and return captured payment id if any. */
  static async getRazorpayOrderPaymentStatus(
    orderId: string
  ): Promise<{ captured: boolean; paymentId?: string }> {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      return { captured: false };
    }
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
    const res = await razorpay.orders.fetchPayments(orderId);
    const items = (res as { items?: Array<{ id: string; status: string }> }).items ?? [];
    const captured = items.find((p) => p.status === 'captured');
    return captured
      ? { captured: true, paymentId: captured.id }
      : { captured: false };
  }
}


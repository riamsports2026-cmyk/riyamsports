'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { PaymentService } from '@/lib/services/payment';
import { BookingReminderService } from '@/lib/services/booking-reminders';
import { getPaymentGatewaySettingsPublic } from './payment-gateways-public';
import type { Booking } from '@/lib/types';
import type { Database } from '@/lib/types/database';

type BookingUpdate = Database['public']['Tables']['bookings']['Update'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];

export async function createPaymentOrder(
  bookingId: string,
  gateway: 'razorpay' | 'payglobal'
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in' };
  }

  const serviceClient = await createServiceClient();

  const { data, error: bookingError } = await serviceClient
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single();

  if (bookingError || !data) {
    return { error: 'Booking not found' };
  }

  const booking = data as Booking;

  if (booking.payment_status === 'paid') {
    return { error: 'Booking is already paid' };
  }

  const gatewaySettings = await getPaymentGatewaySettingsPublic();

  if (gateway === 'razorpay' && !gatewaySettings.razorpay_enabled) {
    return { error: 'Razorpay is not enabled' };
  }
  if (gateway === 'payglobal' && !gatewaySettings.payglobal_enabled) {
    return { error: 'PayGlocal is not enabled' };
  }

  PaymentService.setActiveGateway(gateway);

  try {
    const order = await PaymentService.createOrder({
      amount: booking.advance_amount,
      currency: 'INR',
      receipt: booking.booking_id,
      notes: {
        booking_id: booking.id,
        user_id: user.id,
      },
    });

    const updatePayload: BookingUpdate = {
      payment_gateway: gateway,
      payment_gateway_order_id: order.id,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase typings infer 'never' for bookings update
    await (serviceClient.from('bookings') as any).update(updatePayload).eq('id', bookingId);

    // Create payment row so webhook / verify-on-return can find it
    if (gateway === 'razorpay') {
      const paymentRow: PaymentInsert = {
        booking_id: bookingId,
        amount: Number(booking.advance_amount),
        payment_type: 'advance',
        payment_gateway: 'razorpay',
        gateway_order_id: order.id,
        payment_method: 'online',
        status: 'pending',
      };
      await serviceClient.from('payments').insert(paymentRow);
    }

    return { orderId: order.id };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : 'Failed to create payment order',
    };
  }
}

/** Verify Razorpay payment on return (when webhook may not have run, e.g. localhost). Idempotent. */
export async function verifyRazorpayPaymentOnReturn(bookingId: string): Promise<
  | { ok: true; alreadyConfirmed?: boolean }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Not authenticated' };
  }

  const serviceClient = await createServiceClient();
  const { data: booking, error: bookErr } = await serviceClient
    .from('bookings')
    .select('id, payment_gateway, payment_gateway_order_id, user_id')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single();

  if (bookErr || !booking) {
    return { ok: false, error: 'Booking not found' };
  }
  if (booking.payment_gateway !== 'razorpay' || !booking.payment_gateway_order_id) {
    return { ok: false, error: 'Not a Razorpay booking' };
  }

  const orderId = booking.payment_gateway_order_id;
  const status = await PaymentService.getRazorpayOrderPaymentStatus(orderId);
  if (!status.captured || !status.paymentId) {
    return { ok: false, error: 'Payment not captured yet' };
  }

  // Find or create payment row (idempotent)
  let { data: payRow } = await serviceClient
    .from('payments')
    .select('id, booking_id, amount, status')
    .eq('gateway_order_id', orderId)
    .single();

  if (!payRow) {
    const { data: bookRow } = await serviceClient
      .from('bookings')
      .select('advance_amount')
      .eq('id', bookingId)
      .single();
    const amount = (bookRow as { advance_amount?: number } | null)?.advance_amount ?? 0;
    const insert: PaymentInsert = {
      booking_id: bookingId,
      amount: Number(amount),
      payment_type: 'advance',
      payment_gateway: 'razorpay',
      gateway_order_id: orderId,
      gateway_payment_id: status.paymentId,
      payment_method: 'online',
      status: 'success',
    };
    const { data: inserted } = await serviceClient.from('payments').insert(insert).select('id, booking_id, amount').single();
    payRow = inserted;
  }

  const payment = payRow as { id: string; booking_id: string; amount: number; status: string };
  if (payment.status === 'success') {
    return { ok: true, alreadyConfirmed: true };
  }

  // Same logic as webhook: update payment and booking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient.from('payments') as any)
    .update({
      gateway_payment_id: status.paymentId,
      status: 'success',
      updated_at: new Date().toISOString(),
    })
    .eq('gateway_order_id', orderId);

  const { data: bookRow } = await serviceClient
    .from('bookings')
    .select('total_amount, advance_amount, received_amount, payment_status')
    .eq('id', payment.booking_id)
    .single();
  const book = bookRow as { total_amount: number; advance_amount?: number; received_amount?: number } | null;
  if (book) {
    const paymentAmount = Number(payment.amount || book.advance_amount);
    const currentReceived = Number(book.received_amount || 0);
    const newReceived = currentReceived + paymentAmount;
    const isPaid = newReceived >= book.total_amount;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceClient.from('bookings') as any)
      .update({
        received_amount: newReceived,
        payment_status: isPaid ? 'paid' : 'partial',
        booking_status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.booking_id);
    await BookingReminderService.sendPaymentSuccessByBookingId(payment.booking_id, paymentAmount);
  }

  return { ok: true };
}






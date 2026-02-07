'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { PaymentService } from '@/lib/services/payment';
import { getPaymentGatewaySettingsPublic } from './payment-gateways-public';
import type { Booking } from '@/lib/types';
import type { Database } from '@/lib/types/database';

type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

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

    return { orderId: order.id };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : 'Failed to create payment order',
    };
  }
}






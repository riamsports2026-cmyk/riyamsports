import { createServiceClient } from '@/lib/supabase/server';
import { PaymentService } from '@/lib/services/payment';
import { BookingReminderService } from '@/lib/services/booking-reminders';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headersList = await headers();
    const razorpaySig = headersList.get('x-razorpay-signature') || '';
    const payglocalSig = headersList.get('x-payglocal-signature') || '';
    const gatewayHeader = (headersList.get('x-payment-gateway') || '').toLowerCase();
    const gateway = (gatewayHeader === 'payglobal' ? 'payglobal' : 'razorpay') as
      | 'razorpay'
      | 'payglobal';
    const signature = gateway === 'payglobal' ? payglocalSig : razorpaySig;

    const isValid = await PaymentService.verifyWebhook(gateway, body, signature);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    if (gateway === 'razorpay') {
      const entity = body.payload?.payment?.entity || body;
      const order_id = entity.order_id;
      const payment_id = entity.id ?? entity.payment_id; // Razorpay uses "id" for payment id
      const status = entity.status;

      if (status === 'captured') {
        const { data: payRow } = await supabase
          .from('payments')
          .select('booking_id, amount')
          .eq('gateway_order_id', order_id)
          .single();
        const payment = payRow as { booking_id: string; amount: number } | null;

        if (payment) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('payments') as any)
            .update({
              gateway_payment_id: payment_id,
              status: 'success',
              updated_at: new Date().toISOString(),
            })
            .eq('gateway_order_id', order_id);

          const { data: bookRow } = await supabase
            .from('bookings')
            .select('total_amount, advance_amount, received_amount, payment_status')
            .eq('id', payment.booking_id)
            .single();
          const booking = bookRow as { total_amount: number; advance_amount?: number; received_amount?: number } | null;

          if (booking) {
            const paymentAmount = Number(payment.amount || booking.advance_amount);
            const currentReceived = Number(booking.received_amount || 0);
            const newReceived = currentReceived + paymentAmount;
            const isPaid = newReceived >= booking.total_amount;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('bookings') as any)
              .update({
                received_amount: newReceived,
                payment_status: isPaid ? 'paid' : 'partial',
                booking_status: 'confirmed',
                updated_at: new Date().toISOString(),
              })
              .eq('id', payment.booking_id);
            // WhatsApp payment success + booking confirmation
            await BookingReminderService.sendPaymentSuccessByBookingId(
              payment.booking_id,
              paymentAmount
            );
            await BookingReminderService.sendConfirmationByBookingId(payment.booking_id);
          }
        }
      }
    } else if (gateway === 'payglobal') {
      const { order_id, payment_id, status } = body;

      if (status === 'SUCCESS') {
        const { data: payRow } = await supabase
          .from('payments')
          .select('booking_id, amount')
          .eq('gateway_order_id', order_id)
          .single();
        const payment = payRow as { booking_id: string; amount: number } | null;

        if (payment) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('payments') as any)
            .update({
              gateway_payment_id: payment_id,
              status: 'success',
              updated_at: new Date().toISOString(),
            })
            .eq('gateway_order_id', order_id);

          const { data: bookRow } = await supabase
            .from('bookings')
            .select('total_amount, advance_amount, received_amount, payment_status')
            .eq('id', payment.booking_id)
            .single();
          const booking = bookRow as { total_amount: number; advance_amount?: number; received_amount?: number } | null;

          if (booking) {
            const paymentAmount = Number(payment.amount || booking.advance_amount);
            const currentReceived = Number(booking.received_amount || 0);
            const newReceived = currentReceived + paymentAmount;
            const isPaid = newReceived >= booking.total_amount;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('bookings') as any)
              .update({
                received_amount: newReceived,
                payment_status: isPaid ? 'paid' : 'partial',
                booking_status: 'confirmed',
                updated_at: new Date().toISOString(),
              })
              .eq('id', payment.booking_id);
// WhatsApp payment success + booking confirmation
            await BookingReminderService.sendPaymentSuccessByBookingId(
              payment.booking_id,
              paymentAmount
            );
            await BookingReminderService.sendConfirmationByBookingId(payment.booking_id);
          }
        }
    }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}


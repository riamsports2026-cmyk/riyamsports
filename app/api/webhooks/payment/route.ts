import { createServiceClient } from '@/lib/supabase/server';
import { PaymentService } from '@/lib/services/payment';
import { BookingReminderService } from '@/lib/services/booking-reminders';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Razorpay signs the raw body – we must verify with the exact string, not JSON.stringify(parsed)
    const rawBody = await request.text();
    const headersList = await headers();
    const razorpaySig = headersList.get('x-razorpay-signature') || '';
    const payglocalSig = headersList.get('x-payglocal-signature') || '';
    const gatewayHeader = (headersList.get('x-payment-gateway') || '').toLowerCase();
    const gateway = (gatewayHeader === 'payglobal' ? 'payglobal' : 'razorpay') as
      | 'razorpay'
      | 'payglobal';
    const signature = gateway === 'payglobal' ? payglocalSig : razorpaySig;

    const isValid = await PaymentService.verifyWebhook(
      gateway,
      rawBody as string,
      signature
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let body: Record<string, unknown> = {};
    try {
      body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    if (gateway === 'razorpay') {
      const event = body.event as string | undefined;
      const payload = body.payload as {
        payment?: { entity?: { order_id?: string; id?: string; payment_id?: string; status?: string } };
        order?: { entity?: { id?: string } };
      } | undefined;
      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;
      const entity = paymentEntity ?? (body as { order_id?: string; id?: string; payment_id?: string; status?: string });
      const order_id = entity?.order_id ?? orderEntity?.id;
      const payment_id = entity?.id ?? (entity as { payment_id?: string })?.payment_id;
      const status = entity?.status;

      // Process payment.captured (status === 'captured') or order.paid (event === 'order.paid')
      const shouldProcess = order_id && (status === 'captured' || event === 'order.paid');
      if (shouldProcess) {
        const { data: payRow } = await supabase
          .from('payments')
          .select('booking_id, amount, status')
          .eq('gateway_order_id', order_id)
          .single();
        const payment = payRow as { booking_id: string; amount: number; status?: string } | null;

        // Idempotent: skip if we already processed this payment (e.g. Razorpay retry)
        if (payment?.status === 'success') {
          return NextResponse.json({ received: true });
        }

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
            // Run WhatsApp notifications in background so we can return 200 quickly (avoid 499 timeout)
            const bookingId = payment.booking_id;
            void BookingReminderService.sendPaymentSuccessByBookingId(bookingId, paymentAmount)
              .catch((e) => console.error('[webhook] sendPaymentSuccessByBookingId failed:', e));
            void BookingReminderService.sendConfirmationByBookingId(bookingId)
              .catch((e) => console.error('[webhook] sendConfirmationByBookingId failed:', e));
          }
        }
      }
    } else if (gateway === 'payglobal') {
      const order_id = body.order_id as string | undefined;
      const payment_id = body.payment_id as string | undefined;
      const status = body.status as string | undefined;

      if (status === 'SUCCESS' && order_id) {
        const { data: payRow } = await supabase
          .from('payments')
          .select('booking_id, amount, status')
          .eq('gateway_order_id', order_id)
          .single();
        const payment = payRow as { booking_id: string; amount: number; status?: string } | null;

        // Idempotent: skip if we already processed this payment (e.g. gateway retry)
        if (payment?.status === 'success') {
          return NextResponse.json({ received: true });
        }

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
            // Run WhatsApp notifications in background so we can return 200 quickly (avoid 499 timeout)
            const bookingId = payment.booking_id;
            void BookingReminderService.sendPaymentSuccessByBookingId(bookingId, paymentAmount)
              .catch((e) => console.error('[webhook] sendPaymentSuccessByBookingId failed:', e));
            void BookingReminderService.sendConfirmationByBookingId(bookingId)
              .catch((e) => console.error('[webhook] sendConfirmationByBookingId failed:', e));
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


import { getBooking } from '@/lib/actions/bookings';
import { getPaymentGatewaySettingsPublic } from '@/lib/actions/payment-gateways-public';
import { createPaymentOrder } from '@/lib/actions/payments';
import { notFound } from 'next/navigation';
import { PaymentPageClient } from '@/components/payment-page-client';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Payment - Booking ${id} | RIAM Sports`,
  };
}

export default async function PaymentPage({ params }: PageProps) {
  const { id } = await params;
  const booking = await getBooking(id);

  if (!booking) {
    notFound();
  }

  // Check if booking is already paid
  if (booking.payment_status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Already Completed</h1>
            <p className="text-gray-600 mb-6">This booking has already been paid.</p>
            <a
              href={`/bookings/${id}`}
              className="inline-block px-4 py-2 text-white rounded-md bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] cursor-pointer shadow-lg hover:shadow-xl transition-all"
            >
              View Booking Details
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Get payment gateway settings (public access for payment page)
  const gatewaySettings = await getPaymentGatewaySettingsPublic();

  // Calculate payment amount based on payment type
  const paymentAmount = booking.advance_amount;

  return (
    <PaymentPageClient
      booking={booking}
      paymentAmount={paymentAmount}
      gatewaySettings={gatewaySettings}
      createPaymentOrder={createPaymentOrder}
    />
  );
}


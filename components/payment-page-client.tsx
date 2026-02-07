'use client';

import { BookingWithDetails } from '@/lib/types';
import { useState } from 'react';
import Script from 'next/script';

interface PaymentPageClientProps {
  booking: BookingWithDetails;
  paymentAmount: number;
  gatewaySettings: {
    razorpay_enabled: boolean;
    payglobal_enabled: boolean;
    active_gateway: 'razorpay' | 'payglobal';
  } | null;
  createPaymentOrder: (bookingId: string, gateway: 'razorpay' | 'payglobal') => Promise<{ orderId?: string; error?: string }>;
}

export function PaymentPageClient({
  booking,
  paymentAmount,
  gatewaySettings,
  createPaymentOrder,
}: PaymentPageClientProps) {
  // Customers only see the active gateway - no selection needed
  const activeGateway = gatewaySettings?.active_gateway || 'razorpay';
  const [processing, setProcessing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if the active gateway is enabled
  const isActiveGatewayEnabled = 
    (activeGateway === 'razorpay' && gatewaySettings?.razorpay_enabled) ||
    (activeGateway === 'payglobal' && gatewaySettings?.payglobal_enabled);

  if (!gatewaySettings || !isActiveGatewayEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Unavailable</h1>
            <p className="text-gray-600">No payment gateway is currently available. Please contact support.</p>
          </div>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      const result = await createPaymentOrder(booking.id, activeGateway);
      
      if (result.error) {
        setError(result.error);
        setProcessing(false);
        return;
      }

      if (activeGateway === 'razorpay' && result.orderId) {
        // Get Razorpay key from API
        const keyResponse = await fetch('/api/payment/razorpay-key');
        const keyData = await keyResponse.json();
        
        if (!keyData.key) {
          setError('Razorpay key not configured');
          setProcessing(false);
          return;
        }

        // Initialize Razorpay payment
        const options = {
          key: keyData.key,
          amount: paymentAmount * 100, // Amount in paise
          currency: 'INR',
          name: 'RIAM Sports',
          description: `Booking ${booking.booking_id}`,
          order_id: result.orderId,
          handler: function (response: any) {
            // Show "Redirecting..." immediately so user never sees the payment form again, then redirect
            setRedirecting(true);
            setError(null);
            setTimeout(() => {
              window.location.href = `/bookings/${booking.id}?payment=success`;
            }, 150);
          },
          prefill: {
            name: booking.turf?.location?.name || '',
          },
          theme: {
            color: '#FF6B35',
          },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.on('payment.failed', function (response: any) {
          setError('Payment failed. Please try again.');
          setProcessing(false);
        });
        razorpay.open();
        setProcessing(false);
      } else if (activeGateway === 'payglobal' && result.orderId) {
        // For PayGlocal, redirect to checkout URL
        // This would be handled by the API response
        setError('PayGlocal integration pending');
        setProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Payment successful</h2>
          <p className="text-gray-600 mb-6">Redirecting you to your booking...</p>
          <div className="flex justify-center">
            <svg className="animate-spin h-8 w-8 text-[#FF6B35]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Payment</h1>

            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Booking Details</h2>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Booking ID:</span> {booking.booking_id}</p>
                  <p><span className="font-medium">Location:</span> {booking.turf?.location?.name}</p>
                  <p><span className="font-medium">Service:</span> {booking.turf?.service?.name}</p>
                  <p><span className="font-medium">Date:</span> {new Date(booking.booking_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Amount to Pay:</span>
                  <span className="text-2xl font-bold text-gray-900">₹{paymentAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Show active payment gateway info */}
              <div className="bg-linear-to-r from-[#FF6B35]/10 to-[#1E3A5F]/10 border border-[#FF6B35]/30 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <svg className="h-5 w-5 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-[#1E3A5F]">
                      Payment Gateway: {activeGateway === 'razorpay' ? 'Razorpay' : 'PayGlocal'}
                    </p>
                    <p className="text-xs text-[#FF6B35] mt-1">Secure payment processing</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {processing ? 'Processing...' : `Pay ₹${paymentAmount.toLocaleString()}`}
              </button>

              {/* <a
                href={`/bookings/${booking.id}`}
                className="block text-center text-sm text-gray-600 hover:text-gray-900"
              >
                Skip payment for now
              </a> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


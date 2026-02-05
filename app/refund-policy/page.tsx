import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund and cancellation policy for RIAM Sports turf bookings.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg border border-[#1E3A5F]/10 p-6 sm:p-8 md:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-2">
            Refund Policy
          </h1>
          <p className="text-sm text-gray-500 mb-8">RIAM Sports Academy</p>

          <div className="prose prose-[#1E3A5F] max-w-none space-y-6 text-gray-700 text-sm sm:text-base">
            <p>
              At RIAM Sports Academy, we strive to provide a smooth and transparent booking experience for all our customers. Please read our refund policy carefully before making a booking.
            </p>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Booking & Payment</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Users can book turf slots online through our website.</li>
                <li>Payments can be made either as 30% partial advance, or 100% full payment at the time of booking.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Non-Refundable Policy</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All bookings made with RIAM Sports Academy are strictly non-refundable.</li>
                <li>Once a booking is confirmed, the slot is reserved exclusively for the user and cannot be modified, rescheduled, or transferred.</li>
                <li>Due to the nature of turf scheduling and time-slot allocation, we are unable to accommodate changes or cancellations after confirmation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Cancellation & No-Show</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>If a user cancels the booking for any reason, including personal emergencies, weather conditions, or non-usage of the slot, no refund will be issued.</li>
                <li>Failure to arrive or use the booked slot (no-show) will also be treated as a completed booking with no refund eligibility.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Advance Payments</h2>
              <p>
                Any advance amount paid (including the 30% partial payment) is considered a booking confirmation fee and is non-refundable under all circumstances.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Exceptional Situations</h2>
              <p>
                In rare cases where the turf is unavailable due to technical issues or management-related closures from our side, RIAM Sports Academy may, at its sole discretion, offer slot rescheduling or a credit for future bookings. No cash refunds will be provided even in such cases.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Acceptance of Policy</h2>
              <p>
                By proceeding with a booking on our website, you acknowledge that you have read, understood, and agreed to this Refund Policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Contact Us</h2>
              <p>For any queries related to bookings or payments, please contact us at:</p>
              <p className="mt-2 font-semibold text-[#1E3A5F]">RIAM Sports Academy</p>
              <p className="mt-2">
                Email: <a href="mailto:Info@riamsportsarena.com" className="text-[#FF6B35] hover:underline">Info@riamsportsarena.com</a>
              </p>
              <p>Phone: <a href="tel:+917667954033" className="text-[#FF6B35] hover:underline">+91 76679 54033</a></p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
            <Link href="/terms" className="text-[#FF6B35] hover:underline font-medium">Terms & Conditions</Link>
            <Link href="/privacy" className="text-[#FF6B35] hover:underline font-medium">Privacy Policy</Link>
            <Link href="/book" className="text-[#1E3A5F] hover:underline font-medium">← Back to Book</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for using RIAM Sports turf booking and academy services.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg border border-[#1E3A5F]/10 p-6 sm:p-8 md:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-2">
            Terms & Conditions
          </h1>
          <p className="text-sm text-gray-500 mb-8">RIAM Sports / RIAMS Academy</p>

          <div className="prose prose-[#1E3A5F] max-w-none space-y-6 text-gray-700 text-sm sm:text-base">
            <p>
              Welcome to RIAM Sports. By accessing our website, enrolling in our academy, or booking our turf facilities, you agree to comply with and be bound by the following Terms & Conditions. Please read them carefully before proceeding.
            </p>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">About Us</h2>
              <p>
                RIAMS Academy was established in 2018 in Coimbatore, Tamil Nadu. We provide professional soccer training and fitness programs for kids, boys, girls, and adults, along with turf facilities for sports activities and matches.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Acceptance of Terms</h2>
              <p>
                By using our website, booking turf slots, or enrolling in training programs, you confirm that you have read, understood, and agreed to these Terms & Conditions. If you do not agree, please refrain from using our services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Turf Booking & Usage</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Turf slots can be booked online through our website.</li>
                <li>Bookings are subject to availability and confirmation.</li>
                <li>Once confirmed, booked slots cannot be modified, rescheduled, or transferred.</li>
                <li>Users must arrive on time. Late arrivals will not be compensated with extra playtime.</li>
                <li>The management reserves the right to refuse entry or usage if rules are violated.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Payments</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payments can be made either as 30% partial advance or 100% full payment at the time of booking.</li>
                <li>All payments made are non-refundable, as mentioned in our Refund Policy.</li>
                <li>Prices are subject to change without prior notice.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Coaching & Training Programs</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Training programs are designed according to age and skill level.</li>
                <li>Enrollment fees, once paid, are non-refundable and non-transferable.</li>
                <li>RIAMS Academy reserves the right to modify training schedules, coaching staff, or batch timings when required.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Code of Conduct</h2>
              <p className="mb-2">All players, students, and visitors must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain discipline and sportsmanship at all times</li>
                <li>Respect coaches, staff, fellow players, and facilities</li>
                <li>Avoid abusive language, aggressive behavior, or misconduct</li>
              </ul>
              <p className="mt-3">Failure to comply may result in suspension or permanent removal without any refund.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Health & Safety</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Participants are responsible for ensuring they are medically fit to play or train.</li>
                <li>RIAM Sports is not responsible for injuries, accidents, or health issues occurring during training or turf usage.</li>
                <li>Parents/guardians must ensure accurate health information is provided for minors.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Liability Disclaimer</h2>
              <p className="mb-2">RIAMS Academy and RIAM Sports shall not be held liable for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personal injuries or loss of property</li>
                <li>Accidents during training sessions or turf play</li>
                <li>Losses due to misuse of facilities or equipment</li>
              </ul>
              <p className="mt-3">Users participate at their own risk.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Weather & Force Majeure</h2>
              <p>
                Activities may be paused or rescheduled due to weather conditions, maintenance, or unforeseen circumstances. No refunds will be issued for disruptions caused by natural events or force majeure situations.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Intellectual Property</h2>
              <p>
                All website content, logos, images, videos, and branding belong to RIAMS Academy. Unauthorized copying, reproduction, or commercial use is strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Termination of Access</h2>
              <p className="mb-2">RIAM Sports reserves the right to suspend or terminate access to services without notice if:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Terms are violated</li>
                <li>False information is provided</li>
                <li>Misuse of facilities is identified</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Changes to Terms</h2>
              <p>
                RIAMS Academy reserves the right to update or modify these Terms & Conditions at any time. Continued use of our services implies acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Governing Law</h2>
              <p>
                These Terms & Conditions shall be governed and interpreted in accordance with the laws of India, with jurisdiction limited to Coimbatore, Tamil Nadu.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Contact Information</h2>
              <p>For any questions regarding these Terms & Conditions, please contact:</p>
              <p className="mt-2 font-semibold text-[#1E3A5F]">RIAM Sports / RIAMS Academy</p>
              <p>Coimbatore, Tamil Nadu</p>
              <p className="mt-2">
                Email: <a href="mailto:Info@riamsportsarena.com" className="text-[#FF6B35] hover:underline">Info@riamsportsarena.com</a>
              </p>
              <p>Phone: <a href="tel:+917667954033" className="text-[#FF6B35] hover:underline">+91 76679 54033</a></p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
            <Link href="/privacy" className="text-[#FF6B35] hover:underline font-medium">Privacy Policy</Link>
            <Link href="/refund-policy" className="text-[#FF6B35] hover:underline font-medium">Refund Policy</Link>
            <Link href="/book" className="text-[#1E3A5F] hover:underline font-medium">← Back to Book</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

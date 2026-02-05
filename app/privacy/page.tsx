import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How RIAM Sports collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg border border-[#1E3A5F]/10 p-6 sm:p-8 md:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 mb-8">RIAM Sports / RIAMS Academy</p>

          <div className="prose prose-[#1E3A5F] max-w-none space-y-6 text-gray-700 text-sm sm:text-base">
            <p>
              At RIAM Sports, we value your trust and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and safeguard your data when you use our website, book turf slots, or enroll in our academy programs.
            </p>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Information We Collect</h2>
              <p className="mb-2">We may collect the following types of information:</p>
              <h3 className="font-semibold text-[#1E3A5F] mt-4 mb-2">Personal Information</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name</li>
                <li>Phone number</li>
                <li>Email address</li>
                <li>Age and gender (for training programs)</li>
                <li>Parent/guardian details for minors</li>
              </ul>
              <h3 className="font-semibold text-[#1E3A5F] mt-4 mb-2">Booking & Payment Information</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Booking details (date, time, sport type)</li>
                <li>Payment status (we do not store card or UPI details)</li>
              </ul>
              <h3 className="font-semibold text-[#1E3A5F] mt-4 mb-2">Technical Information</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>IP address</li>
                <li>Browser type</li>
                <li>Device information</li>
                <li>Website usage data (cookies, analytics)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">How We Use Your Information</h2>
              <p>The information we collect is used to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Process turf bookings and academy enrollments</li>
                <li>Confirm payments and booking status</li>
                <li>Communicate important updates, schedule changes, or announcements</li>
                <li>Improve our website, services, and user experience</li>
                <li>Maintain internal records and legal compliance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Data Sharing & Disclosure</h2>
              <p>RIAM Sports does not sell, rent, or trade your personal information.</p>
              <p className="mt-2">We may share information only with:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Trusted service providers (payment gateways, SMS/email service providers)</li>
                <li>Legal or regulatory authorities when required by law</li>
              </ul>
              <p className="mt-2">All third parties are required to maintain confidentiality and data security.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Data Security</h2>
              <p>We implement appropriate technical and organizational security measures to protect your data from unauthorized access, alteration or disclosure, and loss or misuse. However, no method of data transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Cookies & Tracking Technologies</h2>
              <p>Our website may use cookies to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Enhance user experience</li>
                <li>Analyze website traffic</li>
                <li>Remember user preferences</li>
              </ul>
              <p className="mt-2">You may disable cookies through your browser settings, though some features of the website may not function properly.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Children&apos;s Privacy</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We collect information related to minors only with the consent of parents or guardians.</li>
                <li>Such information is used strictly for training, safety, and communication purposes.</li>
                <li>We do not knowingly collect personal data from children without parental consent.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Data Retention</h2>
              <p>We retain personal information only for as long as necessary to fulfill booking and training purposes and to meet legal, regulatory, or operational requirements. Once data is no longer required, it is securely deleted or anonymized.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal obligations)</li>
              </ul>
              <p className="mt-2">Requests can be made by contacting us using the details below.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Third-Party Links</h2>
              <p>Our website may contain links to third-party websites. RIAM Sports is not responsible for the privacy practices or content of such external sites.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Changes to This Privacy Policy</h2>
              <p>We reserve the right to update or modify this Privacy Policy at any time. Changes will be effective immediately upon posting on the website. Continued use of our services indicates acceptance of the updated policy.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Governing Law</h2>
              <p>This Privacy Policy shall be governed by the laws of India, with jurisdiction in Coimbatore, Tamil Nadu.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1E3A5F] mt-8 mb-3">Contact Us</h2>
              <p>If you have any questions or concerns regarding this Privacy Policy or data handling practices, please contact:</p>
              <p className="mt-2">Coimbatore, Tamil Nadu</p>
              <p className="mt-2">
                Email: <a href="mailto:Info@riamsportsarena.com" className="text-[#FF6B35] hover:underline">Info@riamsportsarena.com</a>
              </p>
              <p>Phone: <a href="tel:+917667954033" className="text-[#FF6B35] hover:underline">+91 76679 54033</a></p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
            <Link href="/terms" className="text-[#FF6B35] hover:underline font-medium">Terms & Conditions</Link>
            <Link href="/refund-policy" className="text-[#FF6B35] hover:underline font-medium">Refund Policy</Link>
            <Link href="/book" className="text-[#1E3A5F] hover:underline font-medium">← Back to Book</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

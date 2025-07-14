export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using Margarita's Cleaning Services ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                Margarita's Cleaning Services provides professional cleaning services for residential and commercial properties. Services include but are not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Regular house cleaning</li>
                <li>Deep cleaning services</li>
                <li>Move-in/move-out cleaning</li>
                <li>Office and commercial cleaning</li>
                <li>Airbnb cleaning services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Booking and Payment</h2>
              <p className="text-gray-700 mb-4">
                All bookings must be made through our platform. Payment is required at the time of booking. We accept major credit cards and PayPal.
              </p>
              <p className="text-gray-700 mb-4">
                Cancellations must be made at least 24 hours in advance for a full refund. Cancellations made less than 24 hours before the scheduled service may be subject to a cancellation fee.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Service Quality</h2>
              <p className="text-gray-700 mb-4">
                We strive to provide high-quality cleaning services. If you are not satisfied with our service, please contact us within 24 hours of service completion, and we will work to resolve any issues.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Liability</h2>
              <p className="text-gray-700 mb-4">
                Margarita's Cleaning Services is fully insured and bonded. We are liable for damages caused by our negligence during the provision of services. However, we are not responsible for pre-existing damage or items of extraordinary value not disclosed prior to service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="text-gray-700">
                <p>Email: info@margaritascleaning.com</p>
                <p>Phone: +1-956-XXX-XXXX</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

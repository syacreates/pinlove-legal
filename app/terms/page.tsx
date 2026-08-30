import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | PinLove',
}

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-neutral-800 legal-content">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-neutral-500 mb-8">Last updated: March 19, 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold mb-2">1. Acceptance</h2>
          <p>By using PinLove you agree to these Terms. If you do not agree, do not use the service.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. Description of service</h2>
          <p>PinLove is a web application that allows registered users to save, organize, and share real-world places. Users may import place suggestions by submitting public TikTok or Instagram video URLs.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. Acceptable use</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You may only submit URLs of public videos for which you have the right to request metadata.</li>
            <li>You may not use PinLove to scrape, collect, or redistribute TikTok content in bulk.</li>
            <li>You may not use PinLove for any illegal purpose or in violation of TikTok's Terms of Service.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. User content</h2>
          <p>You retain ownership of the places and notes you save. You grant PinLove a limited license to store and display this content to provide the service.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. Free and premium plans</h2>
          <p>The free plan is limited to {'{FREE_PLAN_LIMIT}'} saved places. Premium access is available as a one-time purchase. Purchases are final and non-refundable except where required by law.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">6. Disclaimer</h2>
          <p>PinLove is provided "as is" without warranty of any kind. We are not responsible for the accuracy of place information extracted from third-party content.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">7. Changes</h2>
          <p>We may update these Terms at any time. Continued use of the service constitutes acceptance of the updated Terms.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">8. Contact</h2>
          <p><a href="mailto:contact@pinlove.app" className="text-brand-500 underline">contact@pinlove.app</a></p>
        </div>
      </section>
    </main>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | PinLove',
}

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-neutral-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-neutral-500 mb-8">Last updated: March 19, 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold mb-2">1. Who we are</h2>
          <p>PinLove ("we", "our", "us") is a web application that helps users save and organize real-world places discovered on social media platforms such as TikTok and Instagram. PinLove is operated as an individual project.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. Data we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data:</strong> email address, display name, and username provided at registration.</li>
            <li><strong>Places data:</strong> place names, addresses, descriptions, and notes that you explicitly save.</li>
            <li><strong>TikTok video metadata:</strong> when you paste a public TikTok video URL, we retrieve only the video's public description and hashtags via the TikTok Display API. We do not access your TikTok account, followers, messages, or any private data.</li>
            <li><strong>Geolocation:</strong> used only on-device to display your position on the map and calculate directions. It is never stored on our servers.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. How we use your data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide the core service (saving and displaying your places).</li>
            <li>To enable optional sharing features with friends you explicitly invite.</li>
            <li>We do not sell your data to third parties.</li>
            <li>We do not use your data for advertising.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. TikTok API usage</h2>
          <p>PinLove uses the TikTok Display API solely to read publicly available metadata (description, hashtags) of videos whose URLs are submitted by you. This action is always initiated explicitly by you. We do not store TikTok credentials. We do not post, modify, or delete any TikTok content.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. Data storage</h2>
          <p>Your data is stored securely in Supabase (PostgreSQL), hosted in the European Union. We apply row-level security so each user can only access their own data.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">6. Your rights</h2>
          <p>You may request deletion of your account and all associated data at any time by contacting us at <a href="mailto:contact@pinlove.app" className="text-brand-500 underline">contact@pinlove.app</a>.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">7. Contact</h2>
          <p>For any privacy-related questions: <a href="mailto:contact@pinlove.app" className="text-brand-500 underline">contact@pinlove.app</a></p>
        </div>
      </section>
    </main>
  )
}

import type { Metadata, Viewport } from 'next'
import { DM_Sans, Fraunces } from 'next/font/google'
import './globals.css'
import { ToastContainer } from '@/components/ui/Toast'
import { AppInitializer } from '@/components/AppInitializer'

// Thème "Cerise" — Fraunces pour les titres, DM Sans pour le reste
// (voir lib/design-tokens.ts).
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-fraunces',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'PinLove — Transforme tes contenus en lieux réels',
    template: '%s | PinLove',
  },
  description:
    'Retrouve facilement les adresses que tu as vues sur TikTok et Instagram. Carte interactive, itinéraires, partage avec tes amis.',
  keywords: ['adresses', 'tiktok', 'instagram', 'carte', 'lieux', 'spots'],
  authors: [{ name: 'PinLove' }],
  icons: {
    icon: [{ url: '/logo.svg', type: 'image/svg+xml' }, { url: '/favicon.png' }],
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    title: 'PinLove',
    description: 'Transforme tes contenus enregistrés en lieux réels.',
    siteName: 'PinLove',
    images: [{ url: '/logo.png', width: 1024, height: 1024, alt: 'PinLove' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PinLove',
    description: 'Transforme tes contenus enregistrés en lieux réels.',
    images: ['/logo.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F7F3EF',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" data-theme="light" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body>
        <AppInitializer />
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}

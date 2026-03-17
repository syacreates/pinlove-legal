import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastContainer } from '@/components/ui/Toast'
import { AppInitializer } from '@/components/AppInitializer'

export const metadata: Metadata = {
  title: {
    default: 'PinLove — Transforme tes contenus en lieux réels',
    template: '%s | PinLove',
  },
  description:
    'Retrouve facilement les adresses que tu as vues sur TikTok et Instagram. Carte interactive, itinéraires, partage avec tes amis.',
  keywords: ['adresses', 'tiktok', 'instagram', 'carte', 'lieux', 'spots'],
  authors: [{ name: 'PinLove' }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    title: 'PinLove',
    description: 'Transforme tes contenus enregistrés en lieux réels.',
    siteName: 'PinLove',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PinLove',
    description: 'Transforme tes contenus enregistrés en lieux réels.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head />
      <body>
        <AppInitializer />
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}

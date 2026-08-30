import type { Metadata, Viewport } from 'next'
import { Big_Shoulders_Stencil_Display, Caveat, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { ToastContainer } from '@/components/ui/Toast'
import { AppInitializer } from '@/components/AppInitializer'

const stencil = Big_Shoulders_Stencil_Display({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-stencil',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-caveat',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
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
    icon: '/favicon.png',
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
  themeColor: '#0E2B30',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${stencil.variable} ${caveat.variable} ${plexMono.variable}`}>
      <head />
      <body>
        <AppInitializer />
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}

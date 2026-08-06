'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Initializes the auth store from mock local storage on first render.
 * Placed in the root layout to ensure it runs before any child component.
 */
export function AppInitializer() {
  const init = useAuthStore(s => s.init)
  const router = useRouter()

  useEffect(() => {
    init()
  }, [init])

  // Lien reçu via la Share Extension iOS / Share Intent Android
  // (pinlove://import?url=<lien TikTok ou Instagram partagé>)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const listener = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      try {
        const parsed = new URL(url)
        const sharedUrl = parsed.searchParams.get('url')
        if (parsed.pathname.includes('import') && sharedUrl) {
          router.push(`/import?url=${encodeURIComponent(sharedUrl)}`)
        }
      } catch {
        // Lien mal formé — on ignore
      }
    })

    return () => {
      listener.then(l => l.remove())
    }
  }, [router])

  return null
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/BottomNav'
import { PaywallModal } from '@/components/PaywallModal'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { ROUTES } from '@/lib/constants'

/**
 * App shell layout — wraps all authenticated pages with the bottom nav.
 * Also pre-loads the places list and mounts the global paywall modal.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router      = useRouter()
  const user        = useAuthStore(s => s.user)
  const initialized = useAuthStore(s => s.initialized)
  const loadPlaces  = usePlacesStore(s => s.loadPlaces)

  useEffect(() => {
    if (initialized && !user) {
      router.replace(ROUTES.LOGIN)
    }
  }, [initialized, user, router])

  useEffect(() => {
    if (user) loadPlaces(user.id)
  }, [user, loadPlaces])

  if (!initialized || !user) return null

  return (
    <>
      <main className="page-container">
        {children}
      </main>
      <BottomNav />
      <PaywallModal />
    </>
  )
}

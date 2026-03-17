'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Initializes the auth store from mock local storage on first render.
 * Placed in the root layout to ensure it runs before any child component.
 */
export function AppInitializer() {
  const init = useAuthStore(s => s.init)

  useEffect(() => {
    init()
  }, [init])

  return null
}

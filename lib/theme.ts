'use client'

import { useCallback, useEffect, useState } from 'react'
import { THEME_STORAGE_KEY } from '@/lib/constants'

export type Theme = 'light' | 'dark'

const THEME_EVENT = 'pinlove:themechange'

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

function writeTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Private browsing / storage disabled — theme just won't persist.
  }
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }))
}

/**
 * Reads/writes the light-dark theme, kept as a `data-theme` attribute on
 * <html> (see the blocking script in app/layout.tsx, which sets it before
 * first paint to avoid a flash of the wrong theme). Multiple mounted
 * toggles (mobile nav + desktop) stay in sync via a window event.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    setThemeState(readTheme())
    function onChange(e: Event) {
      setThemeState((e as CustomEvent<Theme>).detail)
    }
    window.addEventListener(THEME_EVENT, onChange)
    return () => window.removeEventListener(THEME_EVENT, onChange)
  }, [])

  const setTheme = useCallback((next: Theme, origin?: { x: number; y: number }) => {
    const root = document.documentElement
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (origin) {
      root.style.setProperty('--theme-x', `${origin.x}px`)
      root.style.setProperty('--theme-y', `${origin.y}px`)
    }

    if (!reduceMotion && origin && typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => writeTheme(next))
    } else {
      writeTheme(next)
    }
  }, [])

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      setTheme(theme === 'dark' ? 'light' : 'dark', origin)
    },
    [theme, setTheme],
  )

  return { theme, setTheme, toggleTheme }
}

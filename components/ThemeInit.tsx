'use client'

import { useEffect } from 'react'
import { useTheme } from '@/lib/theme'

// Keeps the browser-chrome / native status bar tint in sync with the theme.
const THEME_COLOR: Record<'light' | 'dark', string> = {
  dark: '#0E2B30',
  light: '#EEF2EF',
}

export function ThemeInit() {
  const { theme } = useTheme()

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])

  return null
}

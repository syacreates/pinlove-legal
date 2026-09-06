'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

/** Sliding sun/moon switch. Triggers the circular-reveal transition in
 * app/globals.css (`::view-transition-*`), expanding from the click point. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    toggleTheme({ x: e.clientX, y: e.clientY })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? 'Passer en mode sombre' : 'Passer en mode clair'}
      className={cn(
        'inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1',
        'bg-surface border border-dashed border-brass/40',
        'transition-colors duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-petrol-soft',
        className,
      )}
    >
      <span
        className={cn(
          'relative flex h-6 w-6 items-center justify-center rounded-full bg-brass shadow-floating',
          'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          isLight ? 'translate-x-6' : 'translate-x-0',
        )}
      >
        <Sun
          className={cn(
            'absolute inset-0 m-auto h-3.5 w-3.5 text-ink transition-all duration-200',
            isLight ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0',
          )}
        />
        <Moon
          className={cn(
            'absolute inset-0 m-auto h-3.5 w-3.5 text-ink transition-all duration-200',
            isLight ? '-rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100',
          )}
        />
      </span>
    </button>
  )
}

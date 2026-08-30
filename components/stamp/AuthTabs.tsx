'use client'

import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'

interface AuthTabsProps {
  active: 'login' | 'signup'
  className?: string
}

/** Two-pill tab switcher for the login/signup screens — navigates between the two routes. */
export function AuthTabs({ active, className }: AuthTabsProps) {
  const router = useRouter()

  return (
    <div
      className={cn(
        'flex bg-surface rounded-[10px] p-1 border border-dashed border-paper/20',
        className,
      )}
    >
      {(['login', 'signup'] as const).map(tab => (
        <button
          key={tab}
          type="button"
          onClick={() => router.push(tab === 'login' ? ROUTES.LOGIN : ROUTES.SIGNUP)}
          className={cn(
            'flex-1 text-center py-2.5 rounded-[7px] font-mono text-[11.5px] font-semibold uppercase tracking-wide transition-colors',
            active === tab ? 'bg-brass text-ink' : 'text-mist',
          )}
        >
          {tab === 'login' ? 'Connexion' : 'Inscription'}
        </button>
      ))}
    </div>
  )
}

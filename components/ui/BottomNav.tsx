'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, PlusCircle, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'

const NAV_ITEMS = [
  { href: ROUTES.HOME,    icon: Home,       label: 'Accueil' },
  { href: ROUTES.MAP,     icon: Map,        label: 'Carte' },
  { href: ROUTES.ADD,     icon: PlusCircle, label: 'Ajouter',  primary: true },
  { href: ROUTES.FRIENDS, icon: Users,      label: 'Amis' },
  { href: ROUTES.PROFILE, icon: User,       label: 'Profil' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl shadow-bottom-nav"
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around h-[72px] px-2 max-w-lg mx-auto pb-safe-bottom">
        {NAV_ITEMS.map(({ href, icon: Icon, label, primary }) => {
          const isActive = pathname === href

          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5"
                aria-label={label}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200',
                    'bg-brand-500 shadow-floating active:scale-90',
                    isActive && 'scale-95',
                  )}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all duration-150 active:bg-neutral-100 min-w-[48px]"
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-brand-500' : 'text-neutral-400',
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-brand-500' : 'text-neutral-400',
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

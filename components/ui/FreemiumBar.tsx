'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { FREE_PLAN_LIMIT } from '@/lib/constants'
import { ROUTES } from '@/lib/constants'

interface FreemiumBarProps {
  count: number
  className?: string
}

export function FreemiumBar({ count, className }: FreemiumBarProps) {
  const remaining = Math.max(0, FREE_PLAN_LIMIT - count)
  const pct = Math.min((count / FREE_PLAN_LIMIT) * 100, 100)
  const isNearLimit = remaining <= 1
  const isAtLimit = remaining === 0

  return (
    <div
      className={cn(
        'bg-white rounded-3xl shadow-card p-4',
        isAtLimit && 'ring-2 ring-brand-400',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-700">
          {isAtLimit ? '🚫 Limite gratuite atteinte' : `📍 ${count} / ${FREE_PLAN_LIMIT} adresses`}
        </span>
        <Link
          href={ROUTES.PRICING}
          className="text-xs font-semibold text-brand-500 hover:text-brand-600"
        >
          {isAtLimit ? 'Débloquer →' : 'Premium'}
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isAtLimit ? 'bg-brand-500' :
            isNearLimit ? 'bg-amber-400' :
            'bg-brand-300',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {isAtLimit && (
        <p className="mt-2 text-xs text-neutral-500">
          Passe en premium une fois pour tout débloquer.
        </p>
      )}
    </div>
  )
}

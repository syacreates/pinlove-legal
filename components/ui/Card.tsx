import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  children,
  className,
  onClick,
  hoverable = false,
  padding = 'md',
}: CardProps) {
  const paddingMap = {
    none: '',
    sm:   'p-3',
    md:   'p-4',
    lg:   'p-6',
  }

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'bg-white rounded-3xl shadow-card',
        paddingMap[padding],
        hoverable && 'cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98]',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-3xl shadow-card p-4 animate-pulse', className)}>
      <div className="h-4 bg-neutral-200 rounded-full w-3/4 mb-3" />
      <div className="h-3 bg-neutral-100 rounded-full w-1/2 mb-2" />
      <div className="h-3 bg-neutral-100 rounded-full w-2/3" />
    </div>
  )
}

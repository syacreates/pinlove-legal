import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TicketCardProps {
  eyebrowLeft?: string
  eyebrowRight?: string
  label: ReactNode
  sub?: string
  pinColors?: string[]
  className?: string
}

const DEFAULT_PIN_COLORS = ['#C8243F', '#1E1A1A', '#E4DDD7']

/** Train-ticket-style card with dashed border and cut-out semicircles. */
export function TicketCard({
  eyebrowLeft,
  eyebrowRight,
  label,
  sub,
  pinColors = DEFAULT_PIN_COLORS,
  className,
}: TicketCardProps) {
  return (
    <div className={cn('ticket-card w-full', className)}>
      {(eyebrowLeft || eyebrowRight) && (
        <div className="flex justify-between gap-2 text-xs font-bold uppercase tracking-[0.06em] text-accent mb-2.5">
          <span className="truncate flex-shrink-0">{eyebrowLeft}</span>
          <span className="truncate min-w-0">{eyebrowRight}</span>
        </div>
      )}
      <div className="font-display font-semibold text-[28px] leading-none text-ink">
        {label}
      </div>
      {sub && <div className="text-[13px] text-muted mt-1.5">{sub}</div>}
      {pinColors.length > 0 && (
        <div className="flex gap-1.5 mt-3">
          {pinColors.map((c, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-sm"
              style={{
                background: c,
                border: i === pinColors.length - 1 ? '1px dashed #B3A79E' : undefined,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

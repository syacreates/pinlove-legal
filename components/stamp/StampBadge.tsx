import { useId } from 'react'
import { cn } from '@/lib/utils'

interface StampBadgeProps {
  size?: 'sm' | 'lg'
  className?: string
}

/**
 * Logo PinLove : cœur-épingle dans un cercle en pointillés.
 * Même dessin que public/logo.svg (source des icônes et écrans de démarrage).
 */
export function StampBadge({ size = 'lg', className }: StampBadgeProps) {
  const box = size === 'lg' ? 150 : 56
  const gradientId = `pl-heart-${useId()}`

  return (
    <svg
      width={box}
      height={box}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="PinLove"
      className={cn('flex-shrink-0', className)}
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="34" y1="35" x2="66" y2="64">
          <stop stopColor="#C8243F" />
          <stop offset="1" stopColor="#9E1B31" />
        </linearGradient>
      </defs>
      <circle
        cx="50" cy="50" r="38"
        stroke="#C8243F" strokeWidth="3.4"
        strokeDasharray="11.2 8.7" strokeDashoffset="5.6"
        transform="rotate(-90 50 50)"
      />
      <ellipse cx="50" cy="73.2" rx="6.6" ry="1.9" fill="#C8243F" fillOpacity=".55" />
      <path d="M48.4 60v12a1.6 1.6 0 0 0 3.2 0V60Z" fill="#9E1B31" />
      <path
        d="M50 64.7C39.5 58 33.5 51.6 33.5 44.1 33.5 38.5 38 34 43.6 34c3.3 0 6 1.5 6.4 3.75C50.4 35.5 53.1 34 56.4 34 62 34 66.5 38.5 66.5 44.1 66.5 51.6 60.5 58 50 64.7Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  )
}

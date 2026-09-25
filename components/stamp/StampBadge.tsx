import { cn } from '@/lib/utils'

interface StampBadgeProps {
  size?: 'sm' | 'lg'
  animated?: boolean
  className?: string
}

const HEART_PATH =
  'M26 46C12 37 4 28.5 4 18.5 4 11 10 5 17.5 5c4.4 0 8 2 8.5 5 .5-3 4.1-5 8.5-5C42 5 48 11 48 18.5 48 28.5 40 37 26 46Z'

// Shared viewBox: the dashed ring (r=36, stroke 4) fills it edge to edge.
const VIEW_BOX = '12 12 76 76'

/** The dashed-circle "postal stamp" with a heart pin — PinLove's logo. */
export function StampBadge({
  size = 'lg',
  animated = size === 'lg',
  className,
}: StampBadgeProps) {
  const box = size === 'lg' ? 126 : 40
  const gradientId = size === 'lg' ? 'stamp-gradient-lg' : 'stamp-gradient-sm'

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: box, height: box }}
    >
      <div className={cn('stamp-ring absolute inset-0', !animated && '!animate-none')}>
        <svg viewBox={VIEW_BOX} className="w-full h-full">
          <circle
            cx="50" cy="50" r="36" fill="none" stroke="#C8243F" strokeWidth="4"
            strokeDasharray="11.9 10.72" strokeDashoffset="-5.34"
          />
        </svg>
      </div>
      <div className="absolute inset-0">
        <svg viewBox={VIEW_BOX} className="w-full h-full" fill="none">
          <ellipse cx="50" cy="70.6" rx="6.2" ry="1.9" fill="#C8243F" opacity=".6" />
          <path d="M48.7 56h2.6v13.4a1.3 1.8 0 0 1-2.6 0Z" fill="#9E1B31" />
          <path d={HEART_PATH} transform="translate(31.8 32.3) scale(.7)" fill={`url(#${gradientId})`} />
          <defs>
            <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="4" y1="5" x2="48" y2="46">
              <stop stopColor="#C8243F" />
              <stop offset="1" stopColor="#9E1B31" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}

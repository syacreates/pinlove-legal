import { cn } from '@/lib/utils'

interface StampBadgeProps {
  size?: 'sm' | 'lg'
  animated?: boolean
  ringText?: string
  className?: string
}

const HEART_PATH =
  'M26 46C12 37 4 28.5 4 18.5 4 11 10 5 17.5 5c4.4 0 8 2 8.5 5 .5-3 4.1-5 8.5-5C42 5 48 11 48 18.5 48 28.5 40 37 26 46Z'

/** The dashed-circle "postal stamp" mark — PinLove's signature logo motif. */
export function StampBadge({
  size = 'lg',
  animated = size === 'lg',
  ringText = '✦ PIN LOVE ✦ TES SPOTS ✦ TA CARTE ',
  className,
}: StampBadgeProps) {
  const box = size === 'lg' ? 126 : 40
  const heartBox = size === 'lg' ? 46 : 18
  const gradientId = size === 'lg' ? 'stamp-gradient-lg' : 'stamp-gradient-sm'
  const ringId = `stamp-ring-path-${size}`

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: box, height: box }}
    >
      <div
        className={cn('stamp-ring absolute inset-0', !animated && '!animate-none')}
      >
        {size === 'lg' && (
          <svg viewBox="0 0 100 100" className="absolute -inset-[17px] w-[calc(100%+34px)] h-[calc(100%+34px)]">
            <path id={ringId} d="M50,6 a44,44 0 1,1 -0.1,0" fill="none" />
            <text fontSize="8.4" letterSpacing=".18em" fill="#E7B34A">
              <textPath href={`#${ringId}`} startOffset="0%">
                {ringText}
              </textPath>
            </text>
          </svg>
        )}
      </div>
      <div className={cn('stamp-core', !animated && '!animate-none')}>
        <svg width={heartBox} height={heartBox} viewBox="0 0 52 52" fill="none">
          <path d={HEART_PATH} fill={`url(#${gradientId})`} />
          <defs>
            <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="4" y1="5" x2="48" y2="46">
              <stop stopColor="#E7B34A" />
              <stop offset="1" stopColor="#E63B77" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}

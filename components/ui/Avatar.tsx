import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZES = {
  xs: { px: 24, cls: 'w-6 h-6 text-xs' },
  sm: { px: 32, cls: 'w-8 h-8 text-xs' },
  md: { px: 40, cls: 'w-10 h-10 text-sm' },
  lg: { px: 56, cls: 'w-14 h-14 text-base' },
  xl: { px: 80, cls: 'w-20 h-20 text-xl' },
}

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const { px, cls } = SIZES[size]

  const initials = alt
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0',
        cls,
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={px}
          height={px}
          className="object-cover w-full h-full"
          unoptimized
        />
      ) : (
        <span className="font-semibold text-white">{initials}</span>
      )}
    </div>
  )
}

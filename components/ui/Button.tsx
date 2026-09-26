import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'dashed'
export type ButtonSize    = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const base = [
      'inline-flex items-center justify-center gap-2 font-bold',
      'rounded-full transition-all duration-150 select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:opacity-50 disabled:pointer-events-none',
      'active:scale-[0.97]',
    ]

    const variants: Record<ButtonVariant, string> = {
      // ui.buttonPrimary / buttonDark / buttonOutline
      primary:   'bg-accent text-white hover:bg-accent-dark',
      // Thémé : foncé en clair, clair en sombre
      secondary: 'bg-neutral-900 text-neutral-50 hover:bg-neutral-900/90',
      ghost:     'bg-transparent text-mist hover:bg-surface',
      danger:    'bg-red-600 text-white hover:bg-red-700',
      outline:   'border border-line bg-surface text-neutral-900 hover:bg-surface-2',
      dashed:    'border border-dashed border-dash text-neutral-900 bg-transparent hover:bg-surface',
    }

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-9  px-3.5 text-sm',
      md: 'h-11 px-5 text-[15px]',
      lg: 'h-[46px] px-6 text-base',
      xl: 'h-cta px-8 text-[17px]',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {loading ? (
          <Spinner />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    )
  },
)
Button.displayName = 'Button'

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

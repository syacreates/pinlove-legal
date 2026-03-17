import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
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
      'inline-flex items-center justify-center gap-2 font-semibold',
      'rounded-2xl transition-all duration-150 select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:pointer-events-none',
      'active:scale-[0.97]',
    ]

    const variants: Record<ButtonVariant, string> = {
      primary:   'bg-brand-500 text-white hover:bg-brand-600 shadow-floating',
      secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
      ghost:     'bg-transparent text-neutral-700 hover:bg-neutral-100',
      danger:    'bg-red-500 text-white hover:bg-red-600',
      outline:   'border-2 border-brand-500 text-brand-500 bg-transparent hover:bg-brand-50',
    }

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-8  px-3 text-sm',
      md: 'h-11 px-5 text-sm',
      lg: 'h-13 px-6 text-base',
      xl: 'h-14 px-8 text-base',
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

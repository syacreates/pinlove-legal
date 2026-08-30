import { cn } from '@/lib/utils'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: string | React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon = '📍',
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-center animate-pulse-soft">
        {typeof icon === 'string' ? <span className="text-5xl">{icon}</span> : icon}
      </div>
      <h3 className="text-lg font-display font-bold uppercase text-neutral-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 max-w-xs leading-relaxed mb-6">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {action && (
            <Button variant="primary" onClick={action.onClick} fullWidth>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick} fullWidth>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

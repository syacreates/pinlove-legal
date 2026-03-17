'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  /** 'sheet' slides up from the bottom (mobile-native feel); 'center' is a centered dialog */
  variant?: 'sheet' | 'center'
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  variant = 'sheet',
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 bg-white w-full max-w-lg animate-slide-up',
          variant === 'sheet'
            ? 'rounded-t-3xl max-h-[92vh] overflow-y-auto pb-safe-bottom'
            : 'rounded-3xl mx-4 mb-4 max-h-[85vh] overflow-y-auto',
          className,
        )}
      >
        {/* Drag handle (sheet only) */}
        {variant === 'sheet' && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-neutral-200" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pt-3 pb-2">
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-xl hover:bg-neutral-100 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        )}

        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  )
}

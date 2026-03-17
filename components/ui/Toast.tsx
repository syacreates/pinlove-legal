'use client'

import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore, type Toast } from '@/stores/app.store'

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />,
  error:   <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
  info:    <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
}

const BG = {
  success: 'bg-green-50 border-green-200',
  error:   'bg-red-50 border-red-200',
  info:    'bg-blue-50 border-blue-200',
  warning: 'bg-amber-50 border-amber-200',
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useAppStore(s => s.removeToast)

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-card animate-slide-up',
        BG[toast.type],
      )}
      role="alert"
    >
      {ICONS[toast.type]}
      <p className="text-sm font-medium text-neutral-900 flex-1 leading-snug">
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        className="p-0.5 -mt-0.5 rounded-lg hover:bg-black/5 transition-colors flex-shrink-0"
        aria-label="Fermer"
      >
        <X className="w-3.5 h-3.5 text-neutral-400" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useAppStore(s => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}

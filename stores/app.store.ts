/**
 * App Store — global UI state (toasts, modals, loading).
 */

import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

interface AppState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  // Paywall modal
  paywallOpen: boolean
  openPaywall: () => void
  closePaywall: () => void
}

let _toastId = 0

export const useAppStore = create<AppState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++_toastId}`
    set(s => ({ toasts: [...s.toasts, { ...toast, id }] }))
    const duration = toast.duration ?? 4000
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, duration)
  },
  removeToast: (id) =>
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  paywallOpen: false,
  openPaywall: () => set({ paywallOpen: true }),
  closePaywall: () => set({ paywallOpen: false }),
}))

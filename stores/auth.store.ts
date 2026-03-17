/**
 * Auth Store — current user, auth state.
 */

import { create } from 'zustand'
import type { User } from '@/lib/types'
import { authService } from '@/services/auth.service'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  init: () => void
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>
  signOut: () => Promise<void>
  upgradeToPremium: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  setUser: (user) => set({ user }),

  /** Call once on app mount to rehydrate from mock storage. */
  init: () => {
    const user = authService.getCurrentUser()
    set({ user, initialized: true })
  },

  signIn: async (email, password) => {
    set({ loading: true })
    const { user, error } = await authService.signIn(email, password)
    set({ user, loading: false })
    return error
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true })
    const { user, error } = await authService.signUp(email, password, fullName)
    set({ user, loading: false })
    return error
  },

  signOut: async () => {
    await authService.signOut()
    set({ user: null })
  },

  upgradeToPremium: async () => {
    const { user, error } = await authService.upgradeToPremium()
    if (!error && user) set({ user })
  },
}))

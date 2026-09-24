/**
 * Auth Store — current user, auth state.
 * Uses Supabase session + real-time auth state listener.
 */

import { create } from 'zustand'
import type { User } from '@/lib/types'
import { authService } from '@/services/auth.service'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>
  signOut: () => Promise<void>
  upgradeToPremium: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  setUser: (user) => set({ user }),

  /** Call once on app mount — loads session and sets up auth state listener. */
  init: async () => {
    const user = await authService.getCurrentUser()
    set({ user, initialized: true })

    // Keep in sync across tabs and on token refresh.
    // Le callback ne doit PAS être async ni appeler Supabase directement :
    // supabase-js le déclenche en tenant son verrou d'auth, et un appel à
    // getSession()/une requête dedans provoque un interblocage — toutes les
    // requêtes suivantes (comptage, enregistrement d'un lieu…) restent alors
    // bloquées jusqu'au timeout. On diffère donc avec setTimeout(…, 0),
    // comme le recommande la doc Supabase.
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        set({ user: null })
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setTimeout(async () => {
          const updatedUser = await authService.getCurrentUser()
          if (updatedUser) set({ user: updatedUser })
        }, 0)
      }
    })
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
    // Efface toujours la session locale, même si l'appel réseau échoue ou
    // traîne — rester connecté côté client parce que Supabase ne répond pas
    // serait pire qu'une session serveur pas parfaitement synchronisée.
    try {
      await authService.signOut()
    } finally {
      set({ user: null })
    }
  },

  upgradeToPremium: async () => {
    const { user, error } = await authService.upgradeToPremium()
    if (!error && user) set({ user })
  },
}))

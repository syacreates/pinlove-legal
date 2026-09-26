/**
 * Rencontre Store — profil Rencontres de l'utilisateur connecté.
 */

import { create } from 'zustand'
import type { RencontreProfile } from '@/lib/types'
import { rencontresService } from '@/services/rencontres.service'

interface RencontreState {
  profile: RencontreProfile | null
  /** true une fois le profil chargé (qu'il existe ou non) */
  loaded: boolean
  loadedFor: string | null
  loadProfile: (userId: string) => Promise<void>
  setProfile: (profile: RencontreProfile | null) => void
}

export const useRencontreStore = create<RencontreState>((set, get) => ({
  profile: null,
  loaded: false,
  loadedFor: null,

  loadProfile: async (userId) => {
    if (get().loadedFor !== userId) set({ loaded: false, profile: null })
    const profile = await rencontresService.getMyProfile(userId)
    set({ profile, loaded: true, loadedFor: userId })
  },

  setProfile: (profile) => set({ profile }),
}))

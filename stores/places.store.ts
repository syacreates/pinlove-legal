/**
 * Places Store — place list, CRUD operations, freemium status.
 */

import { create } from 'zustand'
import type { Place, PlaceCategory, PlaceVisibility } from '@/lib/types'
import { placesService, type CreatePlaceInput } from '@/services/places.service'
import { FREE_PLAN_LIMIT } from '@/lib/constants'

interface PlacesState {
  places: Place[]
  loading: boolean
  // Freemium
  placesCount: number
  canAdd: boolean
  // Actions
  loadPlaces: (userId: string) => Promise<void>
  createPlace: (
    userId: string,
    input: CreatePlaceInput,
    userPlan: 'free' | 'premium',
  ) => Promise<{ error: string | null }>
  deletePlace: (id: string, userId: string) => Promise<{ error: string | null }>
  updateVisibility: (
    id: string,
    userId: string,
    visibility: PlaceVisibility,
  ) => Promise<void>
  toggleFavorite: (id: string, userId: string) => Promise<void>
  refreshCount: (userId: string, plan: 'free' | 'premium') => Promise<void>
}

export const usePlacesStore = create<PlacesState>((set, get) => ({
  places: [],
  loading: false,
  placesCount: 0,
  canAdd: true,

  loadPlaces: async (userId) => {
    set({ loading: true })
    const places = await placesService.getPlaces(userId)
    const count = places.length
    set({
      places,
      loading: false,
      placesCount: count,
    })
  },

  createPlace: async (userId, input, userPlan) => {
    const { place, error } = await placesService.createPlace(userId, input, userPlan)
    if (!error && place) {
      set(s => ({
        places: [place, ...s.places],
        placesCount: s.placesCount + 1,
        canAdd: userPlan === 'premium' ? true : s.placesCount + 1 < FREE_PLAN_LIMIT,
      }))
    }
    return { error }
  },

  deletePlace: async (id, userId) => {
    const { error } = await placesService.deletePlace(id, userId)
    if (!error) {
      set(s => ({
        places: s.places.filter(p => p.id !== id),
        placesCount: Math.max(0, s.placesCount - 1),
      }))
    }
    return { error }
  },

  updateVisibility: async (id, userId, visibility) => {
    const { place } = await placesService.updatePlace(id, userId, { visibility })
    if (place) {
      set(s => ({
        places: s.places.map(p => (p.id === id ? place : p)),
      }))
    }
  },

  toggleFavorite: async (id, userId) => {
    const { place } = await placesService.toggleFavorite(id, userId)
    if (place) {
      set(s => ({
        places: s.places.map(p => (p.id === id ? place : p)),
      }))
    }
  },

  refreshCount: async (userId, plan) => {
    const count = await placesService.countPlaces(userId)
    set({
      placesCount: count,
      canAdd: plan === 'premium' || count < FREE_PLAN_LIMIT,
    })
  },
}))

/**
 * Places Service
 *
 * CRUD for places. In V1 uses in-memory store seeded with demo data.
 * Ready for Supabase integration: swap the mock calls for supabase.from('places').
 */

import type { Place, PlaceCategory, PlaceVisibility } from '@/lib/types'
import { DEMO_PLACES } from '@/data/demo'
import { FREE_PLAN_LIMIT } from '@/lib/constants'
import { generateId } from '@/lib/utils'

// ── In-memory store ───────────────────────────────────────────────────────────
let _places: Place[] = [...DEMO_PLACES]

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CreatePlaceInput {
  name: string
  address: string
  city: string
  country?: string
  category: PlaceCategory
  description?: string
  note?: string
  photo_url?: string
  latitude: number
  longitude: number
  visibility: PlaceVisibility
  source?: Place['source']
}

export interface UpdatePlaceInput extends Partial<CreatePlaceInput> {
  shared_with_friend_ids?: string[]
}

export interface PlacesFilter {
  category?: PlaceCategory
  visibility?: PlaceVisibility
  search?: string
}

// ── Service ───────────────────────────────────────────────────────────────────
export const placesService = {
  /** Returns all places for a user (sorted by most recent). */
  async getPlaces(userId: string, filter?: PlacesFilter): Promise<Place[]> {
    await delay(300)
    let results = _places.filter(p => p.user_id === userId)

    if (filter?.category) {
      results = results.filter(p => p.category === filter.category)
    }
    if (filter?.visibility) {
      results = results.filter(p => p.visibility === filter.visibility)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q),
      )
    }

    return results.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  },

  /** Returns a single place by id. */
  async getPlace(id: string): Promise<Place | null> {
    await delay(200)
    return _places.find(p => p.id === id) ?? null
  },

  /** Count places for a user (used for freemium check). */
  async countPlaces(userId: string): Promise<number> {
    await delay(100)
    return _places.filter(p => p.user_id === userId).length
  },

  /** Check if user can add a new place (respects free plan limit). */
  async canAddPlace(userId: string, userPlan: 'free' | 'premium'): Promise<boolean> {
    if (userPlan === 'premium') return true
    const count = await placesService.countPlaces(userId)
    return count < FREE_PLAN_LIMIT
  },

  /** Create a new place. Throws if the free plan limit is reached. */
  async createPlace(
    userId: string,
    input: CreatePlaceInput,
    userPlan: 'free' | 'premium',
  ): Promise<{ place: Place | null; error: string | null }> {
    await delay(500)

    const canAdd = await placesService.canAddPlace(userId, userPlan)
    if (!canAdd) {
      return {
        place: null,
        error: `Limite gratuite atteinte (${FREE_PLAN_LIMIT} adresses). Passe en premium pour continuer.`,
      }
    }

    const now = new Date().toISOString()
    const place: Place = {
      id: generateId(),
      user_id: userId,
      name: input.name,
      address: input.address,
      city: input.city,
      country: input.country ?? 'France',
      category: input.category,
      description: input.description ?? null,
      note: input.note ?? null,
      photo_url: input.photo_url ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      visibility: input.visibility,
      shared_with_friend_ids: [],
      source: input.source ?? null,
      created_at: now,
      updated_at: now,
    }

    _places = [place, ..._places]
    return { place, error: null }
  },

  /** Update an existing place. */
  async updatePlace(
    id: string,
    userId: string,
    input: UpdatePlaceInput,
  ): Promise<{ place: Place | null; error: string | null }> {
    await delay(400)

    const idx = _places.findIndex(p => p.id === id && p.user_id === userId)
    if (idx === -1) return { place: null, error: 'Lieu introuvable.' }

    _places[idx] = {
      ..._places[idx],
      ...input,
      updated_at: new Date().toISOString(),
    }
    return { place: _places[idx], error: null }
  },

  /** Delete a place. */
  async deletePlace(id: string, userId: string): Promise<{ error: string | null }> {
    await delay(300)
    const idx = _places.findIndex(p => p.id === id && p.user_id === userId)
    if (idx === -1) return { error: 'Lieu introuvable.' }
    _places = _places.filter(p => !(p.id === id && p.user_id === userId))
    return { error: null }
  },

  /** Returns places shared by friends that are visible to the current user. */
  async getFriendsPlaces(
    currentUserId: string,
    friendIds: string[],
  ): Promise<Place[]> {
    await delay(300)
    return _places.filter(p => {
      if (p.user_id === currentUserId) return false
      if (!friendIds.includes(p.user_id)) return false
      // Must be public or shared with the current user
      return (
        p.visibility === 'public' ||
        (p.visibility === 'friends' && p.shared_with_friend_ids.includes(currentUserId))
      )
    })
  },

  /** Share a place with specific friends. */
  async shareWithFriends(
    id: string,
    userId: string,
    friendIds: string[],
  ): Promise<{ error: string | null }> {
    await delay(300)
    const idx = _places.findIndex(p => p.id === id && p.user_id === userId)
    if (idx === -1) return { error: 'Lieu introuvable.' }

    _places[idx] = {
      ..._places[idx],
      shared_with_friend_ids: friendIds,
      visibility: friendIds.length > 0 ? 'friends' : _places[idx].visibility,
      updated_at: new Date().toISOString(),
    }
    return { error: null }
  },
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

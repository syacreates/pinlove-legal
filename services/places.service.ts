/**
 * Places Service — Supabase CRUD
 */

import { supabase } from '@/lib/supabase'
import type { Place, PlaceCategory, PlaceVisibility, SourcePlatform } from '@/lib/types'
import { FREE_PLAN_LIMIT } from '@/lib/constants'
import { withTimeout } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreatePlaceInput {
  name: string
  address: string
  postal_code?: string
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

// ── DB ↔ Domain mappers ───────────────────────────────────────────────────────

type DbPlace = Omit<Place, 'source'> & {
  source_platform: SourcePlatform | null
  source_url: string | null
  source_post_id: string | null
  source_parsed_at: string | null
  source_confidence: number | null
}

function dbToPlace(row: DbPlace): Place {
  const {
    source_platform, source_url, source_post_id, source_parsed_at, source_confidence,
    ...rest
  } = row
  return {
    ...rest,
    source: source_platform ? {
      platform: source_platform,
      url: source_url ?? '',
      post_id: source_post_id,
      parsed_at: source_parsed_at ?? new Date().toISOString(),
      confidence: source_confidence ?? 0,
    } : null,
  }
}

function inputToDb(input: CreatePlaceInput, userId: string) {
  const { source, ...rest } = input
  return {
    ...rest,
    user_id: userId,
    country: input.country ?? 'France',
    source_platform: source?.platform ?? null,
    source_url: source?.url ?? null,
    source_post_id: source?.post_id ?? null,
    source_parsed_at: source?.parsed_at ?? null,
    source_confidence: source?.confidence ?? null,
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

export const placesService = {
  /** Returns all places for a user (sorted by most recent). */
  async getPlaces(userId: string, filter?: PlacesFilter): Promise<Place[]> {
    let query = supabase
      .from('places')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (filter?.category) query = query.eq('category', filter.category)
    if (filter?.visibility) query = query.eq('visibility', filter.visibility)
    if (filter?.search) {
      const q = filter.search
      query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,address.ilike.%${q}%`)
    }

    const { data, error } = await query
    if (error) { console.error('[places] getPlaces:', error.message); return [] }
    return (data as DbPlace[]).map(dbToPlace)
  },

  /** Returns a single place by id. */
  async getPlace(id: string): Promise<Place | null> {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return dbToPlace(data as DbPlace)
  },

  /** Count places for a user (used for freemium check). */
  async countPlaces(userId: string): Promise<number> {
    try {
      const { count, error } = await withTimeout(
        supabase.from('places').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        10_000,
        'Comptage des lieux',
      )
      if (error) return 0
      return count ?? 0
    } catch {
      return 0
    }
  },

  /** Check if user can add a new place (respects free plan limit). */
  async canAddPlace(userId: string, userPlan: 'free' | 'premium'): Promise<boolean> {
    if (userPlan === 'premium') return true
    const count = await placesService.countPlaces(userId)
    return count < FREE_PLAN_LIMIT
  },

  /** Create a new place. Returns error if free plan limit reached. */
  async createPlace(
    userId: string,
    input: CreatePlaceInput,
    userPlan: 'free' | 'premium',
  ): Promise<{ place: Place | null; error: string | null }> {
    const canAdd = await placesService.canAddPlace(userId, userPlan)
    if (!canAdd) {
      return {
        place: null,
        error: `Limite gratuite atteinte (${FREE_PLAN_LIMIT} adresses). Passe en premium pour continuer.`,
      }
    }

    try {
      const { data, error } = await withTimeout(
        supabase.from('places').insert(inputToDb(input, userId)).select().single(),
        10_000,
        'Enregistrement du lieu',
      )

      if (error) return { place: null, error: error.message }
      return { place: dbToPlace(data as DbPlace), error: null }
    } catch (e) {
      return { place: null, error: e instanceof Error ? e.message : 'Erreur inattendue.' }
    }
  },

  /** Update an existing place. */
  async updatePlace(
    id: string,
    userId: string,
    input: UpdatePlaceInput,
  ): Promise<{ place: Place | null; error: string | null }> {
    const { source, ...rest } = input
    const dbUpdate: Record<string, unknown> = {
      ...rest,
      updated_at: new Date().toISOString(),
    }
    if (source !== undefined) {
      dbUpdate.source_platform = source?.platform ?? null
      dbUpdate.source_url = source?.url ?? null
      dbUpdate.source_post_id = source?.post_id ?? null
      dbUpdate.source_parsed_at = source?.parsed_at ?? null
      dbUpdate.source_confidence = source?.confidence ?? null
    }

    const { data, error } = await supabase
      .from('places')
      .update(dbUpdate)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return { place: null, error: error.message }
    return { place: dbToPlace(data as DbPlace), error: null }
  },

  /** Delete a place. */
  async deletePlace(id: string, userId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    return { error: error?.message ?? null }
  },

  /** Returns places shared by friends visible to the current user. */
  async getFriendsPlaces(
    currentUserId: string,
    friendIds: string[],
  ): Promise<Place[]> {
    if (!friendIds.length) return []

    const { data, error } = await supabase
      .from('places')
      .select('*, user:users!user_id(id, username, full_name, avatar_url)')
      .in('user_id', friendIds)
      .neq('user_id', currentUserId)
      .or(`visibility.eq.public,and(visibility.eq.friends,shared_with_friend_ids.cs.{${currentUserId}})`)
      .order('created_at', { ascending: false })

    if (error) { console.error('[places] getFriendsPlaces:', error.message); return [] }
    return (data as DbPlace[]).map(dbToPlace)
  },

  /** Toggle the favorite status of a place. */
  async toggleFavorite(
    id: string,
    userId: string,
  ): Promise<{ place: Place | null; error: string | null }> {
    const current = await placesService.getPlace(id)
    if (!current || current.user_id !== userId) return { place: null, error: 'Lieu introuvable.' }

    const { data, error } = await supabase
      .from('places')
      .update({ is_favorite: !current.is_favorite, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return { place: null, error: error.message }
    return { place: dbToPlace(data as DbPlace), error: null }
  },

  /** Share a place with specific friends. */
  async shareWithFriends(
    id: string,
    userId: string,
    friendIds: string[],
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('places')
      .update({
        shared_with_friend_ids: friendIds,
        visibility: friendIds.length > 0 ? 'friends' : 'private',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
    return { error: error?.message ?? null }
  },
}

/**
 * Moments Service — suggestions, fil, création et détail des moments.
 *
 * Tout passe par les fonctions SQL (supabase/migrations/…_rencontres_moments.sql) :
 * elles vérifient intention, lieux ouverts et signalements, et ne renvoient
 * jamais que les lieux communs.
 */

import { supabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/utils'
import type { FeedMoment, Moment, MomentDetail, PersonSuggestion } from '@/lib/types'

/** Les exceptions SQL arrivent telles quelles : on garde leur message (déjà en français). */
function rpcError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('load failed') || m.includes('failed to fetch') || m.includes('délai dépassé')) {
    return 'Impossible de joindre le serveur PinLove. Vérifie ta connexion et réessaie.'
  }
  return message
}

export interface CreateMomentInput {
  placeId: string
  title: string
  /** 2 ou 3 dates */
  slots: Date[]
  durationMin: number
}

export const momentsService = {
  async getSuggestions(): Promise<PersonSuggestion[]> {
    const { data, error } = await supabase.rpc('rencontre_suggestions', { p_limit: 20 })
    if (error) { console.error('[moments] suggestions:', error.message); return [] }
    return (data ?? []) as PersonSuggestion[]
  },

  async getFeed(): Promise<FeedMoment[]> {
    const { data, error } = await supabase.rpc('moments_feed')
    if (error) { console.error('[moments] feed:', error.message); return [] }
    return (data ?? []) as FeedMoment[]
  },

  /** Mes propositions encore ouvertes (lisibles directement : j'en suis le créateur). */
  async getMyOpenMoments(userId: string): Promise<Moment[]> {
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .eq('creator_id', userId)
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (error) { console.error('[moments] mine:', error.message); return [] }
    return (data ?? []) as Moment[]
  },

  async getMoment(id: string): Promise<MomentDetail | null> {
    const { data, error } = await supabase.rpc('get_moment', { p_moment_id: id })
    if (error) { console.error('[moments] get:', error.message); return null }
    return (data ?? null) as MomentDetail | null
  },

  async createMoment(input: CreateMomentInput): Promise<{ id: string | null; error: string | null }> {
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('create_moment', {
          p_place_id:     input.placeId,
          p_title:        input.title,
          p_slots:        input.slots.map(d => d.toISOString()),
          p_duration_min: input.durationMin,
        }),
        25_000,
        'Création du moment',
      )
      if (error) return { id: null, error: rpcError(error.message) }
      return { id: data as string, error: null }
    } catch (e) {
      return { id: null, error: rpcError(e instanceof Error ? e.message : 'Erreur inattendue.') }
    }
  },

  async requestSlot(momentId: string, slot: string): Promise<{ error: string | null }> {
    const { error } = await supabase.rpc('request_moment_slot', { p_moment_id: momentId, p_slot: slot })
    return { error: error ? rpcError(error.message) : null }
  },

  async withdrawRequest(momentId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.rpc('withdraw_moment_request', { p_moment_id: momentId })
    return { error: error ? rpcError(error.message) : null }
  },
}

/**
 * Moments Service — suggestions, fil, création et détail des moments.
 *
 * Tout passe par les fonctions SQL (supabase/migrations/…_rencontres_moments.sql) :
 * elles vérifient intention, lieux ouverts et signalements, et ne renvoient
 * jamais que les lieux communs.
 */

import { supabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/utils'
import type { FeedMoment, MomentDetail, MyRencontre, PersonSuggestion, ReportReason } from '@/lib/types'

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

  /** Double acceptation : le créateur valide une demande (jeton opaque). */
  async acceptRequest(momentId: string, token: string): Promise<{ error: string | null }> {
    const { error } = await supabase.rpc('accept_moment_request', { p_moment_id: momentId, p_token: token })
    return { error: error ? rpcError(error.message) : null }
  },

  /** « Toujours partant·e ? » */
  async confirm(momentId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.rpc('confirm_moment', { p_moment_id: momentId })
    return { error: error ? rpcError(error.message) : null }
  },

  /** Annule ; `penalized` : annulation à moins de 12 h (fiabilité −10). */
  async cancel(momentId: string): Promise<{ penalized: boolean; error: string | null }> {
    const { data, error } = await supabase.rpc('cancel_moment', { p_moment_id: momentId })
    return { penalized: data === true, error: error ? rpcError(error.message) : null }
  },

  async getMyRencontres(): Promise<MyRencontre[]> {
    const { data, error } = await supabase.rpc('my_rencontres')
    if (error) { console.error('[moments] my_rencontres:', error.message); return [] }
    return (data ?? []) as MyRencontre[]
  },

  /** Check-in : renvoie la distance au lieu (mètres), refusé au-delà de 150 m. */
  async checkIn(momentId: string, lat: number, lng: number): Promise<{ distance: number | null; error: string | null }> {
    const { data, error } = await supabase.rpc('check_in_moment', { p_moment_id: momentId, p_lat: lat, p_lng: lng })
    return { distance: (data as number | null) ?? null, error: error ? rpcError(error.message) : null }
  },

  async setHint(momentId: string, hint: string): Promise<{ error: string | null }> {
    const { error } = await supabase.rpc('set_moment_hint', { p_moment_id: momentId, p_hint: hint })
    return { error: error ? rpcError(error.message) : null }
  },

  /** Signale l'autre personne du moment (ou l'auteur d'une demande, via son jeton). */
  async report(
    momentId: string,
    reason: ReportReason,
    details: string,
    requestToken?: string,
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.rpc('report_in_moment', {
      p_moment_id: momentId,
      p_reason: reason,
      p_details: details.trim() || null,
      p_request_token: requestToken ?? null,
    })
    return { error: error ? rpcError(error.message) : null }
  },

  async withdrawRequest(momentId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.rpc('withdraw_moment_request', { p_moment_id: momentId })
    return { error: error ? rpcError(error.message) : null }
  },
}

/**
 * Rencontres Service — profil Rencontres, photo, lieux ouverts.
 *
 * La photo est stockée dans le bucket privé « rencontre-photos » sous
 * {user_id}/… ; l'utilisateur ne peut créer d'URL signée que pour la sienne
 * (et, à partir du lot 4, pour celle de l'autre après double acceptation).
 */

import { supabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/utils'
import { WHY_TEXT_MAX } from '@/lib/constants'
import type { Place, RencontreIntention, RencontreProfile } from '@/lib/types'

const PHOTO_BUCKET = 'rencontre-photos'
const PHOTO_MAX_SIDE = 1024

export interface RencontreProfileInput {
  enabled: boolean
  intention: RencontreIntention
  first_name: string
  photo_path: string | null
  safety_contact_name: string | null
  safety_contact_phone: string | null
  principles_accepted_at: string | null
}

// ── Clé de rapprochement des lieux (OpenStreetMap / Nominatim) ───────────────

interface NominatimObject {
  osm_type?: 'node' | 'way' | 'relation'
  osm_id?: number
}

function toPlaceKey(obj: NominatimObject | null | undefined): string | null {
  if (!obj?.osm_type || !obj.osm_id) return null
  return `osm:${obj.osm_type[0].toUpperCase()}${obj.osm_id}`
}

async function nominatim(path: string): Promise<unknown> {
  const res = await fetch(`https://nominatim.openstreetmap.org/${path}`, {
    signal: AbortSignal.timeout(6000),
  })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  return res.json()
}

/**
 * Identifie le lieu dans OpenStreetMap : d'abord par son nom dans un rayon
 * d'environ 150 m (le café lui-même), sinon l'objet le plus proche des
 * coordonnées (souvent le bâtiment).
 */
async function resolvePlaceKey(place: Pick<Place, 'name' | 'latitude' | 'longitude'>): Promise<string | null> {
  const { latitude: lat, longitude: lng } = place
  const d = 0.0015
  try {
    const byName = await nominatim(
      `search?format=jsonv2&limit=1&bounded=1` +
      `&viewbox=${lng - d},${lat + d},${lng + d},${lat - d}` +
      `&q=${encodeURIComponent(place.name)}`,
    ) as NominatimObject[]
    const key = toPlaceKey(byName[0])
    if (key) return key
  } catch {
    // on tente la recherche inverse
  }
  try {
    const nearest = await nominatim(`reverse?format=jsonv2&zoom=18&lat=${lat}&lon=${lng}`) as NominatimObject
    return toPlaceKey(nearest)
  } catch {
    return null
  }
}

// ── Photo ────────────────────────────────────────────────────────────────────

/** Réduit l'image (côté le plus long ≤ 1024 px, JPEG) pour rester léger sur le Storage gratuit. */
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Image illisible.'))), 'image/jpeg', 0.85),
  )
}

// ── Service ──────────────────────────────────────────────────────────────────

export const rencontresService = {
  async getMyProfile(userId: string): Promise<RencontreProfile | null> {
    const { data, error } = await supabase
      .from('rencontre_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) { console.error('[rencontres] getMyProfile:', error.message); return null }
    return data as RencontreProfile | null
  },

  /** Crée le profil s'il n'existe pas, le met à jour sinon. */
  async saveProfile(
    userId: string,
    input: RencontreProfileInput,
  ): Promise<{ profile: RencontreProfile | null; error: string | null }> {
    try {
      const existing = await rencontresService.getMyProfile(userId)
      const query = existing
        ? supabase.from('rencontre_profiles').update(input).eq('user_id', userId).select().single()
        : supabase.from('rencontre_profiles').insert({ ...input, user_id: userId }).select().single()
      const { data, error } = await withTimeout(query, 25_000, 'Enregistrement du profil')
      if (error) return { profile: null, error: error.message }
      return { profile: data as RencontreProfile, error: null }
    } catch (e) {
      return { profile: null, error: e instanceof Error ? e.message : 'Erreur inattendue.' }
    }
  },

  /** Modifie quelques champs du profil (pause, photo…). */
  async updateProfile(
    userId: string,
    patch: Partial<RencontreProfileInput>,
  ): Promise<{ profile: RencontreProfile | null; error: string | null }> {
    const { data, error } = await supabase
      .from('rencontre_profiles')
      .update(patch)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) return { profile: null, error: error.message }
    return { profile: data as RencontreProfile, error: null }
  },

  /** Envoie la photo (réduite) et supprime l'ancienne. Renvoie le nouveau chemin. */
  async uploadPhoto(
    userId: string,
    file: File,
    previousPath: string | null,
  ): Promise<{ path: string | null; error: string | null }> {
    try {
      const blob = await resizeImage(file)
      const path = `${userId}/${Date.now()}.jpg`
      const { error } = await withTimeout(
        supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg' }),
        30_000,
        'Envoi de la photo',
      )
      if (error) return { path: null, error: error.message }
      if (previousPath && previousPath !== path) {
        await supabase.storage.from(PHOTO_BUCKET).remove([previousPath])
      }
      return { path, error: null }
    } catch (e) {
      return { path: null, error: e instanceof Error ? e.message : 'Envoi de la photo impossible.' }
    }
  },

  /** URL temporaire (1 h) d'une photo que l'utilisateur a le droit de voir. */
  async getPhotoUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600)
    if (error) return null
    return data.signedUrl
  },

  /**
   * Ouvre / ferme un lieu aux rencontres et enregistre son « pourquoi ».
   * À l'ouverture (ou si ses coordonnées ont changé), identifie le lieu dans
   * OpenStreetMap pour pouvoir le rapprocher des lieux des autres.
   */
  async setPlaceRencontre(
    place: Place,
    open: boolean,
    whyText: string,
    options: { forceResolve?: boolean } = {},
  ): Promise<{ place: Place | null; error: string | null }> {
    const why = whyText.trim().slice(0, WHY_TEXT_MAX) || null
    const update: Record<string, unknown> = {
      rencontre_open: open,
      why_text: why,
      updated_at: new Date().toISOString(),
    }

    if (open && (!place.place_key || options.forceResolve)) {
      const key = await resolvePlaceKey(place)
      if (!key) {
        return {
          place: null,
          error: 'Impossible d’identifier ce lieu sur la carte pour le moment. Vérifie ta connexion et réessaie.',
        }
      }
      update.place_key = key
    }

    const { data, error } = await supabase
      .from('places')
      .update(update)
      .eq('id', place.id)
      .eq('user_id', place.user_id)
      .select('rencontre_open, why_text, place_key, updated_at')
      .single()
    if (error) return { place: null, error: error.message }
    return { place: { ...place, ...(data as Pick<Place, 'rencontre_open' | 'why_text' | 'place_key' | 'updated_at'>) }, error: null }
  },
}

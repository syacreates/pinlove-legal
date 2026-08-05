/**
 * Social Import Service
 *
 * Simulates extraction of place data from a TikTok or Instagram post URL.
 *
 * Architecture note: The `SocialImportAdapter` interface is designed for
 * future real API integrations. Each platform will implement this interface.
 * The mock adapter uses the URL structure to generate plausible demo data.
 */

import type { ImportResult, SourcePlatform } from '@/lib/types'
import { detectPlatformFromUrl, extractPostIdFromUrl } from '@/lib/utils'

// ── Adapter interface (ready for real API integration) ────────────────────────
export interface SocialImportAdapter {
  platform: SourcePlatform
  canHandle(url: string): boolean
  extract(url: string): Promise<ImportResult>
}

// ── Mock data pools ───────────────────────────────────────────────────────────
const MOCK_PLACES_POOL = [
  {
    name: 'Chez Loulou',
    address: '14 Rue des Abbesses',
    city: 'Paris',
    country: 'France',
    category: 'restaurant' as const,
    description: 'Petit bistrot de quartier avec une terrasse animée et une cuisine du marché.',
    latitude: 48.8844,
    longitude: 2.3368,
    photo_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  },
  {
    name: 'Café Oberkampf',
    address: '3 Rue Neuve Popincourt',
    city: 'Paris',
    country: 'France',
    category: 'cafe' as const,
    description: 'Café branché du 11e, excellent pour le brunch le weekend.',
    latitude: 48.8614,
    longitude: 2.3778,
    photo_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
  },
  {
    name: 'Bar à Vins Le Cave',
    address: '56 Rue de la Roquette',
    city: 'Paris',
    country: 'France',
    category: 'bar' as const,
    description: 'Cave à vins naturels avec des planches de charcuterie et fromages.',
    latitude: 48.8541,
    longitude: 2.3750,
    photo_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80',
  },
  {
    name: 'Concept Store Merci',
    address: '111 Bd Beaumarchais',
    city: 'Paris',
    country: 'France',
    category: 'shop' as const,
    description: 'Concept store parisien incontournable : mode, déco, café et librairie.',
    latitude: 48.8602,
    longitude: 2.3645,
    photo_url: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&q=80',
  },
  {
    name: 'Hôtel National des Arts et Métiers',
    address: '243 Rue Saint-Martin',
    city: 'Paris',
    country: 'France',
    category: 'hotel' as const,
    description: 'Boutique hôtel design dans le Marais, avec bar et restaurant.',
    latitude: 48.8640,
    longitude: 2.3517,
    photo_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  },
  {
    name: 'Parc de la Villette',
    address: '211 Av. Jean Jaurès',
    city: 'Paris',
    country: 'France',
    category: 'park' as const,
    description: 'Grand parc urbain avec la Géode, le Zénith et des espaces verts.',
    latitude: 48.8937,
    longitude: 2.3948,
    photo_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80',
  },
]

// ── Real TikTok adapter (oEmbed API) ─────────────────────────────────────────
class TikTokAdapter implements SocialImportAdapter {
  platform: SourcePlatform = 'tiktok'

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('tiktok.com')
  }

  async extract(url: string): Promise<ImportResult> {
    const postId = extractPostIdFromUrl(url)

    try {
      const res = await fetch(
        `/api/tiktok/oembed?url=${encodeURIComponent(url)}`,
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return {
          status: 'error',
          platform: 'tiktok',
          post_id: postId,
          place_suggestion: null,
          confidence: 0,
          error_message: err.error ?? 'Vidéo TikTok introuvable ou privée.',
          raw_url: url,
        }
      }

      const data = await res.json()

      // title = légende complète de la vidéo (inclut les #hashtags)
      const title: string = data.title ?? ''
      const author: string = data.author_name ?? ''
      const thumbnail: string = data.thumbnail_url ?? null

      // Extraire les hashtags depuis la légende
      const hashtags = (title.match(/#[\w\u00C0-\u024F]+/g) ?? []).join(' ')
      // Description = légende sans les hashtags (texte pur)
      const descriptionRaw = title.replace(/#[\w\u00C0-\u024F]+/g, '').trim()
      const description = [descriptionRaw, hashtags].filter(Boolean).join('\n')

      return {
        status: 'found',
        platform: 'tiktok',
        post_id: postId,
        place_suggestion: {
          name: '',           // L'utilisateur complète
          address: '',        // L'utilisateur complète
          city: '',           // L'utilisateur complète
          country: 'France',
          category: 'other',
          description,
          note: `Via @${author} sur TikTok`,
          photo_url: thumbnail || undefined,
          latitude: 48.8566,
          longitude: 2.3522,
          source: {
            platform: 'tiktok',
            url,
            post_id: postId,
            parsed_at: new Date().toISOString(),
            confidence: 0.6,
          },
        },
        confidence: 0.6,
        error_message: null,
        raw_url: url,
      }
    } catch {
      return {
        status: 'error',
        platform: 'tiktok',
        post_id: postId,
        place_suggestion: null,
        confidence: 0,
        error_message: 'Impossible d\'analyser cette vidéo TikTok.',
        raw_url: url,
      }
    }
  }
}

// ── Real Instagram adapter (Meta oEmbed API) ──────────────────────────────────
class InstagramAdapter implements SocialImportAdapter {
  platform: SourcePlatform = 'instagram'

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('instagram.com')
  }

  async extract(url: string): Promise<ImportResult> {
    const postId = extractPostIdFromUrl(url)

    try {
      const res = await fetch(
        `/api/instagram/oembed?url=${encodeURIComponent(url)}`,
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return {
          status: 'error',
          platform: 'instagram',
          post_id: postId,
          place_suggestion: null,
          confidence: 0,
          error_message: err.error ?? 'Post Instagram introuvable ou privé.',
          raw_url: url,
        }
      }

      const data = await res.json()

      const title: string     = data.title ?? ''
      const author: string    = data.author_name ?? ''
      const thumbnail: string = data.thumbnail_url ?? null

      const hashtags      = (title.match(/#[\w\u00C0-\u024F]+/g) ?? []).join(' ')
      const descriptionRaw = title.replace(/#[\w\u00C0-\u024F]+/g, '').trim()
      const description   = [descriptionRaw, hashtags].filter(Boolean).join('\n')

      return {
        status: 'found',
        platform: 'instagram',
        post_id: postId,
        place_suggestion: {
          name: '',
          address: '',
          city: '',
          country: 'France',
          category: 'other',
          description,
          note: `Via @${author} sur Instagram`,
          photo_url: thumbnail || undefined,
          latitude: 48.8566,
          longitude: 2.3522,
          source: {
            platform: 'instagram',
            url,
            post_id: postId,
            parsed_at: new Date().toISOString(),
            confidence: 0.6,
          },
        },
        confidence: 0.6,
        error_message: null,
        raw_url: url,
      }
    } catch {
      return {
        status: 'error',
        platform: 'instagram',
        post_id: postId,
        place_suggestion: null,
        confidence: 0,
        error_message: 'Impossible d\'analyser ce post Instagram.',
        raw_url: url,
      }
    }
  }
}

// ── Registry of adapters ──────────────────────────────────────────────────────
const adapters: SocialImportAdapter[] = [
  new TikTokAdapter(),
  new InstagramAdapter(),
]

// ── Public service ────────────────────────────────────────────────────────────
export const socialImportService = {
  /**
   * Analyse a social URL and return an ImportResult.
   * Returns an error result if the URL is not a supported social platform.
   */
  async importFromUrl(url: string): Promise<ImportResult> {
    const trimmed = url.trim()

    if (!trimmed) {
      return errorResult(trimmed, 'URL vide.')
    }

    const adapter = adapters.find(a => a.canHandle(trimmed))

    if (!adapter) {
      return errorResult(trimmed, 'URL non reconnue. Colle un lien TikTok ou Instagram.')
    }

    try {
      return await adapter.extract(trimmed)
    } catch {
      return errorResult(trimmed, 'Erreur lors de l\'analyse du lien. Réessaie plus tard.')
    }
  },

  /** Detect the platform from a URL without extracting data. */
  detectPlatform(url: string): SourcePlatform | null {
    return detectPlatformFromUrl(url)
  },

  /**
   * Register a new adapter (for future real API integration).
   * Call this to add Instagram Graph API or TikTok API adapters.
   */
  registerAdapter(adapter: SocialImportAdapter): void {
    // Remove existing mock adapter for the same platform
    const idx = adapters.findIndex(a => a.platform === adapter.platform)
    if (idx !== -1) adapters.splice(idx, 1)
    adapters.unshift(adapter) // Prefer the new adapter
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function errorResult(url: string, message: string): ImportResult {
  return {
    status: 'error',
    platform: detectPlatformFromUrl(url) ?? 'other',
    post_id: null,
    place_suggestion: null,
    confidence: 0,
    error_message: message,
    raw_url: url,
  }
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

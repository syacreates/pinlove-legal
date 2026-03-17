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

// ── Mock TikTok adapter ───────────────────────────────────────────────────────
class TikTokMockAdapter implements SocialImportAdapter {
  platform: SourcePlatform = 'tiktok'

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('tiktok.com')
  }

  async extract(url: string): Promise<ImportResult> {
    await delay(1200) // Simulate network + AI extraction

    const postId = extractPostIdFromUrl(url)

    // Simulate ~75% success rate for location detection
    const hasLocation = Math.random() > 0.25

    if (!hasLocation) {
      return {
        status: 'not_found',
        platform: 'tiktok',
        post_id: postId,
        place_suggestion: null,
        confidence: 0,
        error_message: null,
        raw_url: url,
      }
    }

    const mockPlace = MOCK_PLACES_POOL[
      Math.floor(Math.random() * MOCK_PLACES_POOL.length)
    ]
    const confidence = 0.65 + Math.random() * 0.30 // 0.65–0.95

    return {
      status: 'found',
      platform: 'tiktok',
      post_id: postId,
      place_suggestion: {
        ...mockPlace,
        source: {
          platform: 'tiktok',
          url,
          post_id: postId,
          parsed_at: new Date().toISOString(),
          confidence,
        },
      },
      confidence,
      error_message: null,
      raw_url: url,
    }
  }
}

// ── Mock Instagram adapter ────────────────────────────────────────────────────
class InstagramMockAdapter implements SocialImportAdapter {
  platform: SourcePlatform = 'instagram'

  canHandle(url: string): boolean {
    return url.toLowerCase().includes('instagram.com')
  }

  async extract(url: string): Promise<ImportResult> {
    await delay(900) // Instagram slightly faster in the mock

    const postId = extractPostIdFromUrl(url)

    // Instagram posts often have location tags → higher success rate
    const hasLocation = Math.random() > 0.15

    if (!hasLocation) {
      return {
        status: 'not_found',
        platform: 'instagram',
        post_id: postId,
        place_suggestion: null,
        confidence: 0,
        error_message: null,
        raw_url: url,
      }
    }

    const mockPlace = MOCK_PLACES_POOL[
      Math.floor(Math.random() * MOCK_PLACES_POOL.length)
    ]
    const confidence = 0.72 + Math.random() * 0.25 // 0.72–0.97

    return {
      status: 'found',
      platform: 'instagram',
      post_id: postId,
      place_suggestion: {
        ...mockPlace,
        source: {
          platform: 'instagram',
          url,
          post_id: postId,
          parsed_at: new Date().toISOString(),
          confidence,
        },
      },
      confidence,
      error_message: null,
      raw_url: url,
    }
  }
}

// ── Registry of adapters ──────────────────────────────────────────────────────
const adapters: SocialImportAdapter[] = [
  new TikTokMockAdapter(),
  new InstagramMockAdapter(),
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

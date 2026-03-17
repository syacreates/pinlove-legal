import type { PlaceCategory } from './types'

// ── Freemium limits ───────────────────────────────────────────────────────────
export const FREE_PLAN_LIMIT = 5
export const PREMIUM_PRICE_EUR = 9.99
export const PREMIUM_PRICE_DISPLAY = '9,99 €'

// ── Place categories with display metadata ────────────────────────────────────
export const PLACE_CATEGORIES: Record<
  PlaceCategory,
  { label: string; emoji: string; color: string }
> = {
  restaurant: { label: 'Restaurant',   emoji: '🍽️',  color: '#FF6B6B' },
  cafe:        { label: 'Café',         emoji: '☕',   color: '#F4A261' },
  bar:         { label: 'Bar',          emoji: '🍸',   color: '#A855F7' },
  shop:        { label: 'Shopping',     emoji: '🛍️',  color: '#EC4899' },
  hotel:       { label: 'Hôtel',        emoji: '🏨',   color: '#3B82F6' },
  museum:      { label: 'Musée / Art',  emoji: '🎨',   color: '#10B981' },
  park:        { label: 'Parc / Nature',emoji: '🌿',   color: '#22C55E' },
  beach:       { label: 'Plage',        emoji: '🏖️',  color: '#06B6D4' },
  activity:    { label: 'Activité',     emoji: '🎯',   color: '#F59E0B' },
  other:       { label: 'Autre',        emoji: '📍',   color: '#8E8E93' },
}

// ── Visibility options ────────────────────────────────────────────────────────
export const VISIBILITY_OPTIONS = [
  {
    value:       'private' as const,
    label:       'Privé',
    description: 'Visible uniquement par toi',
    icon:        'Lock',
  },
  {
    value:       'friends' as const,
    label:       'Amis',
    description: 'Partagé avec tes amis PinLove',
    icon:        'Users',
  },
  {
    value:       'public' as const,
    label:       'Public',
    description: 'Visible par tous',
    icon:        'Globe',
  },
]

// ── Routes ───────────────────────────────────────────────────────────────────
export const ROUTES = {
  SPLASH:     '/',
  ONBOARDING: '/onboarding',
  LOGIN:      '/login',
  SIGNUP:     '/signup',
  RESET_PWD:  '/reset-password',
  HOME:       '/home',
  MAP:        '/map',
  ADD:        '/add',
  IMPORT:     '/import',
  PLACES:     '/places',
  PLACE:      (id: string) => `/places/${id}`,
  FRIENDS:    '/friends',
  PROFILE:    '/profile',
  PRICING:    '/pricing',
} as const

// ── Demo / Paris bounding box ─────────────────────────────────────────────────
export const DEFAULT_MAP_CENTER = { lat: 48.8566, lng: 2.3522 } // Paris
export const DEFAULT_MAP_ZOOM   = 13

// ── Source platforms ──────────────────────────────────────────────────────────
export const SOURCE_PLATFORMS = {
  tiktok:    { label: 'TikTok',    color: '#010101', textColor: '#ffffff' },
  instagram: { label: 'Instagram', color: '#E1306C', textColor: '#ffffff' },
  manual:    { label: 'Manuel',    color: '#FF3D5A', textColor: '#ffffff' },
  other:     { label: 'Autre',     color: '#8E8E93', textColor: '#ffffff' },
}

// ── Premium features ──────────────────────────────────────────────────────────
export const PREMIUM_FEATURES = [
  { icon: '📍', label: 'Adresses illimitées',           sub: 'Enregistre autant de lieux que tu veux' },
  { icon: '👥', label: 'Partage avec tes amis',         sub: 'Partage tes spots favoris' },
  { icon: '🔒', label: 'Contrôle total de la visibilité', sub: 'Privé, amis ou public' },
  { icon: '⚡', label: 'Import prioritaire',             sub: 'Analyse de lien plus rapide' },
  { icon: '🗺️', label: 'Carte sans limite',              sub: 'Tous tes spots sur la carte' },
]

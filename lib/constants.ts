import type { PlaceCategory, RencontreIntention, ReportReason } from './types'

// ── Theme ──────────────────────────────────────────────────────────────────────
// Kept in this plain (non "use client") module rather than lib/theme.ts so the
// blocking init script in the root server layout can read the literal value at
// build time — importing it from a "use client" module there would pull in a
// client-reference proxy instead of the actual string.
export const THEME_STORAGE_KEY = 'pinlove-theme'

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
  PLACE_EDIT: (id: string) => `/places/${id}/edit`,
  FRIENDS:    '/friends',
  PROFILE:    '/profile',
  PRICING:    '/pricing',
  RENCONTRES:            '/rencontres',
  RENCONTRES_ONBOARDING: '/rencontres/onboarding',
  RENCONTRES_LIEUX:      '/rencontres/lieux',
  RENCONTRES_REGLAGES:   '/rencontres/reglages',
  RENCONTRES_NEW_MOMENT: '/rencontres/moments/nouveau',
  RENCONTRES_MOMENT:     (id: string) => `/rencontres/moments/${id}`,
  RENCONTRES_MES:        '/rencontres/mes-rencontres',
  RENCONTRES_JOUR_J:     (id: string) => `/rencontres/moments/${id}/jour-j`,
  RENCONTRES_NOTIFS:     '/rencontres/notifications',
} as const

// ── Mode Rencontres ───────────────────────────────────────────────────────────
export const RENCONTRE_INTENTIONS: Record<
  RencontreIntention,
  { label: string; description: string }
> = {
  amical: { label: 'Amical',        description: 'Se faire des ami·es autour de lieux qu’on aime' },
  ouvert: { label: 'Ouvert à plus', description: 'Une rencontre amicale… ou plus si affinités' },
  pro:    { label: 'Pro',           description: 'Échanger, réseauter, partager un métier' },
}

export const WHY_TEXT_MAX = 140

export const MOMENT_TITLE_MAX = 80
export const REPORT_REASONS: Record<ReportReason, string> = {
  comportement: 'Comportement déplacé',
  harcelement:  'Harcèlement',
  securite:     'Je ne me suis pas senti·e en sécurité',
  absence:      'Absence sans prévenir',
  faux_profil:  'Faux profil',
  autre:        'Autre',
}

export const HINT_MAX = 140
export const CHECK_IN_RADIUS_M = 150

/** Annulation à moins de 12 h du début : fiabilité −10 */
export const LATE_CANCEL_HOURS = 12
export const MOMENT_DURATIONS = [30, 60, 90, 120] as const

export const RENCONTRE_PRINCIPLES = [
  { title: 'Le moment avant la personne', text: 'Tu rejoins une sortie dans un lieu, pas un profil. Pas de swipe.' },
  { title: 'Même intention',              text: 'Amical, ouvert à plus ou pro : tu ne croises que des personnes qui cherchent la même chose.' },
  { title: 'Révélation progressive',      text: 'D’abord vos lieux communs et pourquoi vous les aimez, puis le prénom. La photo, seulement après double acceptation.' },
  { title: 'Pas de chat avant',           text: 'On propose des créneaux, c’est tout. Le chat s’ouvre le jour J, juste pour se retrouver.' },
  { title: 'Lieux publics, sécurité native', text: 'Toujours dans un lieu public. Ton contact de confiance est prévenu, un bouton d’alerte reste à portée.' },
  { title: 'Aucun rejet visible',         text: 'Un refus n’est jamais notifié. Sans réponse, un moment expire simplement.' },
  { title: 'Tes lieux restent privés',    text: 'Privés par défaut. Seuls ceux que tu ouvres servent aux rencontres, et personne ne voit ta liste : seulement les lieux en commun.' },
] as const

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

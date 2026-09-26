// ─── Core domain types for PinLove ───────────────────────────────────────────

// ── User ─────────────────────────────────────────────────────────────────────

export type UserPlan = 'free' | 'premium'

export interface User {
  id: string
  email: string
  username: string
  full_name: string
  avatar_url: string | null
  plan: UserPlan
  premium_purchased_at: string | null
  created_at: string
  updated_at: string
}

// ── Place visibility ──────────────────────────────────────────────────────────

export type PlaceVisibility = 'private' | 'friends' | 'public'

export type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'shop'
  | 'hotel'
  | 'museum'
  | 'park'
  | 'beach'
  | 'activity'
  | 'other'

// ── Import source ─────────────────────────────────────────────────────────────

export type SourcePlatform = 'tiktok' | 'instagram' | 'manual' | 'other'

export interface ImportSource {
  platform: SourcePlatform
  url: string
  post_id: string | null
  parsed_at: string
  /** 0–1 confidence score from the mocked extractor */
  confidence: number
}

// ── Place ─────────────────────────────────────────────────────────────────────

export interface Place {
  id: string
  user_id: string
  name: string
  address: string
  postal_code: string | null
  city: string
  country: string
  category: PlaceCategory
  description: string | null
  note: string | null
  photo_url: string | null
  latitude: number
  longitude: number
  visibility: PlaceVisibility
  is_favorite: boolean
  /** Array of friend user IDs this place is explicitly shared with */
  shared_with_friend_ids: string[]
  source: ImportSource | null
  /** Mode Rencontres : lieu « ouvert » aux rencontres (privé par défaut) */
  rencontre_open: boolean
  /** Pourquoi j'aime ce lieu (≤ 140 caractères) */
  why_text: string | null
  /** Clé de rapprochement entre utilisateurs (OpenStreetMap, ex. « osm:N123 ») */
  place_key: string | null
  created_at: string
  updated_at: string
  /** Resolved user (joined for display) */
  user?: Pick<User, 'id' | 'username' | 'full_name' | 'avatar_url'>
}

// ── Mode Rencontres ───────────────────────────────────────────────────────────

export type RencontreIntention = 'amical' | 'ouvert' | 'pro'

export type MomentStatus = 'open' | 'matched' | 'confirmed' | 'done' | 'cancelled' | 'expired'

export type MomentRole = 'creator' | 'guest'

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed'

/** Profil Rencontres (table rencontre_profiles) — lisible uniquement par son propriétaire. */
export interface RencontreProfile {
  user_id: string
  enabled: boolean
  intention: RencontreIntention
  first_name: string
  /** Chemin dans le bucket privé « rencontre-photos » */
  photo_path: string | null
  reliability_score: number
  safety_contact_name: string | null
  safety_contact_phone: string | null
  principles_accepted_at: string | null
  /** Hors périmètre V1 (vérification selfie) */
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface Moment {
  id: string
  creator_id: string
  source_place_id: string | null
  place_key: string
  place_name: string
  place_address: string | null
  latitude: number
  longitude: number
  intention: RencontreIntention
  title: string
  duration_min: number
  /** 2 à 3 horodatages ISO 8601 */
  proposed_slots: string[]
  /** Créneau retenu après double acceptation */
  scheduled_at: string | null
  status: MomentStatus
  expires_at: string
  payment_rule: 'Chacun sa part'
  cancelled_by: string | null
  cancelled_at: string | null
  shared_memory_created_at: string | null
  /** Hors périmètre V1 (partenariats lieux) */
  partner_id: string | null
  created_at: string
  updated_at: string
}

export interface MomentParticipant {
  moment_id: string
  user_id: string
  role: MomentRole
  accepted_at: string | null
  chosen_slot: string | null
  confirmed_eve_at: string | null
  checked_in_at: string | null
  hint_text: string | null
  wants_shared_memory: boolean
  created_at: string
}

/** Lieu ouvert commun à deux personnes (jamais la liste complète de l'autre). */
export interface CommonPlace {
  place_key: string
  /** Nom du lieu chez moi */
  place_name: string
  my_why: string | null
  their_why: string | null
  /** Poids dans le score (rareté × bonus « pourquoi ») */
  weight: number
}

/** Suggestion de personne : prénom et lieux communs, sans photo ni identifiant. */
export interface PersonSuggestion {
  first_name: string
  intention: RencontreIntention
  score: number
  common_places: CommonPlace[]
}

/** Moment du fil « Moments dans tes lieux ». */
export interface FeedMoment {
  id: string
  title: string
  place_key: string
  place_name: string
  place_address: string | null
  duration_min: number
  proposed_slots: string[]
  expires_at: string
  payment_rule: string
  intention: RencontreIntention
  creator_first_name: string
  creator_why: string | null
  common_places: CommonPlace[]
  score: number
  /** Créneau que j'ai choisi, si j'ai déjà répondu */
  my_chosen_slot: string | null
  created_at: string
}

/** Détail d'un moment tel que renvoyé par get_moment (avant double acceptation : pas de photo). */
export interface MomentDetail {
  id: string
  title: string
  status: MomentStatus
  place_key: string
  place_name: string
  place_address: string | null
  latitude: number
  longitude: number
  duration_min: number
  proposed_slots: string[]
  scheduled_at: string | null
  expires_at: string
  payment_rule: string
  intention: RencontreIntention
  created_at: string
  my_role: MomentRole | null
  my_chosen_slot: string | null
  creator_first_name: string
  creator_why: string | null
  common_places: CommonPlace[]
  /** Nombre de demandes reçues (créateur uniquement) */
  request_count: number | null
}

export interface MomentMessage {
  id: string
  moment_id: string
  sender_id: string
  body: string
  created_at: string
}

/** Jamais lisible par to_user. */
export interface Feedback {
  id: string
  moment_id: string
  from_user: string
  to_user: string
  would_meet_again: boolean
  went_well: boolean
  report_reason: string | null
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  moment_id: string | null
  reason: string
  details: string | null
  status: ReportStatus
  reviewed_at: string | null
  created_at: string
}

export interface AppNotification {
  id: string
  user_id: string
  type: string
  moment_id: string | null
  payload: Record<string, unknown>
  read_at: string | null
  pushed_at: string | null
  created_at: string
}

// ── Friend connection ─────────────────────────────────────────────────────────

export type FriendshipStatus = 'pending' | 'accepted' | 'declined'

export interface FriendConnection {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  invite_token: string | null
  created_at: string
  updated_at: string
  /** Resolved friend profile */
  friend?: Pick<User, 'id' | 'username' | 'full_name' | 'avatar_url' | 'plan'>
}

// ── Premium purchase ──────────────────────────────────────────────────────────

export interface PremiumPurchase {
  id: string
  user_id: string
  stripe_payment_intent_id: string
  amount_cents: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed'
  created_at: string
}

// ── Social import ─────────────────────────────────────────────────────────────

export type ImportStatus = 'idle' | 'loading' | 'success' | 'no_location' | 'error'

export interface ImportResult {
  status: 'found' | 'not_found' | 'error'
  platform: SourcePlatform
  post_id: string | null
  place_suggestion: Partial<Place> | null
  confidence: number
  error_message: string | null
  raw_url: string
}

// ── UI state helpers ──────────────────────────────────────────────────────────

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AppError {
  code: string
  message: string
}

export interface Pagination {
  page: number
  per_page: number
  total: number
  has_more: boolean
}

// ── Map ───────────────────────────────────────────────────────────────────────

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface Coordinates {
  lat: number
  lng: number
}

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
  city: string
  country: string
  category: PlaceCategory
  description: string | null
  note: string | null
  photo_url: string | null
  latitude: number
  longitude: number
  visibility: PlaceVisibility
  /** Array of friend user IDs this place is explicitly shared with */
  shared_with_friend_ids: string[]
  source: ImportSource | null
  created_at: string
  updated_at: string
  /** Resolved user (joined for display) */
  user?: Pick<User, 'id' | 'username' | 'full_name' | 'avatar_url'>
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

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { PlaceCategory, SourcePlatform } from './types'
import { PLACE_CATEGORIES, SOURCE_PLATFORMS } from './constants'

// ── Tailwind class merge helper ───────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date helpers ──────────────────────────────────────────────────────────────
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(date))
}

// ── Place helpers ─────────────────────────────────────────────────────────────
export function getCategoryMeta(category: PlaceCategory) {
  return PLACE_CATEGORIES[category] ?? PLACE_CATEGORIES.other
}

export function getPlatformMeta(platform: SourcePlatform) {
  return SOURCE_PLATFORMS[platform] ?? SOURCE_PLATFORMS.other
}

// ── URL / social link helpers ─────────────────────────────────────────────────
export function detectPlatformFromUrl(url: string): SourcePlatform | null {
  if (!url) return null
  const lower = url.toLowerCase()
  if (lower.includes('tiktok.com'))    return 'tiktok'
  if (lower.includes('instagram.com')) return 'instagram'
  return null
}

export function isValidSocialUrl(url: string): boolean {
  return detectPlatformFromUrl(url) !== null
}

export function extractPostIdFromUrl(url: string): string | null {
  // TikTok: https://www.tiktok.com/@user/video/1234567890
  const tiktokMatch = url.match(/\/video\/(\d+)/)
  if (tiktokMatch) return tiktokMatch[1]

  // Instagram: https://www.instagram.com/p/ABC123/
  const igMatch = url.match(/\/p\/([A-Za-z0-9_-]+)/)
  if (igMatch) return igMatch[1]

  // Reel
  const reelMatch = url.match(/\/reel\/([A-Za-z0-9_-]+)/)
  if (reelMatch) return reelMatch[1]

  return null
}

// ── Distance helpers ──────────────────────────────────────────────────────────
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371 // Earth radius in km
  const dLat = deg2rad(lat2 - lat1)
  const dLng = deg2rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

// ── Invitation link ───────────────────────────────────────────────────────────
export function buildInviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pinlove.app'
  return `${base}/invite/${token}`
}

// ── Random / id helpers ───────────────────────────────────────────────────────
export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

export function generateToken(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

// ── Truncate helper ───────────────────────────────────────────────────────────
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}

// ── Pluralize helper ──────────────────────────────────────────────────────────
export function plural(n: number, singular: string, pluralStr?: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${pluralStr ?? singular + 's'}`
}

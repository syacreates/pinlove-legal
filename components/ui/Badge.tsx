import { cn } from '@/lib/utils'
import type { PlaceCategory, PlaceVisibility, SourcePlatform } from '@/lib/types'
import { PLACE_CATEGORIES, SOURCE_PLATFORMS, VISIBILITY_OPTIONS } from '@/lib/constants'

// ── Category badge ────────────────────────────────────────────────────────────
export function CategoryBadge({ category }: { category: PlaceCategory }) {
  const meta = PLACE_CATEGORIES[category]
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"
    >
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  )
}

// ── Platform badge ────────────────────────────────────────────────────────────
export function PlatformBadge({ platform }: { platform: SourcePlatform }) {
  const meta = SOURCE_PLATFORMS[platform]
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: meta.color, color: meta.textColor }}
    >
      {platform === 'tiktok' && <TikTokIcon />}
      {platform === 'instagram' && <InstagramIcon />}
      {meta.label}
    </span>
  )
}

// ── Visibility badge ──────────────────────────────────────────────────────────
export function VisibilityBadge({ visibility }: { visibility: PlaceVisibility }) {
  const styles: Record<PlaceVisibility, string> = {
    private: 'bg-neutral-100 text-neutral-600',
    friends: 'bg-blue-50 text-blue-600',
    public:  'bg-green-50 text-green-600',
  }
  const labels: Record<PlaceVisibility, string> = {
    private: '🔒 Privé',
    friends: '👥 Amis',
    public:  '🌍 Public',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', styles[visibility])}>
      {labels[visibility]}
    </span>
  )
}

// ── Plan badge ────────────────────────────────────────────────────────────────
export function PlanBadge({ plan }: { plan: 'free' | 'premium' }) {
  if (plan === 'free') return null
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-brand-500 to-brand-400 text-white">
      ✦ Premium
    </span>
  )
}

// ── Generic badge ─────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  color?: string
  className?: string
}
export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700',
        className,
      )}
    >
      {children}
    </span>
  )
}

// ── Inline brand icons ────────────────────────────────────────────────────────
function TikTokIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.77a8.17 8.17 0 004.79 1.53V6.86a4.85 4.85 0 01-1.02-.17z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

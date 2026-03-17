'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Navigation, Clock, Heart } from 'lucide-react'
import { cn, getCategoryMeta, timeAgo } from '@/lib/utils'
import { VisibilityBadge, CategoryBadge, PlatformBadge } from './Badge'
import type { Place } from '@/lib/types'
import { ROUTES } from '@/lib/constants'

interface PlaceCardProps {
  place: Place
  showUser?: boolean
  showDistance?: boolean
  distanceKm?: number
  className?: string
  compact?: boolean
  onToggleFavorite?: (id: string) => void
}

export function PlaceCard({
  place,
  showUser = false,
  showDistance = false,
  distanceKm,
  className,
  compact = false,
  onToggleFavorite,
}: PlaceCardProps) {
  const meta = getCategoryMeta(place.category)

  return (
    <Link
      href={ROUTES.PLACE(place.id)}
      className={cn(
        'block bg-white rounded-3xl shadow-card overflow-hidden',
        'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98]',
        className,
      )}
    >
      {/* Photo */}
      {place.photo_url && !compact && (
        <div className="relative h-44 bg-neutral-100">
          <Image
            src={place.photo_url}
            alt={place.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 400px"
            unoptimized
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {/* Visibility badge top-right */}
          <div className="absolute top-3 right-3">
            <VisibilityBadge visibility={place.visibility} />
          </div>
          {/* Platform badge top-left */}
          {place.source && (
            <div className="absolute top-3 left-3">
              <PlatformBadge platform={place.source.platform} />
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">{meta.emoji}</span>
            <h3 className="font-semibold text-neutral-900 truncate leading-tight">
              {place.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {compact && <VisibilityBadge visibility={place.visibility} />}
            {onToggleFavorite && (
              <button
                type="button"
                onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(place.id) }}
                className="p-1 -m-1 rounded-full transition-transform active:scale-90"
                aria-label={place.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart
                  className={cn(
                    'w-4 h-4 transition-colors',
                    place.is_favorite ? 'fill-brand-500 text-brand-500' : 'text-neutral-300',
                  )}
                />
              </button>
            )}
            {!onToggleFavorite && place.is_favorite && (
              <Heart className="w-4 h-4 fill-brand-500 text-brand-500 flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-brand-400" />
          <span className="truncate">
            {place.address}{place.postal_code ? `, ${place.postal_code}` : ''} {place.city}
          </span>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2">
          <CategoryBadge category={place.category} />

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            {showDistance && distanceKm !== undefined && (
              <span className="flex items-center gap-1 text-brand-500 font-medium">
                <Navigation className="w-3 h-3" />
                {distanceKm < 1
                  ? `${Math.round(distanceKm * 1000)} m`
                  : `${distanceKm.toFixed(1)} km`}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(place.created_at)}
            </span>
          </div>
        </div>

        {/* Note preview */}
        {place.note && !compact && (
          <p className="mt-3 text-xs text-neutral-500 line-clamp-2 italic border-t border-neutral-50 pt-3">
            💬 {place.note}
          </p>
        )}
      </div>
    </Link>
  )
}

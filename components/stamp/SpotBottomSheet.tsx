import { Heart, Navigation, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CategoryBadge, PlatformBadge } from '@/components/ui/Badge'
import { getCategoryMeta } from '@/lib/utils'
import type { Place } from '@/lib/types'

interface SpotBottomSheetProps {
  place: Place
  onNavigate: () => void
  onViewDetail: () => void
  onToggleFavorite?: () => void
  onClose: () => void
  className?: string
}

/** Paper "ticket" bottom sheet showing the selected map pin's place. */
export function SpotBottomSheet({
  place,
  onNavigate,
  onViewDetail,
  onToggleFavorite,
  onClose,
}: SpotBottomSheetProps) {
  const meta = getCategoryMeta(place.category)

  return (
    <div className="absolute bottom-[80px] left-4 right-4 z-30 bg-paper rounded-t-[22px] rounded-b-3xl shadow-modal p-4 pt-3 animate-slide-up border-t-2 border-dashed border-brass-dim">
      <div className="w-[34px] h-1 rounded-full bg-ink/15 mx-auto mb-3" />

      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-7 h-7 bg-ink/5 rounded-full flex items-center justify-center"
        aria-label="Fermer"
      >
        <X className="w-3.5 h-3.5 text-ink/60" />
      </button>

      <div className="flex items-center gap-3">
        <div
          className="w-[52px] h-[52px] rounded-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #E7B34A, #E63B77)' }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-display font-extrabold uppercase text-[17px] leading-tight text-ink truncate">
            {place.name}
          </p>
          <p className="font-mono text-[10.5px] text-brass-dim truncate uppercase">
            {meta.label} · {place.city}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <CategoryBadge category={place.category} tone="light" />
            {place.source && <PlatformBadge platform={place.source.platform} />}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3.5">
        <Button
          size="sm"
          className="flex-1 !bg-ink !text-paper hover:!bg-ink/90"
          leftIcon={<Navigation className="w-3.5 h-3.5" />}
          onClick={onNavigate}
        >
          Itinéraire
        </Button>
        <Button size="sm" variant="secondary" className="flex-1" onClick={onViewDetail}>
          Détail
        </Button>
        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className="w-11 h-11 flex-shrink-0 rounded-xl border-[1.4px] border-dashed border-brass-dim flex items-center justify-center"
            aria-label={place.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart className={place.is_favorite ? 'w-4 h-4 fill-cerise text-cerise' : 'w-4 h-4 text-ink/50'} />
          </button>
        )}
      </div>
    </div>
  )
}

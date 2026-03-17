'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Navigation, Trash2, Edit3,
  Share2, ExternalLink, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CategoryBadge, VisibilityBadge, PlatformBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { useAppStore } from '@/stores/app.store'
import { placesService } from '@/services/places.service'
import { mapService } from '@/services/map.service'
import type { Place } from '@/lib/types'
import { formatDate, getCategoryMeta } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'

export default function PlaceDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const user      = useAuthStore(s => s.user)!
  const deletePlace = usePlacesStore(s => s.deletePlace)
  const addToast  = useAppStore(s => s.addToast)

  const [place,       setPlace]       = useState<Place | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [navigating,  setNavigating]  = useState(false)

  useEffect(() => {
    placesService.getPlace(id).then(p => {
      setPlace(p)
      setLoading(false)
    })
  }, [id])

  async function handleNavigate() {
    if (!place) return
    setNavigating(true)
    const { coords } = await mapService.getCurrentPosition()
    const url = mapService.buildDirectionsUrl(
      { lat: place.latitude, lng: place.longitude },
      place.name,
      coords,
    )
    window.open(url, '_blank')
    setNavigating(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await deletePlace(id, user.id)
    setDeleting(false)
    if (error) {
      addToast({ type: 'error', message: error })
    } else {
      addToast({ type: 'success', message: 'Lieu supprimé.' })
      router.replace(ROUTES.PLACES)
    }
  }

  async function handleShare() {
    if (!place) return
    const text = `${place.name} — ${place.address}, ${place.city}`
    if (navigator.share) {
      await navigator.share({ title: place.name, text, url: window.location.href })
    } else {
      await navigator.clipboard.writeText(text)
      addToast({ type: 'success', message: 'Adresse copiée !' })
    }
  }

  if (loading) {
    return (
      <div className="screen-scroll flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!place) {
    return (
      <div className="screen-scroll flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">🗺️</div>
        <h2 className="text-lg font-semibold mb-2">Lieu introuvable</h2>
        <Link href={ROUTES.PLACES} className="text-brand-500 text-sm">
          ← Retour à mes lieux
        </Link>
      </div>
    )
  }

  const meta = getCategoryMeta(place.category)

  return (
    <div className="screen-scroll">
      {/* Hero image */}
      <div className="relative h-72 bg-neutral-200">
        {place.photo_url ? (
          <Image
            src={place.photo_url}
            alt={place.name}
            fill
            className="object-cover"
            sizes="640px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
            <span className="text-7xl opacity-60">{meta.emoji}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Share + delete */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleShare}
            className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {place.user_id === user.id && (
            <button
              onClick={() => setDeleteModal(true)}
              className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom badges */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {place.source && <PlatformBadge platform={place.source.platform} />}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-5 space-y-4">
        {/* Name + category */}
        <div>
          <div className="flex items-start gap-2 mb-2">
            <span className="text-3xl">{meta.emoji}</span>
            <h1 className="text-2xl font-bold text-neutral-900 leading-tight">{place.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <CategoryBadge category={place.category} />
            <VisibilityBadge visibility={place.visibility} />
          </div>
        </div>

        {/* Address */}
        <div className="bg-neutral-50 rounded-2xl p-4 flex items-start gap-3">
          <MapPin className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-neutral-900">{place.address}</p>
            <p className="text-sm text-neutral-500">{place.city}, {place.country}</p>
          </div>
        </div>

        {/* Navigate CTA */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={navigating}
          leftIcon={<Navigation className="w-4 h-4" />}
          onClick={handleNavigate}
        >
          Y aller
        </Button>

        {/* Description */}
        {place.description && (
          <div>
            <h3 className="font-semibold text-neutral-900 mb-1.5">Description</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">{place.description}</p>
          </div>
        )}

        {/* Personal note */}
        {place.note && (
          <div className="bg-amber-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">💬 Ma note</p>
            <p className="text-sm text-amber-900 italic">{place.note}</p>
          </div>
        )}

        {/* Source link */}
        {place.source && (
          <div className="border border-neutral-100 rounded-2xl p-4 flex items-center gap-3">
            <PlatformBadge platform={place.source.platform} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-500 mb-0.5">Source</p>
              <p className="text-sm font-medium text-neutral-700 truncate">{place.source.url}</p>
            </div>
            <a
              href={place.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-brand-500 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Ajouté le {formatDate(place.created_at)}</span>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Supprimer ce lieu ?"
      >
        <p className="text-sm text-neutral-600 mb-6">
          Cette action est irréversible. Le lieu <strong>{place.name}</strong> sera définitivement supprimé.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            variant="danger"
            fullWidth
            loading={deleting}
            onClick={handleDelete}
          >
            Supprimer définitivement
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setDeleteModal(false)}
          >
            Annuler
          </Button>
        </div>
      </Modal>
    </div>
  )
}

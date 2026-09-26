'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, MapPin, Settings } from 'lucide-react'
import { ScreenHeader } from '@/components/rencontres/RencontreUI'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { useRencontreStore } from '@/stores/rencontre.store'
import { RENCONTRE_INTENTIONS, ROUTES } from '@/lib/constants'

export default function RencontresPage() {
  const router      = useRouter()
  const user        = useAuthStore(s => s.user)!
  const places      = usePlacesStore(s => s.places)
  const profile     = useRencontreStore(s => s.profile)
  const loaded      = useRencontreStore(s => s.loaded)
  const loadProfile = useRencontreStore(s => s.loadProfile)

  useEffect(() => { loadProfile(user.id) }, [user.id, loadProfile])

  useEffect(() => {
    if (loaded && (!profile || !profile.principles_accepted_at)) {
      router.replace(ROUTES.RENCONTRES_ONBOARDING)
    }
  }, [loaded, profile, router])

  if (!loaded || !profile || !profile.principles_accepted_at) {
    return (
      <div className="screen-scroll flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const openCount = places.filter(p => p.rencontre_open).length

  return (
    <div className="screen-scroll px-4 pt-6 space-y-4">
      <ScreenHeader
        title="Rencontres"
        subtitle={`${profile.first_name} · ${RENCONTRE_INTENTIONS[profile.intention].label}`}
        back={false}
      />

      {!profile.enabled && (
        <div className="bg-accent-light rounded-card p-4 text-sm text-accent-dark">
          Le mode Rencontres est en pause : personne ne te voit. Tu peux le réactiver dans les réglages.
        </div>
      )}

      {profile.enabled && openCount === 0 && (
        <div className="bg-accent-light rounded-card p-4 text-sm text-accent-dark">
          Ouvre au moins un de tes lieux pour croiser des personnes qui l’aiment aussi.
        </div>
      )}

      <div className="bg-paper rounded-card shadow-card divide-y divide-divider">
        <HubLink
          href={ROUTES.RENCONTRES_LIEUX}
          icon={<MapPin className="w-4 h-4" />}
          label="Mes lieux ouverts"
          detail={`${openCount} ouvert${openCount > 1 ? 's' : ''}`}
        />
        <HubLink
          href={ROUTES.RENCONTRES_REGLAGES}
          icon={<Settings className="w-4 h-4" />}
          label="Réglages Rencontres"
        />
      </div>

      <section className="rounded-card border border-dashed border-dash p-5 text-center">
        <h2 className="text-lg text-ink">Moments dans tes lieux</h2>
        <p className="text-sm text-muted mt-1">
          Les sorties proposées dans tes lieux ouverts apparaîtront ici.
        </p>
      </section>
    </div>
  )
}

function HubLink({
  href,
  icon,
  label,
  detail,
}: {
  href: string
  icon: React.ReactNode
  label: string
  detail?: string
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-4 hover:bg-ink/5 transition-colors">
      <div className="w-8 h-8 bg-accent-light rounded-xl flex items-center justify-center text-accent">
        {icon}
      </div>
      <span className="flex-1 text-sm font-bold text-ink">{label}</span>
      {detail && <span className="text-xs text-muted">{detail}</span>}
      <ChevronRight className="w-4 h-4 text-ink/30" />
    </Link>
  )
}

'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, MapPin, Search, Check, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StampBadge } from '@/components/stamp/StampBadge'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/lib/constants'

const AUTO_ADVANCE_MS = 4200

const STEPS: { tag: string; title: string; body: string; visual: ReactNode }[] = [
  {
    tag: 'Étape 1 — Accueil',
    title: 'Tous tes spots, en un endroit',
    body: "Retrouve tes lieux sauvegardés, tes statistiques et deux façons rapides d'en ajouter un nouveau.",
    visual: (
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <StampBadge size="sm" animated={false} />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wide text-mist-2">Bonjour 👋</p>
              <p className="font-display font-extrabold uppercase text-base text-paper leading-none">Aïda</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-cerise flex items-center justify-center font-mono text-[11px] font-bold text-paper">A</div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-cerise rounded-2xl p-3 text-paper">
            <Link2 className="w-4 h-4 mb-1.5" />
            <p className="font-semibold text-[11px]">Importer un lien</p>
            <p className="text-[9px] opacity-75">TikTok ou Instagram</p>
          </div>
          <div className="bg-paper rounded-2xl p-3 text-ink">
            <MapPin className="w-4 h-4 mb-1.5" />
            <p className="font-semibold text-[11px]">Ajouter manuellement</p>
            <p className="text-[9px] text-ink/50">Saisie rapide</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[['12', 'Total'], ['4', 'Favoris'], ['2', 'Publics']].map(([v, l]) => (
            <div key={l} className="bg-paper rounded-2xl py-2.5 text-center border border-dashed border-brass-dim">
              <p className="font-display font-extrabold text-lg text-ink leading-none">{v}</p>
              <p className="font-mono text-[8px] uppercase text-brass-dim mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    tag: 'Étape 2 — Importer',
    title: 'Colle un lien TikTok ou Insta',
    body: 'Repéré une adresse dans une vidéo ? Colle simplement le lien du post.',
    visual: (
      <div className="w-full space-y-3">
        <p className="font-mono text-[9px] uppercase tracking-wide text-mist-2">Lien du post</p>
        <div className="flex items-center gap-2 bg-surface border border-dashed border-brass rounded-2xl px-3.5 py-3">
          <Link2 className="w-4 h-4 text-brass flex-shrink-0" />
          <span className="font-mono text-[11px] text-paper truncate">tiktok.com/@paris.spots/video/7291...</span>
        </div>
        <div className="bg-paper rounded-2xl py-3 text-center">
          <p className="font-mono text-[11px] font-semibold text-ink">Analyser le lien →</p>
        </div>
      </div>
    ),
  },
  {
    tag: 'Étape 3 — Analyse',
    title: 'PinLove fait le travail',
    body: 'La description et les infos du post sont récupérées automatiquement.',
    visual: (
      <div className="w-full flex flex-col items-center py-8 gap-3">
        <div className="w-9 h-9 border-2 border-brass border-t-transparent rounded-full animate-spin" />
        <p className="font-display font-extrabold uppercase text-base text-paper">Analyse en cours...</p>
        <p className="font-mono text-[10.5px] text-mist">On extrait les infos depuis TikTok</p>
      </div>
    ),
  },
  {
    tag: 'Étape 4 — Compléter',
    title: "Ajoute le nom et l'adresse",
    body: 'La catégorie et la description sont pré-remplies, tu complètes le reste en quelques secondes.',
    visual: (
      <div className="w-full space-y-2.5">
        <div className="bg-ink rounded-2xl px-3.5 py-3">
          <p className="font-mono text-[8px] uppercase tracking-wide text-paper/50">Extrait de TikTok</p>
          <p className="font-mono text-[10.5px] text-paper mt-1.5 leading-relaxed">meilleur bar à vin du 11e 🍷 le naturel qu&apos;il vous faut #paris</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wide text-mist-2 mb-1">Nom du lieu</p>
          <div className="bg-surface rounded-xl px-3 py-2.5 font-mono text-[11px] text-paper">Le Bar à Vin</div>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wide text-mist-2 mb-1">Catégorie</p>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-xl py-2 text-center border border-cerise bg-[#FBE6ED] text-[#7E1A40] font-mono text-[8.5px]">Restaurant</div>
            <div className="rounded-xl py-2 text-center border border-dashed border-brass/35 text-mist font-mono text-[8.5px]">Café</div>
            <div className="rounded-xl py-2 text-center border border-dashed border-brass/35 text-mist font-mono text-[8.5px]">Bar</div>
          </div>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wide text-mist-2 mb-1">Adresse</p>
          <div className="bg-surface rounded-xl px-3 py-2.5 font-mono text-[11px] text-mist-2">56 Rue de la Roquette</div>
        </div>
      </div>
    ),
  },
  {
    tag: 'Étape 5 — Enregistré',
    title: "C'est tamponné !",
    body: 'Le lieu est ajouté à ton carnet de spots, prêt à être retrouvé.',
    visual: (
      <div className="w-full flex flex-col items-center py-8 gap-2">
        <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mb-1">
          <Check className="w-7 h-7 text-green-400" />
        </div>
        <p className="font-display font-extrabold uppercase text-base text-paper">Lieu enregistré !</p>
        <p className="font-mono text-[10.5px] text-mist">Le Bar à Vin a été ajouté à tes lieux</p>
      </div>
    ),
  },
  {
    tag: 'Étape 6 — Carte',
    title: 'Vois tous tes lieux sur la carte',
    body: 'Chaque spot apparaît comme un pin — tape dessus pour un aperçu rapide.',
    visual: (
      <div className="w-full">
        <div
          className="relative h-40 rounded-2xl overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 20% 25%, rgba(231,179,74,.14), transparent 42%),' +
              'radial-gradient(circle at 85% 20%, rgba(230,59,119,.16), transparent 40%),' +
              'radial-gradient(circle at 65% 78%, rgba(231,179,74,.12), transparent 45%),' +
              '#153C42',
          }}
        >
          <div className="absolute w-3 h-3 rounded-full bg-cerise border-2 border-paper" style={{ top: '28%', left: '22%' }} />
          <div
            className="absolute w-4 h-4 rounded-full bg-brass border-2 border-paper"
            style={{ top: '48%', left: '55%', boxShadow: '0 0 0 5px rgba(231,179,74,.28), 0 0 12px 2px rgba(231,179,74,.5)' }}
          />
          <div className="absolute w-3 h-3 rounded-full bg-cerise border-2 border-paper" style={{ top: '68%', left: '18%' }} />
        </div>
        <div className="bg-paper rounded-2xl -mt-4 relative mx-3 p-3 flex items-center gap-2.5 shadow-card">
          <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg,#E7B34A,#E63B77)' }} />
          <div className="min-w-0">
            <p className="font-display font-extrabold uppercase text-[13px] text-ink leading-none truncate">Le Bar à Vin</p>
            <p className="font-mono text-[8px] uppercase text-brass-dim mt-1">Bar · Paris 11e · ♪ TikTok</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: 'Étape 7 — Itinéraire',
    title: 'Un tap, et tu y es',
    body: "Le bouton “Y aller” ouvre directement Plans avec l'itinéraire.",
    visual: (
      <div className="w-full space-y-3">
        <div
          className="h-28 rounded-2xl flex items-center justify-center"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, rgba(231,179,74,.3), transparent 55%),' +
              'radial-gradient(circle at 80% 75%, rgba(230,59,119,.35), transparent 55%), #153C42',
          }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-brass/55 flex items-center justify-center text-xl">🍸</div>
        </div>
        <p className="font-display font-extrabold uppercase text-lg text-paper">Le Bar à Vin</p>
        <div className="bg-ink rounded-xl py-3 flex items-center justify-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-paper" />
          <span className="font-mono text-[11px] font-semibold uppercase text-paper">Y aller</span>
        </div>
      </div>
    ),
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(true)

  const isLast = current === STEPS.length - 1
  const isFirst = current === 0

  const touchStartX = useRef<number | null>(null)
  const SWIPE_THRESHOLD = 50

  // Ne joue pas automatiquement pour les utilisateurs préférant moins d'animation.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false)
  }, [])

  useEffect(() => {
    if (!playing || isLast) return
    const t = setTimeout(() => setCurrent(c => c + 1), AUTO_ADVANCE_MS)
    return () => clearTimeout(t)
  }, [playing, current, isLast])

  function goTo(i: number) {
    setPlaying(false)
    setCurrent(Math.max(0, Math.min(STEPS.length - 1, i)))
  }

  function next() {
    if (isLast) {
      finish()
    } else {
      goTo(current + 1)
    }
  }

  function prev() {
    if (!isFirst) goTo(current - 1)
  }

  function finish() {
    localStorage.setItem('pinlove_onboarded', '1')
    router.push(user ? ROUTES.HOME : ROUTES.SIGNUP)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null

    if (deltaX <= -SWIPE_THRESHOLD && !isLast) goTo(current + 1)
    else if (deltaX >= SWIPE_THRESHOLD) prev()
  }

  const step = STEPS[current]

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-petrol-soft ambient-bg flex flex-col items-center justify-between px-6 py-10 overflow-x-hidden"
    >
      {/* Top bar: progress + skip */}
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <StampBadge size="sm" animated={false} />
          <button
            onClick={finish}
            className="text-mist-2 text-sm font-mono uppercase tracking-wide hover:text-paper transition-colors"
          >
            Passer →
          </button>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-paper/15 overflow-hidden">
              <div
                className="h-full bg-brass transition-all"
                style={{ width: i < current ? '100%' : i === current ? (playing ? '100%' : '0%') : '0%',
                  transitionDuration: i === current && playing ? `${AUTO_ADVANCE_MS}ms` : '150ms',
                  transitionTimingFunction: 'linear' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Step content — chaque écran s'affiche dans un mini appareil
          (encoche + barre de statut), comme une vidéo de démo, plutôt qu'en
          plein écran natif : demandé explicitement, même si l'onboarding
          tourne déjà plein écran sur le vrai téléphone. Les visuels de
          STEPS sont réutilisés tels quels (conçus pour ~380px de large),
          juste réduits via transform:scale pour tenir dans le boîtier. */}
      <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto" key={current}>
        <div className="animate-fade-in w-full max-w-[264px] mx-auto">
          <div className="relative aspect-[390/844] bg-[#050807] rounded-[42px] p-[10px] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.75)]">
            <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-surface border border-brass/10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[92px] h-[18px] bg-[#050807] rounded-b-[12px] z-30" />
              <div className="absolute top-0 inset-x-0 h-8 z-20 flex items-center justify-between px-5 font-mono text-[9px] font-semibold text-paper">
                <span>9:41</span>
                <span>●●●●</span>
              </div>
              <div className="absolute inset-0 pt-8 px-3 pb-3 flex items-center justify-center overflow-hidden">
                <div style={{ transform: 'scale(0.6)', transformOrigin: 'center', width: '166.7%' }}>
                  {step.visual}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ticket-card w-full !p-4 text-left">
          <p className="font-mono text-[9px] text-mist-2">{step.tag}</p>
          <h1 className="font-display font-extrabold uppercase text-sm text-ink mt-1">{step.title}</h1>
          <p className="font-mono text-[11px] text-ink/60 mt-1 leading-relaxed">{step.body}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5">
        <div className="flex items-center justify-center gap-3.5">
          <button
            onClick={prev}
            disabled={isFirst}
            aria-label="Étape précédente"
            className="w-9 h-9 rounded-full border border-dashed border-brass flex items-center justify-center text-paper disabled:opacity-25 transition-opacity"
          >
            ←
          </button>
          <button
            onClick={() => setPlaying(p => !p)}
            aria-label={playing ? 'Mettre en pause' : 'Lecture'}
            className="w-11 h-11 rounded-full bg-brass text-ink flex items-center justify-center text-base"
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <button
            onClick={() => (isLast ? undefined : goTo(current + 1))}
            disabled={isLast}
            aria-label="Étape suivante"
            className="w-9 h-9 rounded-full border border-dashed border-brass flex items-center justify-center text-paper disabled:opacity-25 transition-opacity"
          >
            →
          </button>
        </div>

        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-[18px] bg-brass' : 'w-1.5 bg-paper/22'
              }`}
              aria-label={`Étape ${i + 1}`}
            />
          ))}
        </div>

        <Button variant="primary" size="xl" fullWidth className="max-w-sm" onClick={next}>
          {isLast ? (user ? 'Retour à mes lieux' : 'Commencer gratuitement') : 'Suivant'}
        </Button>

        {isLast && !user && (
          <button
            onClick={() => router.push(ROUTES.LOGIN)}
            className="text-mist-2 text-sm font-mono hover:text-paper transition-colors"
          >
            J&apos;ai déjà un compte → Connexion
          </button>
        )}
      </div>
    </div>
  )
}

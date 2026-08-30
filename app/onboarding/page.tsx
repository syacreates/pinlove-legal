'use client'

import { useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { StampBadge } from '@/components/stamp/StampBadge'
import { TicketCard } from '@/components/stamp/TicketCard'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/lib/constants'

const SLIDES: {
  eyebrow: string
  title: ReactNode
  description: string
  visual: ReactNode
}[] = [
  {
    eyebrow: '✦ PinLove — Est. 2026',
    title: (
      <>
        Ne perds plus
        <br />
        <span className="font-hand text-cerise normal-case tracking-normal font-semibold text-[0.72em]">
          jamais
        </span>{' '}
        un spot
      </>
    ),
    description:
      "Chaque vidéo enregistrée mérite un tampon sur la carte, pas seulement une place dans tes favoris oubliés.",
    visual: (
      <div className="flex flex-col items-center gap-6 w-full">
        <StampBadge size="lg" />
        <TicketCard
          eyebrowLeft="N° 004 · PARIS"
          eyebrowRight="48.859°N 2.351°E"
          label={<>Carnet de<br />spots</>}
          sub="3 lieux ajoutés cette semaine"
        />
      </div>
    ),
  },
  {
    eyebrow: '✦ Depuis tes apps',
    title: (
      <>
        Depuis Tiktok
        <br />
        Depuis{' '}
        <span className="font-hand text-cerise normal-case tracking-normal font-semibold text-[0.72em]">
          Insta
        </span>
      </>
    ),
    description:
      "Partage un post — PinLove récupère l'adresse et tamponne ta carte, direct.",
    visual: (
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-[19px] bg-[#050807] text-paper border border-dashed border-paper/25">
            ♪
          </div>
          <div
            className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-[19px] border border-dashed border-paper/25"
            style={{ background: 'linear-gradient(135deg, #E7B34A, #E63B77)', color: '#1a0d12' }}
          >
            ◎
          </div>
          <span className="text-mist-2 text-[17px] font-mono">--&gt;</span>
          <StampBadge size="sm" />
        </div>
        <p className="font-mono text-[10px] text-mist-2 text-center max-w-[230px] tracking-wide">
          AUCUNE ADRESSE À COPIER-COLLER — ON S&apos;EN OCCUPE
        </p>
      </div>
    ),
  },
  {
    eyebrow: '✦ Ta carte',
    title: (
      <>
        Une carte
        <br />
        <span className="font-hand text-cerise normal-case tracking-normal font-semibold text-[0.72em]">
          tous
        </span>{' '}
        tes souvenirs
      </>
    ),
    description:
      "Filtre par ville, par ambiance ou par ami·e, et partage tes spots à qui tu veux.",
    visual: (
      <TicketCard
        eyebrowLeft="N° 012 · TES VILLES"
        eyebrowRight="4 SPOTS"
        label={<>Album<br />partagé</>}
        sub="Avec Léa, Sacha +2"
      />
    ),
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const [current, setCurrent] = useState(0)

  const isLast = current === SLIDES.length - 1
  const isFirst = current === 0

  const touchStartX = useRef<number | null>(null)
  const SWIPE_THRESHOLD = 50

  function next() {
    if (isLast) {
      finish()
    } else {
      setCurrent(c => c + 1)
    }
  }

  function prev() {
    if (!isFirst) {
      setCurrent(c => c - 1)
    }
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

    if (deltaX <= -SWIPE_THRESHOLD && !isLast) {
      setCurrent(c => c + 1)
    } else if (deltaX >= SWIPE_THRESHOLD) {
      prev()
    }
  }

  const slide = SLIDES[current]

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-petrol-soft ambient-bg flex flex-col items-center justify-between px-6 py-16 overflow-x-hidden"
    >
      {/* Top bar: logo + skip */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between">
        <StampBadge size="sm" animated={false} />
        <button
          onClick={finish}
          className="text-mist-2 text-sm font-mono uppercase tracking-wide hover:text-paper transition-colors"
        >
          Passer →
        </button>
      </div>

      {/* Slide content */}
      <div className="flex flex-col items-center text-center gap-6 animate-fade-in w-full max-w-md mx-auto" key={current}>
        <p className="font-mono text-[10.5px] uppercase tracking-widest text-brass">{slide.eyebrow}</p>
        <h2 className="font-display font-extrabold uppercase text-[33px] leading-[0.98] text-paper">
          {slide.title}
        </h2>
        <p className="font-mono text-mist text-xs leading-relaxed max-w-[270px]">
          {slide.description}
        </p>
        <div className="w-full flex justify-center mt-2">{slide.visual}</div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">
        {/* Dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-[18px] bg-brass' : 'w-1.5 bg-paper/22'
              }`}
              aria-label={`Diapositive ${i + 1}`}
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

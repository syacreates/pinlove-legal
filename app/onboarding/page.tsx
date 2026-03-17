'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants'

const SLIDES = [
  {
    emoji: '📸',
    title: 'Tu sauvegardes, on s\'en souvient',
    description:
      'Tu vois un super restaurant sur TikTok ou Instagram ? Colle le lien dans PinLove. On extrait l\'adresse pour toi.',
    bg: 'from-brand-400 to-brand-600',
  },
  {
    emoji: '🗺️',
    title: 'Retrouve tout sur une carte',
    description:
      'Tous tes lieux favoris sur une carte interactive. Filtre par catégorie, calcule un itinéraire depuis ta position.',
    bg: 'from-blue-400 to-blue-600',
  },
  {
    emoji: '👫',
    title: 'Partage tes spots avec tes amis',
    description:
      'Invite tes proches et partage avec eux uniquement les adresses que tu choisis. Tes lieux privés restent privés.',
    bg: 'from-violet-400 to-violet-600',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)

  const isLast = current === SLIDES.length - 1

  function next() {
    if (isLast) {
      finish()
    } else {
      setCurrent(c => c + 1)
    }
  }

  function finish() {
    localStorage.setItem('pinlove_onboarded', '1')
    router.push(ROUTES.SIGNUP)
  }

  const slide = SLIDES[current]

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${slide.bg} flex flex-col items-center justify-between px-6 py-16 transition-all duration-500`}
    >
      {/* Skip */}
      <div className="w-full flex justify-end">
        <button
          onClick={finish}
          className="text-white/70 text-sm font-medium hover:text-white transition-colors"
        >
          Passer →
        </button>
      </div>

      {/* Slide content */}
      <div className="flex flex-col items-center text-center gap-6 animate-fade-in" key={current}>
        <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-4xl flex items-center justify-center shadow-modal">
          <span className="text-6xl">{slide.emoji}</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white leading-tight mb-3">
            {slide.title}
          </h2>
          <p className="text-white/80 text-base leading-relaxed max-w-xs">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex flex-col items-center gap-6">
        {/* Dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-white' : 'w-2 bg-white/40'
              }`}
              aria-label={`Diapositive ${i + 1}`}
            />
          ))}
        </div>

        <Button
          variant="secondary"
          size="xl"
          fullWidth
          className="max-w-sm !bg-white !text-brand-600 hover:!bg-neutral-50"
          onClick={next}
        >
          {isLast ? 'Commencer gratuitement' : 'Suivant'}
        </Button>

        {isLast && (
          <button
            onClick={() => router.push(ROUTES.LOGIN)}
            className="text-white/70 text-sm hover:text-white transition-colors"
          >
            J'ai déjà un compte → Connexion
          </button>
        )}
      </div>
    </div>
  )
}

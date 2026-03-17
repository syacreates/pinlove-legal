import Link from 'next/link'
import { ROUTES } from '@/lib/constants'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">🗺️</div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Page introuvable</h1>
      <p className="text-neutral-500 text-sm mb-8">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <Link
        href={ROUTES.HOME}
        className="inline-flex items-center justify-center h-11 px-6 bg-brand-500 text-white font-semibold rounded-2xl hover:bg-brand-600 transition-colors"
      >
        Retour à l'accueil
      </Link>
    </div>
  )
}

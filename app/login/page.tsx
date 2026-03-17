'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { ROUTES } from '@/lib/constants'

export default function LoginPage() {
  const router   = useRouter()
  const signIn   = useAuthStore(s => s.signIn)
  const loading  = useAuthStore(s => s.loading)
  const addToast = useAppStore(s => s.addToast)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const err = await signIn(email, password)
    if (err) {
      setError(err)
    } else {
      addToast({ type: 'success', message: 'Bienvenue sur PinLove ! 👋' })
      router.replace(ROUTES.HOME)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Hero top */}
      <div className="premium-gradient px-6 pt-16 pb-12 flex flex-col items-center text-center">
        <span className="text-4xl mb-3">📍</span>
        <h1 className="text-2xl font-bold text-white">Connexion</h1>
        <p className="text-white/80 text-sm mt-1">
          Retrouve tous tes spots favoris
        </p>
      </div>

      {/* Form card */}
      <div className="flex-1 px-4 -mt-6 pb-10">
        <div className="bg-white rounded-3xl shadow-card p-6 max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
              autoComplete="email"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="Mot de passe"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}
                  className="hover:text-neutral-600 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button type="submit" loading={loading} fullWidth size="lg">
              Se connecter
            </Button>

            <Link
              href={ROUTES.RESET_PWD}
              className="text-center text-sm text-brand-500 hover:text-brand-600 font-medium"
            >
              Mot de passe oublié ?
            </Link>
          </form>

          {/* Demo mode hint */}
          <div className="mt-5 p-3 bg-neutral-50 rounded-2xl text-xs text-neutral-500 text-center">
            <strong className="text-neutral-700">Mode démo</strong> — entre n'importe quel email pour te connecter.
          </div>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Pas encore de compte ?{' '}
          <Link href={ROUTES.SIGNUP} className="text-brand-500 font-semibold hover:text-brand-600">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}

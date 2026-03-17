'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { ROUTES } from '@/lib/constants'

export default function SignupPage() {
  const router   = useRouter()
  const signUp   = useAuthStore(s => s.signUp)
  const loading  = useAuthStore(s => s.loading)
  const addToast = useAppStore(s => s.addToast)

  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    const err = await signUp(email, password, fullName)
    if (err) {
      setError(err)
    } else {
      localStorage.setItem('pinlove_onboarded', '1')
      addToast({ type: 'success', message: 'Compte créé ! Bienvenue sur PinLove 🎉' })
      router.replace(ROUTES.HOME)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Hero */}
      <div className="premium-gradient px-6 pt-16 pb-12 flex flex-col items-center text-center">
        <span className="text-4xl mb-3">✨</span>
        <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
        <p className="text-white/80 text-sm mt-1">Gratuit pour commencer</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-4 -mt-6 pb-10">
        <div className="bg-white rounded-3xl shadow-card p-6 max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Prénom et nom"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Sophie Martin"
              autoComplete="name"
              leftIcon={<User className="w-4 h-4" />}
              required
            />
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
              placeholder="6 caractères minimum"
              autoComplete="new-password"
              leftIcon={<Lock className="w-4 h-4" />}
              hint="Minimum 6 caractères"
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
              Créer mon compte gratuit
            </Button>
          </form>

          <p className="text-center text-xs text-neutral-400 mt-4 leading-relaxed">
            En créant un compte, tu acceptes nos{' '}
            <a href="/terms" className="underline">Conditions d'utilisation</a> et notre{' '}
            <a href="/privacy" className="underline">Politique de confidentialité</a>.
          </p>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Déjà un compte ?{' '}
          <Link href={ROUTES.LOGIN} className="text-brand-500 font-semibold hover:text-brand-600">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StampBadge } from '@/components/stamp/StampBadge'
import { AuthTabs } from '@/components/stamp/AuthTabs'
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
    <div className="min-h-screen bg-petrol-soft ambient-bg flex flex-col px-6 pt-14 pb-10">
      <div className="flex justify-center mb-8">
        <StampBadge size="sm" animated={false} />
      </div>

      <div className="w-full max-w-sm mx-auto">
        <AuthTabs active="signup" className="mb-6" />

        <h1 className="font-display font-extrabold uppercase text-[26px] leading-tight text-paper mb-1.5">
          Bienvenue
          <br />
          à bord
        </h1>
        <p className="font-mono text-[11.5px] text-mist mb-6">
          ✦ Crée ton compte pour commencer à épingler
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Prénom"
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Aïda"
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
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />
          <Input
            label="Mot de passe"
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="8 caractères min."
            autoComplete="new-password"
            leftIcon={<Lock className="w-4 h-4" />}
            hint="Minimum 6 caractères"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? 'Masquer' : 'Afficher'}
                className="hover:text-paper transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Créer mon compte
          </Button>
        </form>

        <p className="text-center font-mono text-[10px] text-mist-2 mt-4 leading-relaxed">
          En créant un compte, tu acceptes nos{' '}
          <a href="/terms" className="underline">Conditions d&apos;utilisation</a> et notre{' '}
          <a href="/privacy" className="underline">Politique de confidentialité</a>.
        </p>

        <p className="text-center font-mono text-[11.5px] text-mist mt-6">
          Déjà un compte ?{' '}
          <Link href={ROUTES.LOGIN} className="text-cerise font-semibold">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

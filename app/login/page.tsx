'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StampBadge } from '@/components/stamp/StampBadge'
import { AuthTabs } from '@/components/stamp/AuthTabs'
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
    <div className="min-h-screen bg-petrol-soft ambient-bg flex flex-col px-6 pt-14 pb-10">
      <div className="flex justify-center mb-8">
        <StampBadge size="sm" animated={false} />
      </div>

      <div className="w-full max-w-sm mx-auto">
        <AuthTabs active="login" className="mb-6" />

        <h1 className="font-display font-extrabold uppercase text-[26px] leading-tight text-paper mb-1.5">
          Content de
          <br />
          te revoir
        </h1>
        <p className="font-mono text-[11.5px] text-mist mb-6">✦ Retrouve tous tes spots favoris</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            placeholder="••••••••"
            autoComplete="current-password"
            leftIcon={<Lock className="w-4 h-4" />}
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

          <Link
            href={ROUTES.RESET_PWD}
            className="text-right -mt-1 font-mono text-[11px] text-mist-2 hover:text-mist transition-colors"
          >
            Mot de passe oublié ?
          </Link>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Se connecter
          </Button>
        </form>

        <p className="text-center font-mono text-[11.5px] text-mist mt-6">
          Pas encore de compte ?{' '}
          <Link href={ROUTES.SIGNUP} className="text-cerise font-semibold">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}

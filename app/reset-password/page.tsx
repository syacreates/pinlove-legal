'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authService } from '@/services/auth.service'
import { ROUTES } from '@/lib/constants'

export default function ResetPasswordPage() {
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await authService.resetPassword(email)
    setLoading(false)
    if (err) setError(err)
    else     setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          Email envoyé !
        </h2>
        <p className="text-neutral-500 text-sm max-w-xs mb-8">
          Vérifie ta boîte mail à <strong>{email}</strong> pour réinitialiser ton mot de passe.
        </p>
        <Link href={ROUTES.LOGIN} className="text-brand-500 font-semibold text-sm">
          ← Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col px-4 pt-16 pb-10">
      <Link href={ROUTES.LOGIN} className="flex items-center gap-1.5 text-neutral-600 text-sm mb-8">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <div className="text-4xl mb-4">🔑</div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">
        Mot de passe oublié ?
      </h1>
      <p className="text-neutral-500 text-sm mb-8">
        Entre ton email pour recevoir un lien de réinitialisation.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="toi@exemple.com"
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" loading={loading} fullWidth size="lg">
          Envoyer le lien
        </Button>
      </form>
    </div>
  )
}

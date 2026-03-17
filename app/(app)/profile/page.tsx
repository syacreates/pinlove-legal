'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit3, LogOut, ChevronRight, Shield, CreditCard, Bell, HelpCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { PlanBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { usePlacesStore } from '@/stores/places.store'
import { authService } from '@/services/auth.service'
import { ROUTES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

export default function ProfilePage() {
  const router    = useRouter()
  const user      = useAuthStore(s => s.user)!
  const signOut   = useAuthStore(s => s.signOut)
  const setUser   = useAuthStore(s => s.setUser)
  const addToast  = useAppStore(s => s.addToast)
  const count     = usePlacesStore(s => s.placesCount)

  const [editModal,  setEditModal]  = useState(false)
  const [logoutModal, setLogoutModal] = useState(false)
  const [fullName,   setFullName]   = useState(user.full_name)
  const [username,   setUsername]   = useState(user.username)
  const [saving,     setSaving]     = useState(false)

  async function handleSaveProfile() {
    setSaving(true)
    const { user: updated, error } = await authService.updateProfile({ full_name: fullName, username })
    setSaving(false)
    if (error) {
      addToast({ type: 'error', message: error })
    } else {
      if (updated) setUser(updated)
      addToast({ type: 'success', message: 'Profil mis à jour !' })
      setEditModal(false)
    }
  }

  async function handleLogout() {
    await signOut()
    router.replace(ROUTES.LOGIN)
  }

  return (
    <div className="screen-scroll px-4 pt-6 space-y-5">
      {/* Profile card */}
      <div className="bg-white rounded-3xl shadow-card p-5">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatar_url} alt={user.full_name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-neutral-900 text-lg truncate">{user.full_name}</h1>
              <PlanBadge plan={user.plan} />
            </div>
            <p className="text-sm text-neutral-500">@{user.username}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={() => setEditModal(true)}
            className="p-2 rounded-2xl hover:bg-neutral-100 transition-colors flex-shrink-0"
          >
            <Edit3 className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-neutral-50">
          <Stat label="Lieux" value={count} />
          <Stat label="Plan" value={user.plan === 'premium' ? 'Premium' : 'Gratuit'} />
          <Stat label="Depuis" value={new Date(user.created_at).getFullYear().toString()} />
        </div>
      </div>

      {/* Plan section */}
      {user.plan === 'free' ? (
        <Link
          href={ROUTES.PRICING}
          className="block bg-gradient-to-r from-brand-500 to-brand-400 rounded-3xl p-5"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">✦</span>
            <div className="flex-1">
              <p className="font-bold text-white">Passer en Premium</p>
              <p className="text-white/80 text-sm">Adresses illimitées · Partage · Paiement unique</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/80" />
          </div>
        </Link>
      ) : (
        <div className="bg-white rounded-3xl shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-brand-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-neutral-900">Plan Premium actif</p>
            {user.premium_purchased_at && (
              <p className="text-xs text-neutral-500">Activé le {formatDate(user.premium_purchased_at)}</p>
            )}
          </div>
          <PlanBadge plan="premium" />
        </div>
      )}

      {/* Menu items */}
      <div className="bg-white rounded-3xl shadow-card divide-y divide-neutral-50">
        <MenuItem icon={<Shield className="w-4 h-4" />} label="Confidentialité" href="/privacy" />
        <MenuItem icon={<HelpCircle className="w-4 h-4" />} label="Aide & Support" href="#" />
        <MenuItem icon={<Bell className="w-4 h-4" />} label="Notifications" href="#" />
      </div>

      {/* Logout */}
      <button
        onClick={() => setLogoutModal(true)}
        className="w-full flex items-center justify-center gap-2 py-4 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Se déconnecter
      </button>

      {/* Edit profile modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Modifier le profil">
        <div className="space-y-4 pt-2">
          <Input
            label="Nom complet"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
          <Input
            label="Nom d'utilisateur"
            value={username}
            onChange={e => setUsername(e.target.value)}
            leftIcon={<span className="text-neutral-400 text-sm">@</span>}
          />
          <Button variant="primary" fullWidth loading={saving} onClick={handleSaveProfile}>
            Sauvegarder
          </Button>
        </div>
      </Modal>

      {/* Logout confirmation */}
      <Modal open={logoutModal} onClose={() => setLogoutModal(false)} title="Se déconnecter ?">
        <p className="text-sm text-neutral-500 mb-5">
          Tu seras redirigé vers l'écran de connexion.
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="danger" fullWidth onClick={handleLogout}>
            Se déconnecter
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setLogoutModal(false)}>
            Annuler
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  )
}

function MenuItem({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-4 hover:bg-neutral-50 transition-colors"
    >
      <div className="w-8 h-8 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600">
        {icon}
      </div>
      <span className="flex-1 text-sm font-medium text-neutral-900">{label}</span>
      <ChevronRight className="w-4 h-4 text-neutral-300" />
    </Link>
  )
}

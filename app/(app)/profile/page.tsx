'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit3, LogOut, ChevronRight, Shield, CreditCard, Bell, HelpCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { PlanBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { TicketCard } from '@/components/stamp/TicketCard'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { usePlacesStore } from '@/stores/places.store'
import { authService } from '@/services/auth.service'
import { friendsService } from '@/services/friends.service'
import { ROUTES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

export default function ProfilePage() {
  const router    = useRouter()
  const user      = useAuthStore(s => s.user)!
  const signOut   = useAuthStore(s => s.signOut)
  const setUser   = useAuthStore(s => s.setUser)
  const addToast  = useAppStore(s => s.addToast)
  const count     = usePlacesStore(s => s.placesCount)

  const [friendsCount, setFriendsCount] = useState(0)

  useEffect(() => {
    friendsService.getFriendIds(user.id).then(ids => setFriendsCount(ids.length))
  }, [user.id])

  const [editModal,  setEditModal]  = useState(false)
  const [logoutModal, setLogoutModal] = useState(false)
  const [fullName,   setFullName]   = useState(user.full_name)
  const [username,   setUsername]   = useState(user.username)
  const [saving,     setSaving]     = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

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
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await signOut()
    } catch (e) {
      addToast({ type: 'error', message: 'La déconnexion a rencontré un problème, mais ta session locale a été effacée.' })
      console.error('[profile] handleLogout:', e)
    } finally {
      router.replace(ROUTES.LOGIN)
    }
  }

  return (
    <div className="screen-scroll px-4 pt-6 space-y-5">
      {/* Profile card */}
      <div className="bg-paper rounded-3xl shadow-card p-5">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatar_url} alt={user.full_name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-ink text-lg truncate">{user.full_name}</h1>
              <PlanBadge plan={user.plan} />
            </div>
            <p className="text-sm text-ink/60">@{user.username}</p>
            <p className="text-xs text-ink/45 mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={() => setEditModal(true)}
            className="p-2 rounded-2xl hover:bg-ink/5 transition-colors flex-shrink-0"
          >
            <Edit3 className="w-4 h-4 text-ink/50" />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-ink/10">
          <Stat label="Lieux" value={count} />
          <Stat label="Amis" value={friendsCount} />
          <Stat label="Depuis" value={new Date(user.created_at).getFullYear().toString()} />
        </div>
      </div>

      {/* Plan section */}
      {user.plan === 'free' ? (
        <Link href={ROUTES.PRICING} className="block">
          <TicketCard
            eyebrowLeft="✦ PREMIUM"
            eyebrowRight="→"
            label={<>Passer en<br />Premium</>}
            sub="Adresses illimitées · Partage · Paiement unique"
            pinColors={[]}
          />
        </Link>
      ) : (
        <div className="bg-paper rounded-3xl shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-brand-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-ink">Plan Premium actif</p>
            {user.premium_purchased_at && (
              <p className="text-xs text-ink/60">Activé le {formatDate(user.premium_purchased_at)}</p>
            )}
          </div>
          <PlanBadge plan="premium" />
        </div>
      )}

      {/* Menu items */}
      <div className="bg-paper rounded-3xl shadow-card divide-y divide-ink/10">
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
        <p className="text-sm text-ink/60 mb-5">
          Tu seras redirigé vers l'écran de connexion.
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="danger" fullWidth loading={loggingOut} onClick={handleLogout}>
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
      <p className="text-lg font-bold text-ink">{value}</p>
      <p className="text-xs text-ink/60">{label}</p>
    </div>
  )
}

function MenuItem({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-4 hover:bg-ink/5 transition-colors"
    >
      <div className="w-8 h-8 bg-ink/5 rounded-xl flex items-center justify-center text-ink/70">
        {icon}
      </div>
      <span className="flex-1 text-sm font-medium text-ink">{label}</span>
      <ChevronRight className="w-4 h-4 text-ink/30" />
    </Link>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, UserPlus, MapPin, ExternalLink, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { PlaceCard } from '@/components/ui/PlaceCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlanBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { TicketCard } from '@/components/stamp/TicketCard'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { friendsService } from '@/services/friends.service'
import { placesService } from '@/services/places.service'
import { DEMO_FRIEND_CONNECTIONS, DEMO_FRIENDS_PLACES } from '@/data/demo'
import type { User, Place } from '@/lib/types'
import { ROUTES } from '@/lib/constants'

export default function FriendsPage() {
  const router    = useRouter()
  const user      = useAuthStore(s => s.user)!
  const addToast  = useAppStore(s => s.addToast)

  const [friends,       setFriends]       = useState<User[]>([])
  const [inviteUrl,     setInviteUrl]     = useState('')
  const [copied,        setCopied]        = useState(false)
  const [inviteModal,   setInviteModal]   = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null)
  const [friendPlaces,  setFriendPlaces]  = useState<Place[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)

  const isPremium = user.plan === 'premium'

  useEffect(() => {
    // Load real friends
    friendsService.getFriends(user.id).then(setFriends)
  }, [user.id])

  async function handleGenerateInvite() {
    if (!isPremium) {
      router.push(ROUTES.PRICING)
      return
    }
    const url = await friendsService.generateInviteLink(user.id)
    setInviteUrl(url)
    setInviteModal(true)
  }

  async function handleCopyInvite() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    addToast({ type: 'success', message: 'Lien copié !' })
  }

  async function handleViewFriendSpots(friend: User) {
    setSelectedFriend(friend)
    setLoadingPlaces(true)
    // Show demo shared places
    setFriendPlaces(DEMO_FRIENDS_PLACES.filter(p => p.user_id === friend.id))
    setLoadingPlaces(false)
  }

  return (
    <div className="screen-scroll px-4 pt-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Amis</h1>
          <p className="text-sm text-neutral-500">{friends.length} connexion{friends.length > 1 ? 's' : ''}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={handleGenerateInvite}
        >
          Inviter
        </Button>
      </div>

      {/* Premium gate hint */}
      {!isPremium && (
        <div onClick={() => router.push(ROUTES.PRICING)} className="cursor-pointer">
          <TicketCard
            eyebrowLeft="✦ PREMIUM"
            eyebrowRight="→"
            label={<>Partage<br />Premium</>}
            sub="Invite tes amis et partage tes spots favoris"
            pinColors={[]}
          />
        </div>
      )}

      {/* Friend list */}
      {friends.length === 0 ? (
        <EmptyState
          icon={
            <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-brass-dim flex items-center justify-center">
              <Users className="w-7 h-7 text-mist-2" />
            </div>
          }
          title="Aucun ami pour l'instant"
          description="Invite tes amis pour partager tes spots préférés avec eux."
          action={{
            label: 'Inviter un ami',
            onClick: handleGenerateInvite,
          }}
        />
      ) : (
        <div className="space-y-3">
          {friends.map(friend => (
            <div
              key={friend.id}
              className="bg-paper rounded-3xl shadow-card p-4 flex items-center gap-3"
            >
              <Avatar src={friend.avatar_url} alt={friend.full_name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink truncate">
                    {friend.full_name}
                  </span>
                  <PlanBadge plan={friend.plan} />
                </div>
                <span className="text-xs text-ink/45">@{friend.username}</span>
              </div>
              <button
                onClick={() => handleViewFriendSpots(friend)}
                className="flex items-center gap-1.5 text-xs text-brand-500 font-medium hover:text-brand-600 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                Spots
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Friend's spots modal */}
      {selectedFriend && (
        <Modal
          open={!!selectedFriend}
          onClose={() => setSelectedFriend(null)}
          title={`Spots de ${selectedFriend.full_name.split(' ')[0]}`}
        >
          {loadingPlaces ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : friendPlaces.length === 0 ? (
            <EmptyState
              icon="📍"
              title="Aucun spot partagé"
              description={`${selectedFriend.full_name.split(' ')[0]} n'a pas encore partagé de lieux avec toi.`}
            />
          ) : (
            <div className="space-y-3 pt-2">
              {friendPlaces.map(p => (
                <PlaceCard key={p.id} place={p} compact />
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Invite modal */}
      <Modal
        open={inviteModal}
        onClose={() => setInviteModal(false)}
        title="Inviter un ami"
      >
        <p className="text-sm text-ink/60 mb-4">
          Partage ce lien avec un ami pour l'inviter sur PinLove. Une fois accepté, vous pourrez partager vos spots.
        </p>
        <div className="flex items-center gap-2 bg-neutral-50 rounded-2xl p-3 mb-4">
          <p className="text-xs text-neutral-600 flex-1 truncate font-mono">{inviteUrl}</p>
          <button
            onClick={handleCopyInvite}
            className="flex-shrink-0 p-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            {copied
              ? <Check className="w-4 h-4 text-green-500" />
              : <Copy className="w-4 h-4 text-neutral-400" />
            }
          </button>
        </div>
        <Button variant="primary" fullWidth onClick={handleCopyInvite}>
          {copied ? '✓ Lien copié !' : 'Copier le lien'}
        </Button>
      </Modal>
    </div>
  )
}

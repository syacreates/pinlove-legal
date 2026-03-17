/**
 * Friends Service
 *
 * Manages friend connections and invitation links.
 * V1 uses in-memory store seeded with demo data.
 */

import type { FriendConnection, User } from '@/lib/types'
import { DEMO_FRIEND_CONNECTIONS, DEMO_FRIENDS } from '@/data/demo'
import { generateId, generateToken } from '@/lib/utils'

// ── In-memory store ───────────────────────────────────────────────────────────
let _connections: FriendConnection[] = [...DEMO_FRIEND_CONNECTIONS]
let _pendingInvites: Map<string, string> = new Map() // token → userId

export const friendsService = {
  /** Get all accepted friends for a user. */
  async getFriends(userId: string): Promise<User[]> {
    await delay(300)
    return _connections
      .filter(
        c =>
          c.status === 'accepted' &&
          (c.requester_id === userId || c.addressee_id === userId),
      )
      .map(c => c.friend!)
      .filter(Boolean)
  },

  /** Get all connections (including pending) for a user. */
  async getConnections(userId: string): Promise<FriendConnection[]> {
    await delay(300)
    return _connections.filter(
      c => c.requester_id === userId || c.addressee_id === userId,
    )
  },

  /** Get accepted friend user IDs for quick lookups. */
  async getFriendIds(userId: string): Promise<string[]> {
    const friends = await friendsService.getFriends(userId)
    return friends.map(f => f.id)
  },

  /**
   * Generate a unique invitation link.
   * The token is tied to the inviting user.
   */
  async generateInviteLink(userId: string): Promise<string> {
    await delay(200)
    const token = generateToken()
    _pendingInvites.set(token, userId)

    const base = typeof window !== 'undefined'
      ? window.location.origin
      : 'https://pinlove.app'

    return `${base}/invite/${token}`
  },

  /** Accept an invitation via token. Creates the connection. */
  async acceptInvite(
    token: string,
    acceptingUser: User,
  ): Promise<{ connection: FriendConnection | null; error: string | null }> {
    await delay(400)

    const inviterId = _pendingInvites.get(token)
    if (!inviterId) {
      return { connection: null, error: 'Lien d\'invitation invalide ou expiré.' }
    }

    if (inviterId === acceptingUser.id) {
      return { connection: null, error: 'Tu ne peux pas t\'ajouter toi-même.' }
    }

    // Check if already connected
    const existing = _connections.find(
      c =>
        (c.requester_id === inviterId && c.addressee_id === acceptingUser.id) ||
        (c.requester_id === acceptingUser.id && c.addressee_id === inviterId),
    )
    if (existing && existing.status === 'accepted') {
      return { connection: null, error: 'Vous êtes déjà amis.' }
    }

    const now = new Date().toISOString()
    const connection: FriendConnection = {
      id: generateId(),
      requester_id: inviterId,
      addressee_id: acceptingUser.id,
      status: 'accepted',
      invite_token: token,
      created_at: now,
      updated_at: now,
      friend: {
        id: acceptingUser.id,
        username: acceptingUser.username,
        full_name: acceptingUser.full_name,
        avatar_url: acceptingUser.avatar_url,
        plan: acceptingUser.plan,
      },
    }

    _connections = [connection, ..._connections]
    _pendingInvites.delete(token)

    return { connection, error: null }
  },

  /** Remove a friend. */
  async removeFriend(
    userId: string,
    friendId: string,
  ): Promise<{ error: string | null }> {
    await delay(300)
    const before = _connections.length
    _connections = _connections.filter(
      c => !(
        (c.requester_id === userId && c.addressee_id === friendId) ||
        (c.requester_id === friendId && c.addressee_id === userId)
      ),
    )
    if (_connections.length === before) {
      return { error: 'Ami introuvable.' }
    }
    return { error: null }
  },

  /** Get demo friends list for display. */
  async getDemoFriends(): Promise<User[]> {
    await delay(200)
    return DEMO_FRIENDS
  },
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

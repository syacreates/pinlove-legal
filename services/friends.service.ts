/**
 * Friends Service — Supabase
 */

import { supabase } from '@/lib/supabase'
import type { FriendConnection, User } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
}

/** Encode userId + random token → base64 URL-safe string */
function encodeInviteToken(userId: string): string {
  const raw = `${userId}:${generateToken()}`
  return Buffer.from(raw).toString('base64url')
}

/** Decode invite token → inviter userId (or null if invalid) */
function decodeInviteToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const [userId] = decoded.split(':')
    return userId || null
  } catch {
    return null
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

export const friendsService = {
  /** Get all accepted friends for a user. */
  async getFriends(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('friend_connections')
      .select(`
        *,
        requester:users!requester_id(id, email, username, full_name, avatar_url, plan, created_at, updated_at, premium_purchased_at),
        addressee:users!addressee_id(id, email, username, full_name, avatar_url, plan, created_at, updated_at, premium_purchased_at)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted')

    if (error) { console.error('[friends] getFriends:', error.message); return [] }

    return (data ?? []).map((c: any) => {
      return c.requester_id === userId ? c.addressee : c.requester
    }).filter(Boolean) as User[]
  },

  /** Get all connections (including pending) for a user. */
  async getConnections(userId: string): Promise<FriendConnection[]> {
    const { data, error } = await supabase
      .from('friend_connections')
      .select(`
        *,
        requester:users!requester_id(id, username, full_name, avatar_url, plan),
        addressee:users!addressee_id(id, username, full_name, avatar_url, plan)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) { console.error('[friends] getConnections:', error.message); return [] }

    return (data ?? []).map((c: any): FriendConnection => ({
      id: c.id,
      requester_id: c.requester_id,
      addressee_id: c.addressee_id,
      status: c.status,
      invite_token: c.invite_token,
      created_at: c.created_at,
      updated_at: c.updated_at,
      friend: c.requester_id === userId ? c.addressee : c.requester,
    }))
  },

  /** Get accepted friend user IDs for quick lookups. */
  async getFriendIds(userId: string): Promise<string[]> {
    const friends = await friendsService.getFriends(userId)
    return friends.map(f => f.id)
  },

  /**
   * Generate a unique invitation link.
   * The userId is encoded in the token — no DB row needed until accepted.
   */
  async generateInviteLink(userId: string): Promise<string> {
    const token = encodeInviteToken(userId)
    const base = typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://pinlove.app')
    return `${base}/invite/${token}`
  },

  /** Accept an invitation via token. Creates the connection in DB. */
  async acceptInvite(
    token: string,
    acceptingUser: User,
  ): Promise<{ connection: FriendConnection | null; error: string | null }> {
    const inviterId = decodeInviteToken(token)
    if (!inviterId) {
      return { connection: null, error: "Lien d'invitation invalide ou expiré." }
    }
    if (inviterId === acceptingUser.id) {
      return { connection: null, error: "Tu ne peux pas t'ajouter toi-même." }
    }

    // Check if already connected
    const { data: existing } = await supabase
      .from('friend_connections')
      .select('id, status')
      .or(
        `and(requester_id.eq.${inviterId},addressee_id.eq.${acceptingUser.id}),` +
        `and(requester_id.eq.${acceptingUser.id},addressee_id.eq.${inviterId})`
      )
      .maybeSingle()

    if (existing?.status === 'accepted') {
      return { connection: null, error: 'Vous êtes déjà amis.' }
    }

    const { data, error } = await supabase
      .from('friend_connections')
      .insert({
        requester_id: inviterId,
        addressee_id: acceptingUser.id,
        status: 'accepted',
        invite_token: token,
      })
      .select(`
        *,
        friend:users!requester_id(id, username, full_name, avatar_url, plan)
      `)
      .single()

    if (error) return { connection: null, error: error.message }

    const connection: FriendConnection = {
      id: data.id,
      requester_id: data.requester_id,
      addressee_id: data.addressee_id,
      status: data.status,
      invite_token: data.invite_token,
      created_at: data.created_at,
      updated_at: data.updated_at,
      friend: (data as any).friend,
    }
    return { connection, error: null }
  },

  /** Remove a friend (deletes the connection row). */
  async removeFriend(
    userId: string,
    friendId: string,
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('friend_connections')
      .delete()
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${friendId}),` +
        `and(requester_id.eq.${friendId},addressee_id.eq.${userId})`
      )
    return { error: error?.message ?? null }
  },
}

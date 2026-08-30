/**
 * Auth Service — Supabase Auth
 */

import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/types'
import { withTimeout } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Traduit les messages d'erreur bruts de Supabase Auth (anglais) en français actionnable. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.'
  }
  if (m.includes('email not confirmed')) {
    return 'Confirme ton adresse email avant de te connecter — vérifie ta boîte mail (et les spams).'
  }
  if (m.includes('user already registered') || m.includes('already registered')) {
    return 'Un compte existe déjà avec cet email.'
  }
  if (m.includes('password') && m.includes('at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.'
  }
  if (m.includes('rate limit')) {
    return 'Trop de tentatives. Réessaie dans quelques minutes.'
  }
  return message
}

async function fetchProfile(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as User
}

// ── Public API ────────────────────────────────────────────────────────────────

export const authService = {
  /** Returns the currently signed-in user, or null. */
  async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    return fetchProfile(session.user.id)
  },

  /** Sign in with email + password. */
  async signIn(
    email: string,
    password: string,
  ): Promise<{ user: User; error: null } | { user: null; error: string }> {
    // L'email tapé/collé/auto-rempli peut porter des espaces ou une majuscule
    // initiale (clavier mobile) — sans ce nettoyage, des identifiants pourtant
    // corrects échouent silencieusement avec "Invalid login credentials".
    const cleanEmail = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
    if (error) return { user: null, error: friendlyAuthError(error.message) }

    // Try fetching the profile from DB
    const user = await fetchProfile(data.user.id)
    if (user) return { user, error: null }

    // Fallback: build user from auth token metadata (profile row may be missing)
    const meta = data.user.user_metadata ?? {}
    const fallback: User = {
      id: data.user.id,
      email: data.user.email!,
      username: meta.username ?? data.user.email!.split('@')[0].replace(/[^a-z0-9_]/gi, '_'),
      full_name: meta.full_name ?? data.user.email!.split('@')[0],
      avatar_url: meta.avatar_url ?? null,
      plan: 'free',
      premium_purchased_at: null,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at ?? data.user.created_at,
    }
    return { user: fallback, error: null }
  },

  /** Sign up — the DB trigger auto-creates the public.users profile. */
  async signUp(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ user: User; error: null } | { user: null; error: string }> {
    const cleanEmail = email.trim().toLowerCase()
    const username = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase()
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: fullName.trim(), username } },
    })
    if (error) return { user: null, error: friendlyAuthError(error.message) }
    if (!data.user) return { user: null, error: 'Erreur lors de la création du compte.' }

    // If email confirmation is required, inform the user
    if (!data.session) {
      return { user: null, error: 'Vérifie ta boîte mail pour confirmer ton compte.' }
    }

    // The DB trigger creates the profile row — retry up to 3 times
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 1000))
      const user = await fetchProfile(data.user.id)
      if (user) return { user, error: null }
    }
    return { user: null, error: 'Profil introuvable. Réessaie dans quelques secondes.' }
  },

  /** Sign out. Ne bloque jamais le client même si Supabase est injoignable. */
  async signOut(): Promise<void> {
    try {
      await withTimeout(supabase.auth.signOut(), 8_000, 'Déconnexion')
    } catch (e) {
      console.error('[auth] signOut:', e)
    }
  },

  /** Send a password reset email. */
  async resetPassword(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
    return { error: error ? friendlyAuthError(error.message) : null }
  },

  /** Update the current user profile. */
  async updateProfile(
    updates: Partial<Pick<User, 'full_name' | 'username' | 'avatar_url'>>,
  ): Promise<{ user: User | null; error: string | null }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { user: null, error: 'Non authentifié.' }

    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) return { user: null, error: error.message }
    return { user: data as User, error: null }
  },

  /** Upgrade to premium (called after successful Stripe payment). */
  async upgradeToPremium(): Promise<{ user: User | null; error: string | null }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { user: null, error: 'Non authentifié.' }

    const { data, error } = await supabase
      .from('users')
      .update({
        plan: 'premium',
        premium_purchased_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) return { user: null, error: error.message }
    return { user: data as User, error: null }
  },
}

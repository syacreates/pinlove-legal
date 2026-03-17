/**
 * Auth Service
 *
 * Wraps Supabase auth with a clean interface.
 * In V1 the mock mode uses localStorage to simulate authentication
 * so the app is fully functional without a real Supabase instance.
 */

import type { User } from '@/lib/types'
import { DEMO_USER } from '@/data/demo'
import { generateId } from '@/lib/utils'

// ── In-memory store (mock mode) ───────────────────────────────────────────────
let _currentUser: User | null = null

// Seed a logged-in user in demo mode
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('pinlove_user')
  if (stored) {
    try { _currentUser = JSON.parse(stored) } catch { /* ignore */ }
  }
}

function persistUser(user: User | null) {
  if (typeof window === 'undefined') return
  if (user) localStorage.setItem('pinlove_user', JSON.stringify(user))
  else       localStorage.removeItem('pinlove_user')
}

// ── Public API ────────────────────────────────────────────────────────────────

export const authService = {
  /** Returns the currently signed-in user, or null. */
  getCurrentUser(): User | null {
    return _currentUser
  },

  /** Sign in with email + password (mock: accepts any non-empty values). */
  async signIn(email: string, _password: string): Promise<{ user: User; error: null } | { user: null; error: string }> {
    await delay(600)
    if (!email) return { user: null, error: 'Email requis.' }

    const user: User = {
      ...DEMO_USER,
      email,
      id: generateId(),
    }
    _currentUser = user
    persistUser(user)
    return { user, error: null }
  },

  /** Sign up (mock: creates a new user from the form data). */
  async signUp(
    email: string,
    _password: string,
    fullName: string,
  ): Promise<{ user: User; error: null } | { user: null; error: string }> {
    await delay(800)
    if (!email || !fullName) return { user: null, error: 'Tous les champs sont requis.' }

    const user: User = {
      id: generateId(),
      email,
      username: email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase(),
      full_name: fullName,
      avatar_url: `https://i.pravatar.cc/150?u=${email}`,
      plan: 'free',
      premium_purchased_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    _currentUser = user
    persistUser(user)
    return { user, error: null }
  },

  /** Sign out. */
  async signOut(): Promise<void> {
    await delay(300)
    _currentUser = null
    persistUser(null)
  },

  /** Send a password reset email (mock: always succeeds). */
  async resetPassword(email: string): Promise<{ error: string | null }> {
    await delay(700)
    if (!email) return { error: 'Email requis.' }
    console.info(`[mock] Password reset email sent to ${email}`)
    return { error: null }
  },

  /** Update the current user profile. */
  async updateProfile(updates: Partial<Pick<User, 'full_name' | 'username' | 'avatar_url'>>): Promise<{ user: User | null; error: string | null }> {
    await delay(500)
    if (!_currentUser) return { user: null, error: 'Non authentifié.' }

    _currentUser = {
      ..._currentUser,
      ...updates,
      updated_at: new Date().toISOString(),
    }
    persistUser(_currentUser)
    return { user: _currentUser, error: null }
  },

  /** Upgrade to premium (called after successful payment). */
  async upgradeToPremium(): Promise<{ user: User | null; error: string | null }> {
    await delay(400)
    if (!_currentUser) return { user: null, error: 'Non authentifié.' }

    _currentUser = {
      ..._currentUser,
      plan: 'premium',
      premium_purchased_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    persistUser(_currentUser)
    return { user: _currentUser, error: null }
  },
}

// ── Utility ───────────────────────────────────────────────────────────────────
function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

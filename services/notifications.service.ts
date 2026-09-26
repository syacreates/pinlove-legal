/**
 * Notifications Service — notifications in-app (Rencontres).
 * Lecture et « lu » uniquement : elles sont créées côté serveur.
 */

import { supabase } from '@/lib/supabase'
import type { AppNotification } from '@/lib/types'

export const notificationsService = {
  async list(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) { console.error('[notifications] list:', error.message); return [] }
    return (data ?? []) as AppNotification[]
  },

  async unreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
    if (error) return 0
    return count ?? 0
  },

  async markAllRead(userId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
  },

  /** Appelle `onInsert` à chaque nouvelle notification (Supabase Realtime). Renvoie la fonction de désabonnement. */
  subscribe(userId: string, onInsert: (n: AppNotification) => void): () => void {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => onInsert(payload.new as AppNotification),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },
}

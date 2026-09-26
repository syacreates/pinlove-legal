/**
 * Chat du jour J — ouvert de H-2 à H+3 (ou après un « revoir » mutuel).
 * La fenêtre est imposée par la policy RLS mm_insert_window : un envoi hors
 * fenêtre est refusé par la base.
 */

import { supabase } from '@/lib/supabase'
import type { MomentMessage } from '@/lib/types'

export const chatService = {
  async list(momentId: string): Promise<MomentMessage[]> {
    const { data, error } = await supabase
      .from('moment_messages')
      .select('*')
      .eq('moment_id', momentId)
      .order('created_at', { ascending: true })
      .limit(200)
    if (error) { console.error('[chat] list:', error.message); return [] }
    return (data ?? []) as MomentMessage[]
  },

  async send(momentId: string, senderId: string, body: string): Promise<{ message: MomentMessage | null; error: string | null }> {
    const { data, error } = await supabase
      .from('moment_messages')
      .insert({ moment_id: momentId, sender_id: senderId, body: body.trim() })
      .select()
      .single()
    if (error) {
      const closed = error.message.toLowerCase().includes('row-level security')
      return { message: null, error: closed ? 'Le chat est fermé pour ce moment.' : error.message }
    }
    return { message: data as MomentMessage, error: null }
  },

  subscribe(momentId: string, onInsert: (m: MomentMessage) => void): () => void {
    const channel = supabase
      .channel(`moment_messages:${momentId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'moment_messages', filter: `moment_id=eq.${momentId}` },
        payload => onInsert(payload.new as MomentMessage),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },
}

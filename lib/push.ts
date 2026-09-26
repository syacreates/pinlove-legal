/**
 * Push natif (Capacitor + Firebase Cloud Messaging).
 *
 * N'agit que dans l'app native (iOS / Android) : dans un navigateur, rien ne
 * se passe et les notifications restent in-app. Le jeton de l'appareil est
 * enregistré via la RPC register_device_token ; l'envoi est fait par l'Edge
 * Function supabase/functions/send-push.
 */

import { Capacitor } from '@capacitor/core'
import { supabase } from '@/lib/supabase'

let started = false

/** Demande l'autorisation, enregistre l'appareil et ouvre `url` quand on touche une notification. */
export async function registerPush(onOpen: (url: string) => void): Promise<void> {
  if (started || !Capacitor.isNativePlatform()) return
  started = true

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    let permission = await PushNotifications.checkPermissions()
    if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
      permission = await PushNotifications.requestPermissions()
    }
    if (permission.receive !== 'granted') return

    await PushNotifications.addListener('registration', ({ value }) => {
      supabase
        .rpc('register_device_token', { p_token: value, p_platform: Capacitor.getPlatform() })
        .then(({ error }) => { if (error) console.error('[push] register:', error.message) })
    })
    await PushNotifications.addListener('registrationError', err => {
      console.error('[push] registration error:', err.error)
    })
    await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
      const url = (notification.data as { url?: string } | undefined)?.url
      if (url?.startsWith('/')) onOpen(url)
    })

    await PushNotifications.register()
  } catch (e) {
    // Plugin natif absent (app pas encore recompilée) : on reste en in-app.
    started = false
    console.error('[push] indisponible:', e)
  }
}

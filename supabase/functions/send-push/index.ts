// PinLove — Edge Function « send-push »
//
// Appelée par le trigger notifications_push (pg_net) pour chaque notification
// insérée. Envoie un push natif via Firebase Cloud Messaging (API HTTP v1,
// gratuite) à tous les appareils du destinataire, puis renseigne pushed_at.
//
// Secrets (supabase secrets set …) :
//   PUSH_WEBHOOK_SECRET        même valeur que le secret Vault « push_webhook_secret »
//   FIREBASE_SERVICE_ACCOUNT   JSON du compte de service Firebase (une ligne)
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis par Supabase.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { notificationUrl, pushMessage } from './messages.ts'

interface ServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// ── Jeton OAuth Google (JWT signé RS256 avec la clé du compte de service) ────

let cachedToken: { value: string; expiresAt: number } | null = null

function base64url(data: ArrayBuffer | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function googleAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`))
  const jwt = `${header}.${claims}.${base64url(signature)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  if (!res.ok) throw new Error(`OAuth Google ${res.status}: ${await res.text()}`)
  const json = await res.json() as { access_token: string; expires_in: number }
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return json.access_token
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async req => {
  if (req.headers.get('Authorization') !== `Bearer ${Deno.env.get('PUSH_WEBHOOK_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { notification_id } = await req.json() as { notification_id?: string }
  if (!notification_id) return new Response('notification_id manquant', { status: 400 })

  const { data: notif } = await supabase
    .from('notifications')
    .select('id, user_id, type, moment_id, payload, pushed_at')
    .eq('id', notification_id)
    .maybeSingle()
  if (!notif || notif.pushed_at) return new Response('rien à envoyer')

  const message = pushMessage(notif.type, notif.payload ?? {})
  if (!message) return new Response('type sans push')

  const { data: devices } = await supabase
    .from('device_tokens')
    .select('token')
    .eq('user_id', notif.user_id)
  if (!devices?.length) return new Response('aucun appareil')

  const sa = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}') as ServiceAccount
  const accessToken = await googleAccessToken(sa)
  const url = notificationUrl(notif.type, notif.moment_id)

  let sent = 0
  for (const { token } of devices) {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: message.title, body: message.body },
          data: { url, type: notif.type, notification_id: notif.id },
          apns: { payload: { aps: { sound: 'default' } } },
        },
      }),
    })
    if (res.ok) {
      sent++
    } else if (res.status === 404 || res.status === 400) {
      // Jeton expiré ou invalide : on l'oublie.
      await supabase.from('device_tokens').delete().eq('token', token)
    } else {
      console.error('FCM', res.status, await res.text())
    }
  }

  if (sent > 0) {
    await supabase.from('notifications').update({ pushed_at: new Date().toISOString() }).eq('id', notif.id)
  }
  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})

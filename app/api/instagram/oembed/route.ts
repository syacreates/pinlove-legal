/**
 * GET /api/instagram/oembed?url=<instagram_url>
 * Proxy vers l'endpoint oEmbed de Meta (Instagram).
 * Utilise APP_ID|CLIENT_TOKEN — pas de login utilisateur requis.
 * Retourne : { title, author_name, thumbnail_url, ... }
 */

import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Paramètre url manquant.' }, { status: 400 })
  }

  const appId     = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'Configuration Meta manquante.' }, { status: 500 })
  }

  const accessToken = `${appId}|${appSecret}`

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/instagram_oembed` +
      `?url=${encodeURIComponent(url)}&access_token=${accessToken}&fields=title,author_name,thumbnail_url`,
      {
        headers: {
          'User-Agent': 'PinLove App (contact@pinlove.app)',
        },
        signal: AbortSignal.timeout(8000),
      },
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: err?.error?.message ?? `Meta oEmbed: ${res.status}` },
        { status: res.status },
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau.'
    console.error('[instagram/oembed]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

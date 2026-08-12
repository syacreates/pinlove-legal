/**
 * GET /api/tiktok/oembed?url=<tiktok_url>
 * Proxy vers l'endpoint oEmbed public de TikTok.
 * Évite les erreurs CORS côté client.
 * Retourne : { title, author_name, thumbnail_url, ... }
 */

import { type NextRequest, NextResponse } from 'next/server'

const SHARE_USER_AGENT =
  'Mozilla/5.0 (compatible; PinLove/1.0; +https://pinlove-legal.vercel.app)'

/**
 * Le bouton "Partager" natif de TikTok (celui utilisé par l'extension de
 * partage iOS/Android) génère un lien court vm.tiktok.com / vt.tiktok.com.
 * L'API oEmbed de TikTok ne suit pas ces redirections elle-même et renvoie
 * une erreur 400 si on le lui envoie tel quel — il faut résoudre le lien
 * complet nous-mêmes avant d'appeler oEmbed.
 */
async function resolveShareLink(url: string): Promise<string> {
  let current = url
  for (let i = 0; i < 3; i++) {
    let host: string
    try {
      host = new URL(current).hostname
    } catch {
      return current
    }
    if (!/^(vm|vt)\.tiktok\.com$/.test(host)) return current

    const res = await fetch(current, {
      method: 'HEAD',
      redirect: 'manual',
      headers: { 'User-Agent': SHARE_USER_AGENT },
      signal: AbortSignal.timeout(5000),
    })
    const location = res.headers.get('location')
    if (!location) return current
    current = new URL(location, current).toString()
  }
  return current
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Paramètre url manquant.' }, { status: 400 })
  }

  try {
    const resolvedUrl = await resolveShareLink(url)
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`,
      {
        headers: {
          'User-Agent': SHARE_USER_AGENT,
        },
        // 8 secondes max
        signal: AbortSignal.timeout(8000),
      },
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: `TikTok oEmbed a retourné ${res.status}` },
        { status: res.status },
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau.'
    console.error('[tiktok/oembed]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

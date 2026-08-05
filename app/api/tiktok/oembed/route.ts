/**
 * GET /api/tiktok/oembed?url=<tiktok_url>
 * Proxy vers l'endpoint oEmbed public de TikTok.
 * Évite les erreurs CORS côté client.
 * Retourne : { title, author_name, thumbnail_url, ... }
 */

import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Paramètre url manquant.' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; PinLove/1.0; +https://pinlove-legal.vercel.app)',
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

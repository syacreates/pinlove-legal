import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Diagnostic de connexion à Supabase — ouvrir /api/health dans un navigateur.
 * N'expose aucun secret : seulement la présence des variables, l'hôte Supabase
 * (déjà public côté client) et le résultat d'un appel à l'endpoint de santé.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const result: Record<string, unknown> = {
    supabaseUrlSet: !!url,
    supabaseAnonKeySet: !!anonKey,
    supabaseHost: null,
    reachable: false,
    status: null,
    ms: null,
    error: null,
  }

  if (!url || !anonKey) {
    result.error = 'Variables NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes sur Vercel.'
    return NextResponse.json(result, { status: 500 })
  }

  try {
    result.supabaseHost = new URL(url).host
  } catch {
    result.error = `NEXT_PUBLIC_SUPABASE_URL n'est pas une URL valide.`
    return NextResponse.json(result, { status: 500 })
  }

  const started = Date.now()
  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/auth/v1/health`, {
      headers: { apikey: anonKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    result.status = res.status
    result.reachable = res.ok
    if (res.status === 401) result.error = 'Clé anon refusée par Supabase (NEXT_PUBLIC_SUPABASE_ANON_KEY incorrecte).'
    else if (!res.ok) result.error = `Supabase a répondu ${res.status}.`
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e)
  }
  result.ms = Date.now() - started

  return NextResponse.json(result, { status: result.reachable ? 200 : 502 })
}

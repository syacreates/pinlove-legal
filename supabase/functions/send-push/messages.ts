// Textes des notifications Rencontres — utilisés par l'Edge Function send-push
// (push natif) et par l'app (liste in-app). Aucun type ne correspond à un refus.
// TypeScript pur, sans dépendance : importable depuis Deno et depuis Next.

export interface NotificationText {
  title: string
  body: string
}

type Payload = Record<string, unknown>

function when(iso: unknown): string {
  if (typeof iso !== 'string') return ''
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Paris',
  }).format(new Date(iso))
}

/** Écran ouvert quand on touche la notification. */
export function notificationUrl(type: string, momentId: string | null): string {
  if (!momentId) return '/rencontres'
  return type === 'safety_check' ? `/rencontres/moments/${momentId}/jour-j` : `/rencontres/moments/${momentId}`
}

export function pushMessage(type: string, p: Payload): NotificationText | null {
  const title = String(p.title ?? 'Ton moment')
  const place = String(p.place_name ?? '')
  switch (type) {
    case 'moment_request':
      return { title: 'Quelqu’un est partant·e', body: `Pour « ${title} » à ${place}. Tu peux valider la demande.` }
    case 'moment_matched':
      return { title: 'C’est calé !', body: `« ${title} » à ${place}, ${when(p.scheduled_at)}.` }
    case 'eve_check':
      return { title: 'Toujours partant·e ?', body: `« ${title} » à ${place}, ${when(p.scheduled_at)}. Confirme en un geste.` }
    case 'moment_confirmed':
      return { title: 'Rencontre confirmée', body: `Vous êtes tous les deux partants pour « ${title} » à ${place}.` }
    case 'h2_reminder':
      return { title: 'C’est dans 2 heures', body: `« ${title} » à ${place}. ${String(p.payment_rule ?? 'Chacun sa part')}. Itinéraire dans l’app.` }
    case 'moment_cancelled':
      return { title: 'Moment annulé', body: `« ${title} » à ${place} n’aura pas lieu.` }
    case 'meet_again':
      return { title: 'Vous pouvez vous revoir', body: `${String(p.first_name ?? 'L’autre personne')} aimerait aussi vous revoir. Le chat est ouvert.` }
    case 'shared_memory':
      return { title: 'Souvenir ajouté à ta carte', body: `« ${title} » à ${place} est maintenant un souvenir commun, daté sur vos deux cartes.` }
    case 'safety_check':
      return { title: 'Tout va bien ?', body: `« ${title} » est terminé. Un geste pour nous dire que tout va bien.` }
    default:
      return null
  }
}

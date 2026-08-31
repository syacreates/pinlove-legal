import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
}

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-neutral-800 legal-content">
      <h1 className="text-3xl font-bold mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-neutral-500 mb-8">Dernière mise à jour : 19 mars 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold mb-2">1. Qui sommes-nous</h2>
          <p>PinLove (« nous ») est une application web qui aide les utilisateurs à enregistrer et organiser des lieux réels découverts sur des réseaux sociaux comme TikTok et Instagram. PinLove est géré comme un projet individuel.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. Données que nous collectons</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Données de compte :</strong> adresse email, nom affiché et nom d&apos;utilisateur fournis à l&apos;inscription.</li>
            <li><strong>Données de lieux :</strong> noms de lieux, adresses, descriptions et notes que tu enregistres explicitement.</li>
            <li><strong>Métadonnées de vidéos TikTok :</strong> quand tu colles l&apos;URL publique d&apos;une vidéo TikTok, nous récupérons uniquement la description publique et les hashtags de la vidéo via l&apos;API TikTok Display. Nous n&apos;accédons jamais à ton compte TikTok, tes abonnés, tes messages ou toute donnée privée.</li>
            <li><strong>Géolocalisation :</strong> utilisée uniquement sur ton appareil pour afficher ta position sur la carte et calculer des itinéraires. Elle n&apos;est jamais stockée sur nos serveurs.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. Comment nous utilisons tes données</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Pour fournir le service principal (enregistrer et afficher tes lieux).</li>
            <li>Pour permettre les fonctionnalités de partage optionnelles avec les amis que tu invites explicitement.</li>
            <li>Nous ne vendons jamais tes données à des tiers.</li>
            <li>Nous n&apos;utilisons pas tes données à des fins publicitaires.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. Utilisation de l&apos;API TikTok</h2>
          <p>PinLove utilise l&apos;API TikTok Display uniquement pour lire les métadonnées publiques (description, hashtags) des vidéos dont les URL sont soumises par toi. Cette action est toujours initiée explicitement par toi. Nous ne stockons aucun identifiant TikTok. Nous ne publions, modifions ni supprimons aucun contenu TikTok.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. Stockage des données</h2>
          <p>Tes données sont stockées de façon sécurisée dans Supabase (PostgreSQL), hébergé dans l&apos;Union européenne. Nous appliquons une sécurité au niveau des lignes (RLS) afin que chaque utilisateur ne puisse accéder qu&apos;à ses propres données.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">6. Tes droits</h2>
          <p>Tu peux demander la suppression de ton compte et de toutes les données associées à tout moment en nous contactant à <a href="mailto:contact@pinlove.app" className="text-brand-500 underline">contact@pinlove.app</a>.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">7. Contact</h2>
          <p>Pour toute question relative à la confidentialité : <a href="mailto:contact@pinlove.app" className="text-brand-500 underline">contact@pinlove.app</a></p>
        </div>
      </section>
    </main>
  )
}

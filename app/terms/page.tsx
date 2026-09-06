import type { Metadata } from 'next'
import { FREE_PLAN_LIMIT } from '@/lib/constants'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
}

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-neutral-800 legal-content">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-3xl font-bold">Conditions d&apos;utilisation</h1>
        <ThemeToggle className="mt-1 flex-shrink-0" />
      </div>
      <p className="text-sm text-neutral-500 mb-8">Dernière mise à jour : 19 mars 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold mb-2">1. Acceptation</h2>
          <p>En utilisant PinLove, tu acceptes les présentes Conditions. Si tu n&apos;es pas d&apos;accord, merci de ne pas utiliser le service.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. Description du service</h2>
          <p>PinLove est une application web qui permet aux utilisateurs inscrits d&apos;enregistrer, organiser et partager des lieux réels. Les utilisateurs peuvent importer des suggestions de lieux en soumettant des URL publiques de vidéos TikTok ou Instagram.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. Usage autorisé</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Tu ne peux soumettre que des URL de vidéos publiques pour lesquelles tu as le droit de demander les métadonnées.</li>
            <li>Tu ne peux pas utiliser PinLove pour extraire, collecter ou redistribuer du contenu TikTok en masse.</li>
            <li>Tu ne peux pas utiliser PinLove à des fins illégales ou en violation des Conditions d&apos;utilisation de TikTok.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. Contenu utilisateur</h2>
          <p>Tu conserves la propriété des lieux et notes que tu enregistres. Tu accordes à PinLove une licence limitée pour stocker et afficher ce contenu afin de fournir le service.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. Offres gratuite et premium</h2>
          <p>L&apos;offre gratuite est limitée à {FREE_PLAN_LIMIT} lieux enregistrés. L&apos;accès premium est disponible via un paiement unique. Les achats sont définitifs et non remboursables, sauf disposition légale contraire.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">6. Avertissement</h2>
          <p>PinLove est fourni « tel quel », sans garantie d&apos;aucune sorte. Nous ne sommes pas responsables de l&apos;exactitude des informations de lieux extraites de contenus tiers.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">7. Modifications</h2>
          <p>Nous pouvons mettre à jour ces Conditions à tout moment. La poursuite de l&apos;utilisation du service vaut acceptation des Conditions mises à jour.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">8. Contact</h2>
          <p><a href="mailto:contact@pinlove.app" className="text-brand-500 underline">contact@pinlove.app</a></p>
        </div>
      </section>
    </main>
  )
}

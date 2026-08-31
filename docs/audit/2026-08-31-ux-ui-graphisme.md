# Audit UX/UI & graphisme — 2026-08-31

Audit du produit déployé sur `sya-creates.vercel.app`, mené en faisant tourner ce
dépôt en local (`npm install && npm run dev`) avec une session Supabase simulée,
puis capture d'écran (Chromium/Playwright) de 17 routes en mobile/tablette/desktop.
Rapport visuel complet avec captures : voir le lien Artifact partagé dans la
conversation qui a produit ce fichier.

Chaque tâche ci-dessous est autonome : fichier(s) exact(s), constat, correctif
proposé. Traiter dans l'ordre des priorités.

---

## P0 — Critique

### 1. CGU : variable non interpolée affichée en clair
**Fichier :** `app/terms/page.tsx:40`

Le texte publié affiche littéralement `{FREE_PLAN_LIMIT}` au lieu de `5`, dans
un document contractuel.

```tsx
// actuel (ligne 40)
<p>The free plan is limited to {'{FREE_PLAN_LIMIT}'} saved places. …</p>
```

**À faire :**
- Importer `FREE_PLAN_LIMIT` depuis `@/lib/constants` en haut du fichier.
- Remplacer `{'{FREE_PLAN_LIMIT}'}` par `{FREE_PLAN_LIMIT}` (expression JSX,
  sans les accolades littérales autour du nom).
- Vérifier qu'aucune autre page statique (`app/privacy/page.tsx`) n'a le même
  défaut — grep `{'{` dans `app/` pour être sûr qu'il n'y a pas d'autre
  occurrence.

---

### 2. Page Premium (upsell) quasi illisible — texte crème sur fond crème
**Fichier :** `app/(app)/pricing/page.tsx` (lignes ~107–169)

Le ramp `neutral` de `tailwind.config.ts` a été inversé pour l'usage
« texte clair sur fond sombre » qui domine le reste de l'app
(`neutral-900` = `#F2ECD9`, crème clair). Toutes les autres pages/composants
qui posent une carte claire (`bg-paper`) utilisent `text-ink` dessus — sauf
`pricing/page.tsx`, qui réutilise `text-neutral-900/700/600/500/400` par
erreur. Résultat mesuré (contraste WCAG) :

| Paire | Ratio | Norme AA (4.5:1) |
|---|---|---|
| `text-neutral-900` sur `bg-paper` | 1.00:1 | Échec |
| `text-neutral-700` sur `bg-paper` | 1.07:1 | Échec |
| `text-neutral-600` sur `bg-paper` | 1.16:1 | Échec |
| `text-neutral-500` sur `bg-paper` | 1.35:1 | Échec |
| `text-neutral-400` sur `bg-paper` | 2.33:1 | Échec |
| `text-ink` sur `bg-paper` (repère, utilisé partout ailleurs) | 14.12:1 | OK |

**À faire (dans `app/(app)/pricing/page.tsx`) :**
- Ligne 109 : `text-neutral-900` → `text-ink` (prix « 9,99 € »)
- Ligne 110 : `text-neutral-500` → `text-ink/60` (« une fois »)
- Ligne 112 : `text-neutral-400` → `text-ink/50` (« Pas d'abonnement… »)
- Ligne 121 : `text-neutral-900` → `text-ink` (libellé fonctionnalité)
- Ligne 122 : `text-neutral-500` → `text-ink/60` (sous-texte fonctionnalité)
- Lignes 140/143 : `text-neutral-400` → `text-ink/50` (mentions paiement sécurisé)
- Ligne 152 : `text-neutral-500` → `text-ink/60` (« Fonctionnalité »)
- Ligne 153 : `text-neutral-700` → `text-ink/70` (« Gratuit »)
- Ligne 164 : `text-neutral-600` → `text-ink/70` (libellé ligne du tableau)
- Ligne 165 : `text-neutral-400` → `text-ink/50` (valeur colonne Gratuit)
- Ligne 171 : `text-neutral-400` → `text-ink/50` (footer « Questions ? »)
- `text-neutral-900`/`text-neutral-500` utilisés dans les deux early-returns
  (déjà-premium, succès — lignes 50/51/65/66) sont corrects tels quels : ces
  blocs n'ont pas de wrapper `bg-paper`, ils héritent du fond sombre par
  défaut de l'app. Ne pas y toucher.
- `text-brand-500` (ligne 154, « Premium ») mesure 3.38:1 — passe le seuil
  AA-large (3:1, texte ≥ 18px/14px gras) mais pas le seuil texte normal
  (4.5:1). Vu que ce libellé est en `text-xs font-semibold`, remplacer par
  `text-brand-600` (4.39:1, toujours limite) ou repasser en `text-ink` avec un
  fond `bg-brand-50` derrière le badge pour garantir la lisibilité.

---

## P1 — Majeur

### 3. Wordmark « PINLOVE » : lettres qui se chevauchent
**Fichiers :** `app/page.tsx` (usage), `app/globals.css` / `tailwind.config.ts`
(déclaration de `font-display` / `--font-stencil`)

Sur l'écran de démarrage (`app/page.tsx:42`, `<h1 className="font-display
font-extrabold uppercase text-4xl …">PinLove</h1>`), les lettres se
chevauchent visiblement (I/N notamment) — confirmé identique en mobile et
desktop, donc un problème de crénage/graisse de la police stencil à cette
taille, pas un problème de layout.

**À faire :**
- Ajouter un `letter-spacing` positif ciblé sur ce wordmark (tester
  `tracking-wider` ou une valeur custom `0.04em`–`0.08em`) plutôt que de
  toucher au tracking global de `font-display`, utilisé ailleurs (titres de
  page) sans ce défaut visible à plus petite taille.
- Vérifier le poids de police chargé pour `--font-stencil` : si plusieurs
  graisses existent, un poids trop gras pour ce dessin de lettre stencil est
  la cause la plus probable du chevauchement.
- Revérifier à l'écran (pas juste dans le code) après le fix — c'est un bug
  visuel pur, un `git diff` ne suffit pas à le valider.

---

### 4. Pages légales entièrement en anglais dans un produit 100% français
**Fichiers :** `app/terms/page.tsx`, `app/privacy/page.tsx`

Toutes les autres pages (onboarding, connexion, inscription, accueil, carte,
profil, amis) sont en français. Les deux pages légales sont en anglais de
bout en bout, alors que le lien qui y mène (`app/signup/page.tsx`) est en
français : « tu acceptes nos *Conditions d'utilisation* et notre *Politique
de confidentialité* ».

**À faire :**
- Traduire les 8 sections de `app/terms/page.tsx` en français.
- Traduire les 7 sections de `app/privacy/page.tsx` en français.
- Corriger le bug #1 (`{FREE_PLAN_LIMIT}`) dans la même passe, vu que c'est le
  même fichier.
- Mettre à jour `export const metadata = { title: 'Terms of Service | PinLove' }`
  → `'Conditions d'utilisation | PinLove'` (et l'équivalent dans
  `privacy/page.tsx`) pour que l'onglet du navigateur soit cohérent aussi.

---

### 5. Inscription : contradiction sur la longueur minimale du mot de passe
**Fichier :** `app/signup/page.tsx`

Le placeholder du champ mot de passe dit « 8 caractères min. », le texte
d'aide juste en dessous dit « Minimum 6 caractères ».

**À faire :**
- Chercher la vraie règle appliquée (validation client dans ce fichier, et/ou
  configuration Supabase Auth — 6 caractères par défaut sauf changement de
  policy) et aligner les deux textes dessus.
- Si un seul des deux messages suffit (le placeholder OU le texte d'aide),
  supprimer le second plutôt que de dupliquer l'information.

---

## P2 — Mineur / robustesse

### 6. Avatar : pas de repli si l'image échoue à charger
**Fichier :** `components/ui/Avatar.tsx`

Le composant calcule déjà des initiales de repli (`initials`, lignes 22–27)
pour le cas `!src` — mais rien ne déclenche ce repli si `src` existe mais que
l'image échoue à charger (URL expirée, CDN down, ad-blocker). Le
`next/image` (ligne 38) n'a pas de `onError`.

**À faire :**
```tsx
const [failed, setFailed] = useState(false)
// …
{src && !failed ? (
  <Image src={src} alt={alt} width={px} height={px}
    className="object-cover w-full h-full" unoptimized
    onError={() => setFailed(true)} />
) : (
  <span className="font-semibold text-white">{initials}</span>
)}
```

---

### 7. Aucune mise en page dédiée au-delà du mobile
**Fichiers :** `app/globals.css` (`.page-container`, ligne ~50-52),
`app/(app)/layout.tsx`

`.page-container` plafonne à `max-w-lg` sur toutes les tailles d'écran — à
1440px de large, l'app reste une colonne mobile centrée dans du vide, y
compris la barre de navigation basse en mode « onglets de smartphone ».

**À faire (portée volontairement limitée — ne pas refondre tout le shell
applicatif pour ça) :**
- Prioriser les pages publiques les plus susceptibles d'être visitées depuis
  un ordinateur : `app/page.tsx` (splash), `app/login/page.tsx`,
  `app/signup/page.tsx`, `app/terms/page.tsx`, `app/privacy/page.tsx`.
- Les écrans applicatifs (`(app)/home`, `(app)/map`, etc.) peuvent rester
  volontairement mobile-first — c'est un choix de produit défendable pour une
  app pensée pour être installée sur téléphone.

---

### 8. Onboarding : aucun titre `<h1>`
**Fichier :** `app/onboarding/page.tsx`

Seule route publique (sur 14 testées) sans `<h1>`.

**À faire :** promouvoir le titre d'étape déjà affiché à l'écran (ex. « Tous
tes spots, en un endroit ») en `<h1>` (visuellement inchangé, juste la
balise), ou ajouter un `<h1 className="sr-only">Découvrir PinLove</h1>` si le
titre visuel ne doit pas changer de niveau sémantique par étape.

---

## Notes de méthode (pour la session qui traite ces tâches)

- Toutes les captures ont été prises sur un serveur `next dev` local avec des
  variables d'environnement placeholder (`.env.local` non commité) — aucune
  vraie donnée Supabase/Stripe n'a été touchée.
- Les photos hotlinkées (Unsplash, pravatar.cc démo) et les tuiles de carte
  OpenStreetMap n'ont pas pu charger dans le sandbox réseau utilisé pour cet
  audit — ce n'est pas remonté comme bug, exclu volontairement des tâches
  ci-dessus.
- Les captures pleine page montrent la barre de navigation basse dupliquée au
  milieu du scroll : artefact connu de la capture `fullPage` avec des
  éléments `position: fixed`, vérifié par une capture viewport séparée — pas
  un bug réel, ne pas chercher à le corriger.

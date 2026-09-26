// PinLove — thème "Cerise" (fond crème, accent cerise).
// Source unique des couleurs : tailwind.config.ts importe ce fichier. Les
// couleurs qui changent en mode sombre (fond, surfaces, textes, lignes) sont
// des variables CSS définies dans app/globals.css à partir de ces valeurs
// (thème clair) et de leur déclinaison sombre.
// À utiliser directement là où Tailwind ne passe pas (styles inline, HTML
// des marqueurs Leaflet, SVG…).
//
// Règle pour les écrans : fond `bg-background`, cartes `bg-surface`, texte
// `text-neutral-900`, texte secondaire `text-mist`, méta `text-muted` (tous
// thémés). `ink` / `paper` sont fixes : à réserver aux éléments qui restent
// clairs dans les deux thèmes.

export const colors = {
  // Fond & surfaces
  background: '#F7F3EF', // fond crème chaud de tous les écrans
  surface: '#FFFFFF',    // cartes, champs, barres
  placeholder: '#E4DDD7',// photos / vignettes vides
  mapGround: '#ECE6E0',

  // Texte
  ink: '#1E1A1A',        // texte principal, bouton secondaire plein
  inkSoft: '#4A4341',    // texte secondaire long
  muted: '#6B6360',      // méta, légendes

  // Accent cerise
  accent: '#C8243F',     // CTA, pins actifs, sélection
  accentDark: '#9E1B31', // texte sur fond accentLight
  accentLight: '#FBEDEF',// fond d'un choix sélectionné
  accentTag: '#F6DDE1',  // tags / badges

  // Lignes & états
  line: '#D9D0C8',       // bordures de champs, chips
  divider: '#E4DDD7',    // séparateurs de barres
  dashed: '#B3A79E',     // places libres, options
  success: '#2F6B45',
  danger: '#DC2626',     // alerte, 112, suppression
  onAccent: '#FFFFFF',
  water: '#C9DCE6',
} as const

export const fonts = {
  display: 'var(--font-fraunces)', // Fraunces 600
  body: 'var(--font-dm-sans)',     // DM Sans 400 / 500 / 700
} as const

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const
export const radius = { sm: 10, md: 12, lg: 14, xl: 16, card: 20, pill: 999 } as const
export const layout = { screenPadding: 20, touchTarget: 44, ctaHeight: 54 } as const

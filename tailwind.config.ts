import type { Config } from 'tailwindcss'
import { colors as tokens } from './lib/design-tokens'

// Reads a "R G B" CSS variable (see app/globals.css) so these colors can
// flip between the light and dark themes without touching every className
// that uses them, while still supporting Tailwind's /opacity modifiers.
function themed(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`
}

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PinLove — thème "Rencontres" (fond crème chaud, accent cerise).
        // Valeurs de référence : lib/design-tokens.ts.
        //
        // Les anciens noms de tokens (petrol/surface/mist/brass/paper…) sont
        // conservés pour ne pas réécrire chaque className, mais pointent
        // désormais vers la nouvelle palette :
        //   petrol  → background (fond de page)     surface → cartes / barres
        //   mist    → inkSoft / muted (texte sec.)  paper   → surface blanche
        //   brass   → accent cerise                 ink     → texte principal
        // Les couleurs "chrome" restent pilotées par des variables CSS pour
        // que le mode sombre continue de fonctionner (app/globals.css).
        petrol: {
          DEFAULT: themed('--c-petrol'),
          soft:    themed('--c-petrol-soft'),
        },
        surface: {
          DEFAULT: themed('--c-surface'),
          2:       themed('--c-surface-2'),
        },
        brass: {
          DEFAULT: tokens.accent,
          dim:     tokens.accentDark,
        },
        cerise: tokens.accent,
        paper:  tokens.surface,
        ink: {
          DEFAULT: tokens.ink,
          soft:    tokens.inkSoft,
        },
        mist: {
          DEFAULT: themed('--c-mist'),
          2:       themed('--c-mist-2'),
        },
        // Tokens sémantiques du thème (noms identiques à lib/design-tokens.ts)
        background: themed('--c-petrol'),
        accent: {
          DEFAULT: tokens.accent,
          dark:    tokens.accentDark,
          light:   tokens.accentLight,
          tag:     tokens.accentTag,
          // Texte cerise lisible sur fond teinté bg-accent/10, dans les deux thèmes
          ink:     themed('--c-accent-ink'),
        },
        'on-accent': tokens.onAccent,
        muted:       themed('--c-mist-2'),
        line:        themed('--c-line'),
        divider:     themed('--c-divider'),
        dash:        tokens.dashed,
        placeholder: themed('--c-placeholder'),
        success:     tokens.success,
        danger:      tokens.danger,
        water:       tokens.water,
        // Rampe brand recalculée autour de l'accent cerise (brand-500)
        brand: {
          50:  tokens.accentLight,
          100: tokens.accentTag,
          200: '#EDB8C1',
          300: '#E08D9C',
          400: '#D45A70',
          500: tokens.accent,
          600: '#B01F37',
          700: tokens.accentDark,
          800: '#7A1526',
          900: '#5A101C',
          950: '#33090F',
        },
        // neutral ramp — theme-aware via CSS vars (50 = page bg, 900 = primary text)
        neutral: {
          50:  themed('--c-neutral-50'),
          100: themed('--c-neutral-100'),
          200: themed('--c-neutral-200'),
          300: themed('--c-neutral-300'),
          400: themed('--c-neutral-400'),
          500: themed('--c-neutral-500'),
          600: themed('--c-neutral-600'),
          700: themed('--c-neutral-700'),
          800: themed('--c-neutral-800'),
          900: themed('--c-neutral-900'),
          950: themed('--c-neutral-950'),
        },
      },
      fontFamily: {
        // DM Sans partout (corps, labels) ; Fraunces pour les titres.
        sans: [
          'var(--font-dm-sans)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif',
        ],
        // Les anciens libellés "font-mono" passent eux aussi en DM Sans.
        mono: [
          'var(--font-dm-sans)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif',
        ],
        display: [
          'var(--font-fraunces)', 'Georgia', 'serif',
        ],
      },
      borderRadius: {
        // radius du thème : sm 10 · md 12 · lg 14 · xl 16 · card 20 · pill 999
        'xl':   '0.75rem',
        '2xl':  '0.875rem',
        '3xl':  '1.25rem',
        '4xl':  '1.75rem',
        'card': '1.25rem',
      },
      boxShadow: {
        'card':       '0 1px 3px 0 rgba(30,26,26,0.06), 0 1px 2px 0 rgba(30,26,26,0.04)',
        'card-hover': '0 6px 12px 0 rgba(30,26,26,0.12)',
        'bottom-nav': '0 -1px 0 0 rgba(30,26,26,0.06)',
        'modal':      '0 24px 64px 0 rgba(30,26,26,0.25)',
        // ui.floatingCard : shadowOpacity .12, radius 12, offset y 6
        'floating':   '0 6px 12px 0 rgba(30,26,26,0.12)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'scale-in':   'scaleIn 0.15s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'nav-height': '72px',
        'screen-pad': '20px',  // layout.screenPadding
        'touch': '44px',       // layout.touchTarget
        'cta': '54px',         // layout.ctaHeight
      },
    },
  },
  plugins: [],
}
export default config

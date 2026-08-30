import type { Config } from 'tailwindcss'

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
        // PinLove — "carnet de voyage / tampon postal" palette
        petrol: {
          DEFAULT: '#0E2B30',
          soft:    '#153C42',
        },
        surface: {
          DEFAULT: '#1C4B53',
          2:       '#245861',
        },
        brass: {
          DEFAULT: '#E7B34A',
          dim:     '#B98F3B',
        },
        cerise: '#E63B77',
        paper:  '#F2ECD9',
        ink:    '#132023',
        mist: {
          DEFAULT: '#B9D2CD',
          2:       '#7FA39D',
        },
        // brand ramp remapped — brand-500 = cerise, primary accent everywhere
        brand: {
          50:  '#FBE6ED',
          100: '#F6C9DA',
          200: '#EEA0BE',
          300: '#E87BA5',
          400: '#E85A8F',
          500: '#E63B77',
          600: '#C92D66',
          700: '#A62254',
          800: '#7E1A40',
          900: '#5C132F',
          950: '#330A1A',
        },
        // neutral ramp remapped — dark-mode inversion (50 = darkest bg, 900 = lightest text)
        neutral: {
          50:  '#153C42',
          100: '#1C4B53',
          200: '#245861',
          300: '#5C7A78',
          400: '#7FA39D',
          500: '#B9D2CD',
          600: '#CFE0DB',
          700: '#DCE7E0',
          800: '#E9E6D3',
          900: '#F2ECD9',
          950: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-plex-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace',
        ],
        mono: [
          'var(--font-plex-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace',
        ],
        display: [
          'var(--font-stencil)', '-apple-system', 'sans-serif',
        ],
        hand: [
          'var(--font-caveat)', 'cursive',
        ],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card':   '0 2px 12px 0 rgba(0,0,0,0.28)',
        'card-hover': '0 6px 24px 0 rgba(0,0,0,0.34)',
        'bottom-nav': '0 -1px 0 0 rgba(0,0,0,0.2), 0 -4px 20px 0 rgba(0,0,0,0.25)',
        'modal':  '0 24px 64px 0 rgba(0,0,0,0.5)',
        'floating': '0 4px 24px 0 rgba(231,179,74,0.3)',
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
      },
    },
  },
  plugins: [],
}
export default config

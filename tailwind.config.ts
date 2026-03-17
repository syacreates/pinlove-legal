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
        // PinLove brand palette
        brand: {
          50:  '#fff1f3',
          100: '#ffe4e8',
          200: '#ffccd5',
          300: '#ffa3b3',
          400: '#ff6b84',
          500: '#ff3d5a',  // primary accent – CTAs, active states
          600: '#ed1a3a',
          700: '#c8102e',
          800: '#a6112b',
          900: '#8b1328',
          950: '#4d040f',
        },
        neutral: {
          50:  '#f9f9fb',
          100: '#f2f2f7',
          200: '#e5e5ea',
          300: '#d1d1d6',
          400: '#aeaeb2',
          500: '#8e8e93',
          600: '#636366',
          700: '#48484a',
          800: '#3a3a3c',
          900: '#2c2c2e',
          950: '#1c1c1e',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f9f9fb',
          elevated: '#ffffff',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"',
          '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif',
        ],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card':   '0 2px 12px 0 rgba(0,0,0,0.07)',
        'card-hover': '0 6px 24px 0 rgba(0,0,0,0.12)',
        'bottom-nav': '0 -1px 0 0 rgba(0,0,0,0.06), 0 -4px 20px 0 rgba(0,0,0,0.05)',
        'modal':  '0 24px 64px 0 rgba(0,0,0,0.18)',
        'floating': '0 4px 24px 0 rgba(255,61,90,0.25)',
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

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Unique violet-indigo primary (distinct from severity green/yellow/orange/red)
        primary: {
          50: '#F3F1FF',
          100: '#E9E5FF',
          200: '#D5CCFF',
          300: '#B7A6FF',
          400: '#9A83FF',
          500: '#7C6BFF',
          600: '#6B4EFF',
          700: '#5A3CE0',
          800: '#4A31B8',
          900: '#3D2A94',
        },
        // Aqua secondary accent (info / highlights)
        accent: {
          300: '#7DE8F5',
          400: '#38D9EE',
          500: '#22C7E0',
          600: '#0FA8C2',
        },
        // Semantic tokens → CSS variables (theme-aware, light + dark)
        surface: 'rgb(var(--rd-surface) / <alpha-value>)',
        card: 'rgb(var(--rd-card) / <alpha-value>)',
        raised: 'rgb(var(--rd-raised) / <alpha-value>)',
        soft: 'rgb(var(--rd-soft) / <alpha-value>)',
        'soft-strong': 'rgb(var(--rd-soft-strong) / <alpha-value>)',
        line: 'rgb(var(--rd-line) / <alpha-value>)',
        ink: 'rgb(var(--rd-ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--rd-ink-soft) / <alpha-value>)',
        muted: 'rgb(var(--rd-muted) / <alpha-value>)',
        // Severity (tuned for both themes)
        severity: {
          low: '#22C55E',
          moderate: '#EAB308',
          high: '#F97316',
          critical: '#EF4444',
        },
      },
      spacing: { '4.5': '1.125rem' },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--rd-shadow) / 0.06)',
        raised: '0 12px 40px -16px rgb(var(--rd-shadow) / 0.5)',
      },
      borderRadius: { DEFAULT: '10px' },
      keyframes: {
        'rd-fade-up': { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        'rd-scale-in': { from: { opacity: '0', transform: 'scale(.97)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        'rd-fade-up': 'rd-fade-up .4s cubic-bezier(.22,.61,.36,1) both',
        'rd-scale-in': 'rd-scale-in .3s cubic-bezier(.22,.61,.36,1) both',
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accent — brightened for a dark canvas
        primary: {
          50: '#EEF3FF',
          100: '#DCE7FF',
          200: '#BCCFFF',
          300: '#8FAEFF',
          400: '#5B84FF',
          500: '#3B66F5',
          600: '#2A4FE0',
          700: '#2340B8',
          800: '#22398F',
          900: '#223572',
        },
        // Premium dark surfaces (near-black, warm-neutral)
        surface: '#0A0B0E', // page background
        card: '#131519', // card background
        raised: '#1A1D22', // inputs / secondary buttons
        line: '#25282E', // borders / dividers
        ink: '#F2F4F7', // primary text (near-white)
        // Semantic severity (brightened for contrast on dark)
        severity: {
          low: '#22C55E',
          moderate: '#EAB308',
          high: '#F97316',
          critical: '#EF4444',
        },
      },
      spacing: {
        '4.5': '1.125rem',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 1px 2px rgba(0,0,0,0.5)',
        raised: '0 12px 40px -16px rgba(0,0,0,0.75)',
      },
      borderRadius: {
        DEFAULT: '10px',
      },
    },
  },
  plugins: [],
};
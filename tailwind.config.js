/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF4FF',
          100: '#DBE6FE',
          200: '#BFD3FE',
          300: '#93B4FD',
          400: '#6090FA',
          500: '#3B6DF5',
          600: '#2557E7',
          700: '#1D45C4',
          800: '#1D3A9E',
          900: '#1D357E',
        },
        surface: '#F6F7F9',
        ink: '#101828',
        severity: {
          low: '#16A34A',
          moderate: '#CA8A04',
          high: '#EA580C',
          critical: '#DC2626',
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
        card: '0 1px 2px rgba(16, 24, 40, 0.05)',
        raised: '0 4px 16px rgba(16, 24, 40, 0.10)',
      },
      borderRadius: {
        DEFAULT: '10px',
      },
    },
  },
  plugins: [],
};

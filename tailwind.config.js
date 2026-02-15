/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        warm: {
          50: '#FAF8F5',
          100: '#F5F0EB',
          200: '#EDE8E3',
          300: '#E0DAD4',
          400: '#C4BCB4',
          500: '#A8A29E',
          600: '#78716C',
          700: '#57534E',
          800: '#44403C',
          900: '#292524',
          950: '#1C1917',
        },
      },
      keyframes: {
        'slide-up': {
          '0%': {
            transform: 'translateY(100%)',
            opacity: '0',
            width: '0',
            overflow: 'hidden',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
            width: 'auto',
            overflow: 'visible',
          },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
}

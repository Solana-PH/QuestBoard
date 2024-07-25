/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        cursive: ['IM Fell English', 'cursive'],
        serif: ['IM Fell English', 'serif'],
        sans: ['Open Sans', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '50%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeInNoDelay: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeOut: {
          '0%': { opacity: 1 },
          '50%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
        slideIn: {
          '0%': {
            marginRight: '-100%',
            opacity: 0,
          },
          '100%': {
            marginRight: '0',
            opacity: 1,
          },
        },
        shake: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(10deg)' },
          '75%': { transform: 'rotate(-10deg)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 500ms forwards',
        fadeInNoDelay: 'fadeInNoDelay 500ms forwards',
        fadeOut: 'fadeOut 500ms forwards',
        slideIn: 'slideIn 300ms forwards',
        shake: 'shake 0.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

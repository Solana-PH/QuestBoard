/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        cursive: ['IM Fell English', 'cursive'],
        serif: ['IM Fell English', 'serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '50%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeOut: {
          '0%': { opacity: 1 },
          '50%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
        slideIn: {
          '0%': {
            width: '0%',
            opacity: 0,
          },
          '100%': { width: '100%', opacity: 1 },
        },
      },
      animation: {
        fadeIn: 'fadeIn 500ms forwards',
        fadeOut: 'fadeOut 500ms forwards',
        slideIn: 'slideIn 300ms forwards',
      },
    },
  },
  plugins: [],
}

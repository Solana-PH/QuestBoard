/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        cursive: ['IM Fell English', 'cursive'],
        serif: ['IM Fell English', 'serif'],
      },
    },
  },
  plugins: [],
}

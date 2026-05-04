/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        logo: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
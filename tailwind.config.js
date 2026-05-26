/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- Isto ativa o controlo manual do modo escuro
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
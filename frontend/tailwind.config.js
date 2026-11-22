/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          dark: '#0B192C',
          DEFAULT: '#0F172A',
          hover: '#1E293B',
          active: '#1E3A8A'
        },
        qnu: {
          blue: '#1D4ED8',
          lightBlue: '#EFF6FF',
          dark: '#0F172A'
        }
      }
    },
  },
  plugins: [],
}

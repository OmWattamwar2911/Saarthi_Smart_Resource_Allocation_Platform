/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          600: "#0d9488",
          700: "#0f766e"
        },
        slateSidebar: "#1e2a3a"
      }
    }
  },
  plugins: [],
}


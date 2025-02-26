/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'forest-green': '#2d6a4f',
        'emerald-green': '#40916c',
        'soft-white': '#f8f9fa',
        'golden-yellow': '#ffd700',
      },
      scale: {
        '80': '0.80',
        '105': '1.05',
      }
    },
  },
  plugins: [
    require('tailwindcss-animate')
  ],
} 
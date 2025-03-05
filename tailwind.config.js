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
        '107': '1.07',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: 0, transform: 'translateY(10px)' },
          'to': { opacity: 1, transform: 'translateY(0)' }
        }
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out forwards'
      }
    },
  },
  plugins: [
    require('tailwindcss-animate')
  ],
} 
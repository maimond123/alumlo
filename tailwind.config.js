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
      animation: {
        'blink': 'blink 1s step-start infinite',
        'radiate-emerald': 'radiate-emerald 3s infinite',
        'pulse': 'pulse 1.5s infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'radiate-emerald': {
          '0%': { backgroundColor: 'black', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
          '50%': { backgroundColor: 'rgb(16, 185, 129)', boxShadow: '0 0 0 10px rgba(16, 185, 129, 0)' },
          '100%': { backgroundColor: 'black', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
        },
        pulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
      }, 
    },
  },
  plugins: [
    require('tailwindcss-animate')
  ],
} 
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'panel-bg': 'rgba(12, 12, 28, 0.88)',
        'toolbar-bg': 'rgba(8, 8, 20, 0.90)',
        accent: '#3b82f6',
        'accent-hover': '#60a5fa',
        'text-primary': '#e2e8f0',
        'text-muted': '#94a3b8',
        'panel-border': 'rgba(255,255,255,0.08)',
        'btn-ghost': 'rgba(255,255,255,0.06)',
        'btn-ghost-hover': 'rgba(255,255,255,0.12)',
      },
      keyframes: {
        slideInRight: {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        slideOutRight: {
          '0%':   { transform: 'translateX(0)',    opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-in-right':  'slideInRight 0.3s ease-out forwards',
        'slide-out-right': 'slideOutRight 0.3s ease-in forwards',
        'fade-in':         'fadeIn 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
}

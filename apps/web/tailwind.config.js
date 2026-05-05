/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sentinel: {
          bg: '#0a0e1a',
          surface: '#111827',
          border: '#1f2937',
          accent: '#3b82f6',
          'accent-dim': '#1d4ed8',
          muted: '#6b7280',
          text: '#f9fafb',
          'text-dim': '#9ca3af',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}

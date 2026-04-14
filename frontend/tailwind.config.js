/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#00e5a0',
        'accent-hover': '#00cc8e',
        'accent-glow': 'rgba(0,229,160,0.18)',
        'accent-glow-strong': 'rgba(0,229,160,0.35)',
        primary: '#f0f0f5',
        secondary: '#7a7a90',
        muted: '#4a4a5a',
        'bg-primary': '#06060b',
        'bg-secondary': '#0c0c14',
        'bg-tertiary': '#12121e',
        'bg-card': 'rgba(255,255,255,0.02)',
        'bg-card-hover': 'rgba(255,255,255,0.05)',
        'bg-elevated': 'rgba(255,255,255,0.03)',
        border: 'rgba(255,255,255,0.06)',
        'border-hover': 'rgba(255,255,255,0.14)',
        error: '#ff6b6b',
        warning: '#ffd43b',
      },
      fontFamily: {
        display: ['Manrope', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '28px',
        full: '9999px',
      },
    },
  },
  plugins: [],
}

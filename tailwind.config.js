/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Spline Sans Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: '#1c1d22',
        sub: '#6b6f76',
        line: '#eaebee',
        surface: '#ffffff',
        canvas: '#f7f8fa',
        good: '#1f9d6b',
        goodBg: '#eaf6f0',
        warn: '#c98a16',
        warnBg: '#fbf4e6',
        bad: '#d2503a',
        badBg: '#fcecea',
        plum: '#8a5cc4',
        plumBg: '#f2ecfa',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,22,28,0.04), 0 1px 3px rgba(20,22,28,0.03)',
        pop: '0 8px 30px rgba(20,22,28,0.12), 0 2px 8px rgba(20,22,28,0.06)',
      },
      borderRadius: {
        xl2: '14px',
      },
    },
  },
  plugins: [],
}

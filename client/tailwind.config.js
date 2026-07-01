/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--color-paper)', 
          dark:    'var(--color-paper-dark)', 
          deep:    'var(--color-rule)', 
        },
        ink: {
          DEFAULT: 'var(--color-ink)', 
          muted:   'var(--color-ink-muted)', 
          faint:   'var(--color-ink-faint)', 
        },
        rule:  'var(--color-rule)',
        signal: {
          DEFAULT: 'var(--color-signal)', // Deep Civic Blue
          dark:    'var(--color-signal-dark)',
          light:   'var(--color-signal-light)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)', // Warm Amber CTA
          hover:   'var(--color-accent-hover)',
          light:   'var(--color-accent-light)',
        },
        forest: {
          DEFAULT: '#10B981',
          light:   '#059669',
          50:      '#ECFDF5',
          200:     '#A7F3D0',
        },
        brick: {
          DEFAULT: '#EF4444',
          light:   '#FEF2F2',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card:       '0 4px 20px -2px rgba(30, 58, 95, 0.04), 0 2px 8px -1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 12px 30px -4px rgba(30, 58, 95, 0.08), 0 4px 16px -2px rgba(15, 23, 42, 0.04)',
        nav:        '0 1px 3px 0 rgba(15, 23, 42, 0.05)',
        neumorph:   '6px 6px 12px rgba(163, 177, 198, 0.35), -6px -6px 12px rgba(255, 255, 255, 0.8)',
        'neumorph-dark': '6px 6px 12px rgba(5, 8, 15, 0.6), -6px -6px 12px rgba(25, 35, 55, 0.3)',
      },
      borderRadius: {
        DEFAULT: '0.75rem', // 12px rounded corners
        '2xl': '1rem', // 16px rounded corners
      },
      backgroundImage: {
        'hatch': `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 8px,
          rgba(30,58,95,0.015) 8px,
          rgba(30,58,95,0.015) 9px
        )`,
      },
    },
  },
  plugins: [],
};

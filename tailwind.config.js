/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme-category="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          // Developer-first monospace fonts
          'JetBrains Mono',
          'Fira Code',
          'Source Code Pro',
          'IBM Plex Mono',
          'Monaco',
          'Consolas',
          'Menlo',
          'monospace'
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Source Code Pro',
          'IBM Plex Mono',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      colors: {
        // Theme-aware colors using CSS variables
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-elevated': 'var(--color-bg-elevated)',

        'fg-primary': 'var(--color-fg-primary)',
        'fg-secondary': 'var(--color-fg-secondary)',
        'fg-tertiary': 'var(--color-fg-tertiary)',
        'fg-inverse': 'var(--color-fg-inverse)',

        'border-primary': 'var(--color-border-primary)',
        'border-secondary': 'var(--color-border-secondary)',
        'border-focus': 'var(--color-border-focus)',

        'semantic-error': 'var(--color-semantic-error)',
        'semantic-warning': 'var(--color-semantic-warning)',
        'semantic-success': 'var(--color-semantic-success)',
        'semantic-info': 'var(--color-semantic-info)',

        'accent-primary': 'var(--color-accent-primary)',
        'accent-secondary': 'var(--color-accent-secondary)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-active': 'var(--color-accent-active)',

        'syntax-red': 'var(--color-syntax-red)',
        'syntax-orange': 'var(--color-syntax-orange)',
        'syntax-yellow': 'var(--color-syntax-yellow)',
        'syntax-green': 'var(--color-syntax-green)',
        'syntax-blue': 'var(--color-syntax-blue)',
        'syntax-purple': 'var(--color-syntax-purple)',
        'syntax-grey': 'var(--color-syntax-grey)',
      },
    },
  },
  plugins: [],
}
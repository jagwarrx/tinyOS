/**
 * Claude AI Themes
 * Warm, friendly color palettes inspired by Claude's interface
 */

export const claudeThemes = {
  'claude-light': {
    id: 'claude-light',
    name: 'Claude Light',
    category: 'light',
    colors: {
      bg: {
        primary: '#ffffff',
        secondary: '#f5f5f4',
        tertiary: '#e7e5e4',
        elevated: '#fafaf9'
      },
      fg: {
        primary: '#1c1917',
        secondary: '#57534e',
        tertiary: '#78716c',
        inverse: '#ffffff'
      },
      border: {
        primary: '#e7e5e4',
        secondary: '#f5f5f4',
        focus: '#d97706'
      },
      semantic: {
        error: '#dc2626',
        warning: '#d97706',
        success: '#16a34a',
        info: '#2563eb'
      },
      accent: {
        primary: '#d97706',
        secondary: '#ea580c',
        hover: '#f59e0b',
        active: '#b45309'
      },
      editor: {
        text: '#1c1917',
        background: '#ffffff',
        bold: '#d97706',
        code: '#e7e5e4',
        highlight: '#fef3c7',
        highlightText: '#1c1917'
      },
      syntax: {
        red: '#dc2626',
        orange: '#ea580c',
        yellow: '#d97706',
        green: '#16a34a',
        blue: '#2563eb',
        purple: '#9333ea',
        grey: '#78716c'
      }
    }
  },

  'claude-dark': {
    id: 'claude-dark',
    name: 'Claude Dark',
    category: 'dark',
    colors: {
      bg: {
        primary: '#1c1917',
        secondary: '#292524',
        tertiary: '#44403c',
        elevated: '#292524'
      },
      fg: {
        primary: '#fafaf9',
        secondary: '#d6d3d1',
        tertiary: '#a8a29e',
        inverse: '#1c1917'
      },
      border: {
        primary: '#44403c',
        secondary: '#292524',
        focus: '#fb923c'
      },
      semantic: {
        error: '#f87171',
        warning: '#fb923c',
        success: '#4ade80',
        info: '#60a5fa'
      },
      accent: {
        primary: '#fb923c',
        secondary: '#fdba74',
        hover: '#fed7aa',
        active: '#ea580c'
      },
      editor: {
        text: '#fafaf9',
        background: '#1c1917',
        bold: '#fb923c',
        code: '#292524',
        highlight: '#fb923c',
        highlightText: '#1c1917'
      },
      syntax: {
        red: '#f87171',
        orange: '#fb923c',
        yellow: '#fbbf24',
        green: '#4ade80',
        blue: '#60a5fa',
        purple: '#c084fc',
        grey: '#78716c'
      }
    }
  }
}

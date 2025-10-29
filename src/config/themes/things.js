/**
 * Things 3 Themes
 * Clean, minimalist themes inspired by Cultured Code's Things 3
 */

export const thingsThemes = {
  'things-light': {
    id: 'things-light',
    name: 'Things Light',
    category: 'light',
    colors: {
      bg: {
        primary: '#ffffff',
        secondary: '#f7f7f7',
        tertiary: '#eeeeee',
        elevated: '#fafafa'
      },
      fg: {
        primary: '#1a1a1a',
        secondary: '#4d4d4d',
        tertiary: '#808080',
        inverse: '#ffffff'
      },
      border: {
        primary: '#e0e0e0',
        secondary: '#eeeeee',
        focus: '#007aff'
      },
      semantic: {
        error: '#ff3b30',
        warning: '#ff9500',
        success: '#34c759',
        info: '#007aff'
      },
      accent: {
        primary: '#007aff',
        secondary: '#0051d5',
        hover: '#4DA6FF',
        active: '#004bb8'
      },
      editor: {
        text: '#1a1a1a',
        background: '#ffffff',
        bold: '#1a1a1a',
        code: '#f7f7f7',
        highlight: '#ffd60a',
        highlightText: '#1a1a1a'
      },
      syntax: {
        red: '#ff3b30',
        orange: '#ff9500',
        yellow: '#ffd60a',
        green: '#34c759',
        blue: '#007aff',
        purple: '#af52de',
        grey: '#8e8e93'
      }
    }
  },

  'things-dark': {
    id: 'things-dark',
    name: 'Things Dark',
    category: 'dark',
    colors: {
      bg: {
        primary: '#1c1c1e',
        secondary: '#2c2c2e',
        tertiary: '#3a3a3c',
        elevated: '#2c2c2e'
      },
      fg: {
        primary: '#ffffff',
        secondary: '#e5e5e7',
        tertiary: '#aeaeb2',
        inverse: '#1c1c1e'
      },
      border: {
        primary: '#3a3a3c',
        secondary: '#2c2c2e',
        focus: '#0a84ff'
      },
      semantic: {
        error: '#ff453a',
        warning: '#ff9f0a',
        success: '#32d74b',
        info: '#0a84ff'
      },
      accent: {
        primary: '#0a84ff',
        secondary: '#409cff',
        hover: '#3a8efd',
        active: '#0070e0'
      },
      editor: {
        text: '#ffffff',
        background: '#1c1c1e',
        bold: '#ffffff',
        code: '#2c2c2e',
        highlight: '#ffd60a',
        highlightText: '#1c1c1e'
      },
      syntax: {
        red: '#ff453a',
        orange: '#ff9f0a',
        yellow: '#ffd60a',
        green: '#32d74b',
        blue: '#0a84ff',
        purple: '#bf5af2',
        grey: '#98989d'
      }
    }
  }
}

/**
 * Trello Theme
 * Vibrant, board-style theme inspired by Trello's design with gradient background
 */

export const trelloThemes = {
  'trello-blue': {
    id: 'trello-blue',
    name: 'Trello Blue',
    category: 'dark',
    gradient: {
      enabled: true,
      value: 'linear-gradient(135deg, #0079bf 0%, #00a3bf 50%, #5ba4cf 100%)'
    },
    colors: {
      bg: {
        primary: '#f9fafc', // Light background for regular views
        secondary: '#ebecf0',
        tertiary: '#dfe1e6',
        elevated: '#ffffff'
      },
      fg: {
        primary: '#172b4d',
        secondary: '#5e6c84',
        tertiary: '#8993a4',
        inverse: '#ffffff'
      },
      border: {
        primary: 'rgba(255, 255, 255, 0.2)',
        secondary: 'rgba(255, 255, 255, 0.1)',
        focus: '#ffffff'
      },
      semantic: {
        error: '#eb5a46',
        warning: '#f2d600',
        success: '#61bd4f',
        info: '#00c2e0'
      },
      accent: {
        primary: '#5ba4cf',
        secondary: '#00c2e0',
        hover: '#7db9dc',
        active: '#3f8fb8'
      },
      editor: {
        text: '#172b4d',
        background: '#ffffff',
        bold: '#0079bf',
        code: '#f4f5f7',
        highlight: '#f2d600',
        highlightText: '#172b4d'
      },
      syntax: {
        red: '#eb5a46',
        orange: '#ff9f1a',
        yellow: '#f2d600',
        green: '#61bd4f',
        blue: '#0079bf',
        purple: '#c377e0',
        grey: '#838c91'
      },
      // Trello-specific colors for enhanced styling
      card: {
        background: '#ffffff',
        hover: '#f4f5f7',
        text: '#172b4d',
        textSecondary: '#5e6c84'
      },
      label: {
        yellow: '#f2d600',
        orange: '#ff9f1a',
        red: '#eb5a46',
        purple: '#c377e0',
        blue: '#0079bf',
        green: '#61bd4f',
        lime: '#51e898',
        pink: '#ff78cb',
        black: '#344563',
        sky: '#00c2e0'
      },
      list: {
        background: '#ebecf0',
        hover: '#e4e6ea'
      }
    }
  }
}

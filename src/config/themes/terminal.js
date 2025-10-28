/**
 * Terminal/Hacker Themes
 * Developer-first dark themes with high contrast and information density
 */

export const terminalThemes = {
  'terminal-hacker': {
    id: 'terminal-hacker',
    name: 'Terminal Hacker',
    category: 'dark',
    colors: {
      // Deep black backgrounds for terminal aesthetic
      bg: {
        primary: '#0a0a0a',      // Almost pure black
        secondary: '#141414',    // Slightly lighter for panels
        tertiary: '#1a1a1a',     // Even lighter for nested elements
        elevated: '#1f1f1f'      // Elevated elements like modals
      },

      // High contrast white/gray text
      fg: {
        primary: '#ffffff',      // Pure white for maximum contrast
        secondary: '#b4b4b4',    // Medium gray for secondary text
        tertiary: '#6b6b6b',     // Darker gray for muted text
        inverse: '#0a0a0a'       // For text on colored backgrounds
      },

      // Minimal borders
      border: {
        primary: '#2a2a2a',      // Subtle borders
        secondary: '#1f1f1f',    // Even more subtle
        focus: '#00d9ff'         // Cyan for focus states
      },

      // Semantic colors with terminal vibe
      semantic: {
        error: '#ff5555',        // Bright red
        warning: '#ffb86c',      // Orange
        success: '#50fa7b',      // Bright green
        info: '#8be9fd'          // Cyan
      },

      // Cyan/blue accents for data and links
      accent: {
        primary: '#00d9ff',      // Bright cyan
        secondary: '#5555ff',    // Blue
        hover: '#00e5ff',        // Lighter cyan
        active: '#00c4e5'        // Slightly darker cyan
      },

      // Editor colors
      editor: {
        text: '#ffffff',
        bg: '#0a0a0a',
        bold: '#ffb86c',         // Orange for bold
        code: '#00d9ff',         // Cyan for code
        highlight: '#ffb86c',    // Orange highlight
        highlightText: '#0a0a0a'
      },

      // Syntax highlighting with terminal colors
      syntax: {
        red: '#ff5555',          // Bright red
        orange: '#ffb86c',       // Orange
        yellow: '#f1fa8c',       // Yellow
        green: '#50fa7b',        // Bright green
        blue: '#8be9fd',         // Cyan
        purple: '#bd93f9',       // Purple
        grey: '#6b6b6b'          // Gray
      }
    }
  },

  'terminal-matrix': {
    id: 'terminal-matrix',
    name: 'Terminal Matrix',
    category: 'dark',
    colors: {
      // Black with green matrix theme
      bg: {
        primary: '#000000',      // Pure black
        secondary: '#0d0d0d',
        tertiary: '#1a1a1a',
        elevated: '#1f1f1f'
      },

      fg: {
        primary: '#00ff41',      // Matrix green
        secondary: '#00cc33',    // Darker green
        tertiary: '#008822',     // Even darker
        inverse: '#000000'
      },

      border: {
        primary: '#003311',      // Dark green borders
        secondary: '#002211',
        focus: '#00ff41'         // Bright green focus
      },

      semantic: {
        error: '#ff0033',
        warning: '#ffaa00',
        success: '#00ff41',      // Matrix green
        info: '#00ffff'
      },

      accent: {
        primary: '#00ff41',      // Matrix green
        secondary: '#00cc33',
        hover: '#00ff55',
        active: '#00dd3a'
      },

      editor: {
        text: '#00ff41',
        bg: '#000000',
        bold: '#00ff55',
        code: '#00ffff',
        highlight: '#00ff41',
        highlightText: '#000000'
      },

      syntax: {
        red: '#ff0033',
        orange: '#ff9900',
        yellow: '#ffff00',
        green: '#00ff41',        // Matrix green
        blue: '#00ffff',
        purple: '#ff00ff',
        grey: '#008822'
      }
    }
  },

  'terminal-nord': {
    id: 'terminal-nord',
    name: 'Terminal Nord',
    category: 'dark',
    colors: {
      // Nord-inspired terminal theme
      bg: {
        primary: '#2e3440',      // Nord dark
        secondary: '#3b4252',
        tertiary: '#434c5e',
        elevated: '#4c566a'
      },

      fg: {
        primary: '#eceff4',      // Nord snow white
        secondary: '#e5e9f0',
        tertiary: '#d8dee9',
        inverse: '#2e3440'
      },

      border: {
        primary: '#4c566a',
        secondary: '#434c5e',
        focus: '#88c0d0'         // Nord frost cyan
      },

      semantic: {
        error: '#bf616a',        // Nord red
        warning: '#ebcb8b',      // Nord yellow
        success: '#a3be8c',      // Nord green
        info: '#88c0d0'          // Nord cyan
      },

      accent: {
        primary: '#88c0d0',      // Nord cyan
        secondary: '#81a1c1',    // Nord blue
        hover: '#8fbcbb',
        active: '#5e81ac'
      },

      editor: {
        text: '#eceff4',
        bg: '#2e3440',
        bold: '#ebcb8b',
        code: '#88c0d0',
        highlight: '#ebcb8b',
        highlightText: '#2e3440'
      },

      syntax: {
        red: '#bf616a',
        orange: '#d08770',
        yellow: '#ebcb8b',
        green: '#a3be8c',
        blue: '#88c0d0',
        purple: '#b48ead',
        grey: '#4c566a'
      }
    }
  },

  'terminal-blue': {
  id: 'terminal-blue',
  name: 'Terminal Blue',
  category: 'dark',
  colors: {
    bg: {
      primary: '#1a1a1f',
      secondary: '#0f0f14',
      tertiary: '#050508',
      elevated: '#2a2a35'
    },
    fg: {
      primary: '#e8e8f0',
      secondary: '#b8b8c8',
      tertiary: '#8888a0',
      inverse: '#1a1a1f'
    },
    border: {
      primary: '#4a4a60',
      secondary: '#2a2a35',
      focus: '#6b9aff'
    },
    semantic: {
      error: '#ff6b7f',
      warning: '#ffb86c',
      success: '#7fd987',
      info: '#6b9aff'
    },
    accent: {
      primary: '#6b9aff',
      secondary: '#8bb4ff',
      hover: '#84a8ff',
      active: '#5588ee'
    },
    editor: {
      text: '#e8e8f0',
      background: '#1a1a1f',
      bold: '#6b9aff',
      code: '#8bb4ff',
      highlight: '#6b9aff',
      highlightText: '#0f0f14'
    },
    syntax: {
      red: '#ff6b7f',
      orange: '#ffb86c',
      yellow: '#ffd97f',
      green: '#7fd987',
      blue: '#6b9aff',
      purple: '#b48eff',
      grey: '#6a6a7f'
    }
  }
},
'terminal-white': {
  id: 'terminal-white',
  name: 'Terminal White',
  category: 'light',
  colors: {
    bg: {
      primary: '#ffffff',
      secondary: '#f5f5f7',
      tertiary: '#ebebed',
      elevated: '#fafafa'
    },
    fg: {
      primary: '#1a1a1f',
      secondary: '#4a4a55',
      tertiary: '#6a6a75',
      inverse: '#ffffff'
    },
    border: {
      primary: '#d4d4d8',
      secondary: '#e4e4e7',
      focus: '#6b9aff'
    },
    semantic: {
      error: '#d32f2f',
      warning: '#f57c00',
      success: '#388e3c',
      info: '#1976d2'
    },
    accent: {
      primary: '#6b9aff',
      secondary: '#5a8dd8',
      hover: '#e8f0fe',
      active: '#4a7dcc'
    },
    editor: {
      text: '#1a1a1f',
      background: '#ffffff',
      bold: '#0d47a1',
      code: '#6a4dbc',
      highlight: '#fef3c7',
      highlightText: '#92400e'
    },
    syntax: {
      red: '#c62828',
      orange: '#ef6c00',
      yellow: '#f57f17',
      green: '#2e7d32',
      blue: '#1565c0',
      purple: '#6a4dbc',
      grey: '#757575'
    }
  }
}
}

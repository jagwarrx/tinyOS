/**
 * Theme Presets
 * Reverse-engineered configs from existing themes
 * Each preset is just a primary color + mode + optional customizations
 */

export const themePresets = {
  // ============================================
  // ORIGINAL CLASSIC
  // ============================================
  'original-dark': {
    id: 'original-dark',
    name: 'Original Dark',
    primary: '#8b5cf6', // Purple
    mode: 'dark'
  },

  'original-light': {
    id: 'original-light',
    name: 'Original Light',
    primary: '#8b5cf6', // Purple
    mode: 'light'
  },

  'original-sublime': {
    id: 'original-sublime',
    name: 'Original Sublime',
    primary: '#f39660', // Orange
    mode: 'dark',
    bgBase: '#272822' // Monokai-style dark green-gray
  },

  // ============================================
  // TERMINAL THEMES
  // ============================================
  'terminal-hacker': {
    id: 'terminal-hacker',
    name: 'Terminal Hacker',
    primary: '#00ff00', // Bright green
    secondary: '#00ff00',
    mode: 'dark',
    bgBase: '#000000' // Pure black
  },

  'terminal-matrix': {
    id: 'terminal-matrix',
    name: 'Terminal Matrix',
    primary: '#00ff41', // Matrix green
    secondary: '#00ff41',
    mode: 'dark',
    bgBase: '#0d0208' // Very dark purple-black
  },

  'terminal-nord': {
    id: 'terminal-nord',
    name: 'Terminal Nord',
    primary: '#88c0d0', // Nord cyan
    secondary: '#81a1c1', // Nord blue
    mode: 'dark',
    bgBase: '#2e3440' // Nord dark gray
  },

  'terminal-blue': {
    id: 'terminal-blue',
    name: 'Terminal Blue',
    primary: '#00d4ff', // Cyan blue
    secondary: '#00d4ff',
    mode: 'dark',
    bgBase: '#001a1f' // Dark cyan-black
  },

  'terminal-white': {
    id: 'terminal-white',
    name: 'Terminal White',
    primary: '#2563eb', // Blue
    secondary: '#2563eb',
    mode: 'light'
  },

  // ============================================
  // SONOKAI THEMES
  // ============================================
  'sonokai-default': {
    id: 'sonokai-default',
    name: 'Sonokai Default',
    primary: '#b39df3', // Purple
    secondary: '#76cce0', // Cyan
    mode: 'dark',
    bgBase: '#2c2e34'
  },

  'sonokai-atlantis': {
    id: 'sonokai-atlantis',
    name: 'Sonokai Atlantis',
    primary: '#72cce8', // Bright cyan
    secondary: '#9dd274', // Green
    mode: 'dark',
    bgBase: '#2a2f38'
  },

  'sonokai-andromeda': {
    id: 'sonokai-andromeda',
    name: 'Sonokai Andromeda',
    primary: '#bb97ee', // Light purple
    secondary: '#6dcae8', // Cyan
    mode: 'dark',
    bgBase: '#2b2d3a'
  },

  'sonokai-shusia': {
    id: 'sonokai-shusia',
    name: 'Sonokai Shusia',
    primary: '#ab9df2', // Purple
    secondary: '#7accd7', // Cyan
    mode: 'dark',
    bgBase: '#2d2a2e'
  },

  'sonokai-maia': {
    id: 'sonokai-maia',
    name: 'Sonokai Maia',
    primary: '#baa0f8', // Bright purple
    secondary: '#78cee9', // Cyan
    mode: 'dark',
    bgBase: '#273136'
  },

  'sonokai-espresso': {
    id: 'sonokai-espresso',
    name: 'Sonokai Espresso',
    primary: '#9fa0e1', // Muted blue-purple
    secondary: '#81d0c9', // Teal
    mode: 'dark',
    bgBase: '#312c2b' // Warm brown-gray
  },

  // ============================================
  // MONOKAI PRO THEMES
  // ============================================
  'monokai-classic': {
    id: 'monokai-classic',
    name: 'Monokai Classic',
    primary: '#66d9ef', // Cyan
    secondary: '#a6e22e', // Green
    mode: 'dark',
    bgBase: '#272822' // Classic Monokai dark
  },

  'monokai-machine': {
    id: 'monokai-machine',
    name: 'Monokai Machine',
    primary: '#74dfc4', // Teal
    secondary: '#ffcc00', // Yellow
    mode: 'dark',
    bgBase: '#1a1a1a' // Very dark gray
  },

  'monokai-octagon': {
    id: 'monokai-octagon',
    name: 'Monokai Octagon',
    primary: '#78dce8', // Light cyan
    secondary: '#ab9df2', // Purple
    mode: 'dark',
    bgBase: '#282a3a' // Blue-tinted dark
  },

  'monokai-ristretto': {
    id: 'monokai-ristretto',
    name: 'Monokai Ristretto',
    primary: '#ffd866', // Yellow
    secondary: '#ff6188', // Pink
    mode: 'dark',
    bgBase: '#2c2525' // Warm brown-gray
  },

  'monokai-spectrum': {
    id: 'monokai-spectrum',
    name: 'Monokai Spectrum',
    primary: '#fc618d', // Pink
    secondary: '#7bd88f', // Green
    mode: 'dark',
    bgBase: '#222222' // Dark gray
  },

  // ============================================
  // CLAUDE AI THEMES
  // ============================================
  'claude-light': {
    id: 'claude-light',
    name: 'Claude Light',
    primary: '#d97706', // Warm orange
    secondary: '#ea580c', // Bright orange
    mode: 'light'
  },

  'claude-dark': {
    id: 'claude-dark',
    name: 'Claude Dark',
    primary: '#fb923c', // Bright orange
    secondary: '#fdba74', // Light orange
    mode: 'dark',
    bgBase: '#1c1917' // Warm dark brown
  },

  // ============================================
  // THINGS 3 THEMES
  // ============================================
  'things-light': {
    id: 'things-light',
    name: 'Things Light',
    primary: '#3b82f6', // Blue
    secondary: '#3b82f6',
    mode: 'light'
  },

  'things-dark': {
    id: 'things-dark',
    name: 'Things Dark',
    primary: '#60a5fa', // Light blue
    secondary: '#60a5fa',
    mode: 'dark',
    bgBase: '#1e1e1e'
  },

  // ============================================
  // TRELLO THEME (with gradient)
  // ============================================
  'trello-blue': {
    id: 'trello-blue',
    name: 'Trello Blue',
    primary: '#0079bf', // Trello blue
    secondary: '#5ba4cf',
    mode: 'light',
    gradient: {
      enabled: true,
      value: 'linear-gradient(135deg, #0079bf 0%, #00a3bf 50%, #5ba4cf 100%)'
    }
  }
}

/**
 * Get preset config by ID
 * @param {string} presetId - Theme preset identifier
 * @returns {Object|null} Preset config or null
 */
export function getPreset(presetId) {
  return themePresets[presetId] || null
}

/**
 * Get all preset IDs
 * @returns {Array<string>} Array of preset IDs
 */
export function getAllPresetIds() {
  return Object.keys(themePresets)
}

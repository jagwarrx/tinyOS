/**
 * Theme Registry
 * Central registry for all available themes
 */

import { sonokaiThemes } from './sonokai'
import { monokaiThemes } from './monokai'
import { terminalThemes } from './terminal'
import { originalThemes } from './original'
import { claudeThemes } from './claude'
import { thingsThemes } from './things'
import { trelloThemes } from './trello'

// Combine all themes
export const allThemes = {
  ...originalThemes,
  ...sonokaiThemes,
  ...monokaiThemes,
  ...terminalThemes,
  ...claudeThemes,
  ...thingsThemes,
  ...trelloThemes
}

// Theme collections for UI organization
export const themeCollections = [
  {
    id: 'original',
    name: 'Original Classic',
    description: 'Original UI themes with Sublime Text inspiration',
    themes: [
      'original-dark',
      'original-light',
      'original-sublime'
    ]
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Hacker aesthetic with high information density',
    themes: [
      'terminal-hacker',
      'terminal-matrix',
      'terminal-nord',
      'terminal-blue',
      'terminal-white'
    ]
  },
  {
    id: 'sonokai',
    name: 'Sonokai',
    description: 'High contrast variants by Sainnhe Park',
    themes: [
      'sonokai-default',
      'sonokai-atlantis',
      'sonokai-andromeda',
      'sonokai-shusia',
      'sonokai-maia',
      'sonokai-espresso'
    ]
  },
  {
    id: 'monokai',
    name: 'Monokai Pro',
    description: 'Professional themes by Wimer Hazenberg',
    themes: [
      'monokai-classic',
      'monokai-machine',
      'monokai-octagon',
      'monokai-ristretto',
      'monokai-spectrum'
    ]
  },
  {
    id: 'claude',
    name: 'Claude AI',
    description: 'Warm, friendly themes inspired by Claude',
    themes: [
      'claude-light',
      'claude-dark'
    ]
  },
  {
    id: 'things',
    name: 'Things 3',
    description: 'Clean, minimalist themes inspired by Things 3',
    themes: [
      'things-light',
      'things-dark'
    ]
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Vibrant board-style theme with gradient background',
    themes: [
      'trello-blue'
    ]
  }
]

/**
 * Get a theme by ID
 * @param {string} themeId - Theme identifier
 * @returns {Object|null} Theme object or null if not found
 */
export function getTheme(themeId) {
  return allThemes[themeId] || null
}

/**
 * Get all themes in a collection
 * @param {string} collectionId - Collection identifier
 * @returns {Array} Array of theme objects
 */
export function getThemesByCollection(collectionId) {
  const collection = themeCollections.find(c => c.id === collectionId)
  if (!collection) return []

  return collection.themes.map(themeId => allThemes[themeId]).filter(Boolean)
}

/**
 * Get default theme
 * @returns {Object} Default theme object
 */
export function getDefaultTheme() {
  return allThemes['original-sublime']
}

/**
 * Get all theme IDs
 * @returns {Array<string>} Array of theme IDs
 */
export function getAllThemeIds() {
  return Object.keys(allThemes)
}

// Export utilities
export { applyTheme, getThemePreviewColors, getThemeGradient } from './utils'

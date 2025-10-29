/**
 * Theme Registry
 * Central registry for all available themes
 * Themes are now generated algorithmically from presets
 */

import { generateTheme } from './generator'
import { themePresets } from './presets'

/**
 * Generate all themes from presets
 */
function generateAllThemes() {
  const themes = {}

  Object.values(themePresets).forEach(preset => {
    themes[preset.id] = generateTheme(preset)
  })

  return themes
}

// Generate all preset themes on module load
export const allThemes = generateAllThemes()

// Custom themes cache (loaded dynamically)
let customThemesCache = {}

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
 * Get a theme by ID (checks both presets and custom themes)
 * @param {string} themeId - Theme identifier
 * @returns {Object|null} Theme object or null if not found
 */
export function getTheme(themeId) {
  // Check presets first
  if (allThemes[themeId]) {
    return allThemes[themeId]
  }

  // Check custom themes cache
  if (customThemesCache[themeId]) {
    return customThemesCache[themeId]
  }

  return null
}

/**
 * Register custom themes (called after loading from DB)
 * @param {Array} customThemeConfigs - Array of custom theme configs
 */
export function registerCustomThemes(customThemeConfigs) {
  customThemesCache = {}

  customThemeConfigs.forEach(config => {
    const theme = generateTheme(config)
    customThemesCache[theme.id] = theme
  })
}

/**
 * Get all custom themes
 * @returns {Object} Object mapping theme IDs to theme objects
 */
export function getCustomThemes() {
  return { ...customThemesCache }
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
  return allThemes['sonokai-default']
}

/**
 * Generate a custom theme from user input
 * @param {Object} config - Theme configuration
 * @returns {Object} Generated theme object
 */
export function createCustomTheme(config) {
  return generateTheme(config)
}

/**
 * Get preset configuration for a theme
 * @param {string} themeId - Theme identifier
 * @returns {Object|null} Preset config or null
 */
export function getThemePreset(themeId) {
  return themePresets[themeId] || null
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

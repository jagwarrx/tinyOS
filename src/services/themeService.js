import { getSetting, setSetting } from './settingsService'
import { getTheme, getDefaultTheme, applyTheme, createCustomTheme } from '../config/themes'

/**
 * Theme Service
 * Manages theme preferences and application
 */

const THEME_KEY = 'theme'
const CUSTOM_THEMES_KEY = 'custom_themes' // Key for storing custom theme configs
const THEME_STORAGE_KEY = 'theme' // localStorage key for caching
const CUSTOM_THEMES_STORAGE_KEY = 'custom_themes' // localStorage key for custom themes

// In-memory cache of custom themes
let customThemesCache = null

/**
 * Load the active theme from database and apply it
 * Falls back to localStorage if database fails, then to default theme
 * @returns {Promise<Object>} The loaded theme object
 */
export async function loadAndApplyTheme() {
  try {
    // Try to load from database
    let themeId = await getSetting(THEME_KEY)

    // If not in DB, check localStorage (for migration from old system)
    if (!themeId) {
      themeId = localStorage.getItem(THEME_STORAGE_KEY)

      // Migrate old theme values
      if (themeId === 'light' || themeId === 'dark') {
        themeId = 'sonokai-default' // Default to sonokai-default for now
      }

      // Save to database for next time
      if (themeId) {
        await saveTheme(themeId)
      }
    }

    // Get theme object
    let theme = themeId ? getTheme(themeId) : null

    // Fallback to default if theme not found
    if (!theme) {
      theme = getDefaultTheme()
      await saveTheme(theme.id)
    }

    // Apply the theme
    applyTheme(theme)

    // Cache in localStorage for fast initial load
    localStorage.setItem(THEME_STORAGE_KEY, theme.id)

    return theme
  } catch (error) {
    console.error('Failed to load theme:', error)

    // Ultimate fallback: use default theme
    const theme = getDefaultTheme()
    applyTheme(theme)
    return theme
  }
}

/**
 * Save theme preference to database
 * @param {string} themeId - Theme identifier to save
 * @returns {Promise<void>}
 */
export async function saveTheme(themeId) {
  try {
    // Verify theme exists
    const theme = getTheme(themeId)
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`)
    }

    // Save to database
    await setSetting(THEME_KEY, themeId, 'Active theme ID')

    // Update localStorage cache
    localStorage.setItem(THEME_STORAGE_KEY, themeId)
  } catch (error) {
    console.error('Failed to save theme:', error)
    throw error
  }
}

/**
 * Change theme and save preference
 * @param {string} themeId - Theme identifier to activate
 * @returns {Promise<Object>} The newly activated theme object
 */
export async function changeTheme(themeId) {
  try {
    // Get theme object
    const theme = getTheme(themeId)
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`)
    }

    // Apply theme immediately
    applyTheme(theme)

    // Save preference
    await saveTheme(themeId)

    return theme
  } catch (error) {
    console.error('Failed to change theme:', error)
    throw error
  }
}

/**
 * Get current theme ID from storage
 * @returns {Promise<string|null>} Current theme ID or null
 */
export async function getCurrentThemeId() {
  try {
    const themeId = await getSetting(THEME_KEY)
    return themeId || null
  } catch (error) {
    console.error('Failed to get current theme:', error)
    return null
  }
}

/**
 * Load custom theme configs from database
 * @returns {Promise<Array>} Array of custom theme configs
 */
export async function loadCustomThemes() {
  try {
    // Check cache first
    if (customThemesCache) {
      return customThemesCache
    }

    // Try database
    let customThemesJson = await getSetting(CUSTOM_THEMES_KEY)

    // Fallback to localStorage
    if (!customThemesJson) {
      customThemesJson = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY)
    }

    // Parse and cache
    const customThemes = customThemesJson ? JSON.parse(customThemesJson) : []
    customThemesCache = customThemes

    return customThemes
  } catch (error) {
    console.error('Failed to load custom themes:', error)
    return []
  }
}

/**
 * Save custom theme configs to database
 * @param {Array} customThemes - Array of custom theme configs
 * @returns {Promise<void>}
 */
export async function saveCustomThemes(customThemes) {
  try {
    const customThemesJson = JSON.stringify(customThemes)

    // Save to database
    await setSetting(CUSTOM_THEMES_KEY, customThemesJson, 'Custom theme configurations')

    // Update localStorage cache
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, customThemesJson)

    // Update in-memory cache
    customThemesCache = customThemes
  } catch (error) {
    console.error('Failed to save custom themes:', error)
    throw error
  }
}

/**
 * Add a new custom theme
 * @param {Object} config - Theme configuration
 * @returns {Promise<Object>} Generated theme object
 */
export async function addCustomTheme(config) {
  try {
    // Load existing custom themes
    const customThemes = await loadCustomThemes()

    // Check for duplicate ID
    if (customThemes.some(t => t.id === config.id)) {
      throw new Error(`Theme with ID '${config.id}' already exists`)
    }

    // Add new theme
    customThemes.push(config)

    // Save to database
    await saveCustomThemes(customThemes)

    // Generate and return the full theme object
    return createCustomTheme(config)
  } catch (error) {
    console.error('Failed to add custom theme:', error)
    throw error
  }
}

/**
 * Delete a custom theme
 * @param {string} themeId - Theme identifier to delete
 * @returns {Promise<void>}
 */
export async function deleteCustomTheme(themeId) {
  try {
    // Load existing custom themes
    const customThemes = await loadCustomThemes()

    // Filter out the theme
    const filtered = customThemes.filter(t => t.id !== themeId)

    if (filtered.length === customThemes.length) {
      throw new Error(`Theme '${themeId}' not found`)
    }

    // Save back to database
    await saveCustomThemes(filtered)
  } catch (error) {
    console.error('Failed to delete custom theme:', error)
    throw error
  }
}

/**
 * Get all custom themes (generated)
 * @returns {Promise<Array>} Array of generated theme objects
 */
export async function getAllCustomThemes() {
  try {
    const configs = await loadCustomThemes()
    return configs.map(config => createCustomTheme(config))
  } catch (error) {
    console.error('Failed to get custom themes:', error)
    return []
  }
}

import { getSetting, setSetting } from './settingsService'
import { getTheme, getDefaultTheme, applyTheme } from '../config/themes'

/**
 * Theme Service
 * Manages theme preferences and application
 */

const THEME_KEY = 'theme'
const THEME_STORAGE_KEY = 'theme' // localStorage key for caching

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

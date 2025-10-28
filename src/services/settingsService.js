import { supabase } from '../supabaseClient'

/**
 * Settings Service
 * Manages application-wide settings stored in the settings table
 */

/**
 * Fetch a setting by key
 * @param {string} key - Setting key
 * @returns {Promise<any>} Setting value
 */
export async function getSetting(key) {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found, return null
      return null
    }
    console.error(`Error fetching setting ${key}:`, error)
    throw error
  }

  return data?.value
}

/**
 * Update or create a setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value (will be stored as JSONB)
 * @param {string} description - Optional description
 * @returns {Promise<void>}
 */
export async function setSetting(key, value, description = null) {
  // Use upsert to insert or update
  const { error } = await supabase
    .from('settings')
    .upsert(
      { key, value, description },
      { onConflict: 'key' }
    )

  if (error) {
    console.error(`Error setting ${key}:`, error)
    throw error
  }
}

/**
 * Get UI preferences (show/hide various UI elements)
 * @returns {Promise<Object>} UI preferences
 */
export async function getUIPreferences() {
  const prefs = await getSetting('ui_preferences')

  // Default values if not set
  return {
    show_priority_formula: true,
    ...prefs
  }
}

/**
 * Update UI preferences
 * @param {Object} preferences - Partial or full preferences object
 * @returns {Promise<void>}
 */
export async function updateUIPreferences(preferences) {
  const current = await getUIPreferences()
  const updated = { ...current, ...preferences }

  await setSetting('ui_preferences', updated, 'UI visibility and layout preferences')
}

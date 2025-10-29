/**
 * UI Mode Configuration
 * Defines different interface styles for the application
 */

export const availableUIModes = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Modern, polished interface with rounded corners and shadows',
    className: 'ui-standard'
  },
  {
    id: 'hacker',
    name: 'Hacker Terminal',
    description: 'Raw terminal aesthetic with text-based UI and high information density',
    className: 'ui-hacker'
  },
  {
    id: 'expanded',
    name: 'Expanded View',
    description: 'Distraction-free full-width layout with content centered at optimal reading width',
    className: 'ui-expanded'
  }
]

/**
 * Get UI mode by ID
 * @param {string} modeId - UI mode identifier
 * @returns {Object|null} UI mode object or null
 */
export function getUIMode(modeId) {
  return availableUIModes.find(m => m.id === modeId) || null
}

/**
 * Get default UI mode
 * @returns {Object} Default UI mode object
 */
export function getDefaultUIMode() {
  return availableUIModes[1] // Hacker mode
}

/**
 * Apply UI mode to document
 * @param {string} modeId - UI mode identifier
 */
export function applyUIMode(modeId) {
  const mode = getUIMode(modeId)
  if (!mode) return

  // Remove all UI mode classes
  availableUIModes.forEach(m => {
    document.documentElement.classList.remove(m.className)
  })

  // Add new UI mode class
  document.documentElement.classList.add(mode.className)

  // Store in localStorage
  localStorage.setItem('ui-mode', modeId)
}

/**
 * Load UI mode from localStorage
 * @returns {string} UI mode ID from storage
 */
export function loadUIModePreference() {
  return localStorage.getItem('ui-mode') || 'hacker'
}

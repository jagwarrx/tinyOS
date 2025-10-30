/**
 * UI Mode Configuration
 * Defines different interface styles for the application
 */

export const availableUIModes = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Balanced productivity - comfortable sizing, polished interface with rounded corners',
    useCase: 'General use, navigating between notes and tasks',
    sizing: '14px base • Balanced spacing • Visual depth',
    recommendedFont: 'inter',
    className: 'ui-standard'
  },
  {
    id: 'hacker',
    name: 'Hacker Terminal',
    description: 'Information density - compact layout for viewing many tasks at once',
    useCase: 'Task management, quick scanning, keyboard workflows',
    sizing: '12px base • Compact spacing • Minimal borders',
    recommendedFont: 'monaco',
    className: 'ui-hacker'
  },
  {
    id: 'expanded',
    name: 'Expanded View',
    description: 'Deep work - spacious, distraction-free layout for focused reading and writing',
    useCase: 'Long-form notes, focused writing, comfortable reading',
    sizing: '16px base • Generous spacing • Maximum comfort',
    recommendedFont: 'inter',
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
  return availableUIModes[0] // Standard mode
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
  return localStorage.getItem('ui-mode') || 'standard'
}

/**
 * Font Configuration
 * Available fonts for the application
 */

export const availableFonts = [
  {
    id: 'inter',
    name: 'Inter',
    category: 'sans-serif',
    description: 'Modern sans-serif - ideal for Standard mode',
    cssFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    weights: [300, 400, 500, 600, 700],
    hasLigatures: false,
    recommendedFor: 'standard'
  },
  {
    id: 'monaco',
    name: 'Monaco',
    category: 'monospace',
    description: 'Classic system monospace - ideal for Hacker mode',
    cssFamily: "'Monaco', 'Menlo', 'Consolas', monospace",
    googleFontsUrl: null, // System font
    weights: [400],
    hasLigatures: false,
    recommendedFor: 'hacker'
  },
  {
    id: 'original-sublime',
    name: 'Original (Sublime)',
    category: 'monospace',
    description: 'Classic editor font stack',
    cssFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    googleFontsUrl: null, // System font stack
    weights: [400],
    hasLigatures: false,
    recommendedFor: null
  }
]

/**
 * Get font by ID
 * @param {string} fontId - Font identifier
 * @returns {Object|null} Font object or null
 */
export function getFont(fontId) {
  return availableFonts.find(f => f.id === fontId) || null
}

/**
 * Get fonts by category
 * @param {string} category - 'monospace' or 'sans-serif'
 * @returns {Array} Array of font objects
 */
export function getFontsByCategory(category) {
  return availableFonts.filter(f => f.category === category)
}

/**
 * Get default font
 * @returns {Object} Default font object
 */
export function getDefaultFont() {
  return availableFonts.find(f => f.id === 'inter') // Inter
}

/**
 * Apply font to document
 * @param {string} fontId - Font identifier
 */
export function applyFont(fontId) {
  const font = getFont(fontId)
  if (!font) return

  // Load Google Font if needed
  if (font.googleFontsUrl) {
    loadGoogleFont(font.googleFontsUrl, fontId)
  }

  // Apply font to body
  document.body.style.fontFamily = font.cssFamily

  // Enable ligatures if supported
  if (font.hasLigatures) {
    document.body.style.fontFeatureSettings = "'liga' 1, 'calt' 1"
  } else {
    document.body.style.fontFeatureSettings = "normal"
  }

  // Store in localStorage
  localStorage.setItem('font-preference', fontId)
}

/**
 * Load Google Font dynamically
 * @param {string} url - Google Fonts URL
 * @param {string} fontId - Font identifier for the link element ID
 */
function loadGoogleFont(url, fontId) {
  // Check if already loaded
  const existingLink = document.getElementById(`font-${fontId}`)
  if (existingLink) return

  // Create link element
  const link = document.createElement('link')
  link.id = `font-${fontId}`
  link.rel = 'stylesheet'
  link.href = url
  document.head.appendChild(link)
}

/**
 * Load font from localStorage
 * @returns {string} Font ID from storage
 */
export function loadFontPreference() {
  return localStorage.getItem('font-preference') || 'inter'
}

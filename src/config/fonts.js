/**
 * Font Configuration
 * Available fonts for the application
 */

export const availableFonts = [
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    category: 'monospace',
    description: 'Clean monospace with excellent ligature support',
    cssFamily: "'JetBrains Mono', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap',
    weights: [300, 400, 500, 600, 700],
    hasLigatures: true
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    category: 'monospace',
    description: 'Popular monospace with programming ligatures',
    cssFamily: "'Fira Code', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap',
    weights: [300, 400, 500, 600, 700],
    hasLigatures: true
  },
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    category: 'monospace',
    description: 'Adobe monospace, highly readable',
    cssFamily: "'Source Code Pro', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@300;400;500;600;700&display=swap',
    weights: [300, 400, 500, 600, 700],
    hasLigatures: false
  },
  {
    id: 'ibm-plex-mono',
    name: 'IBM Plex Mono',
    category: 'monospace',
    description: 'IBM corporate monospace, clean and modern',
    cssFamily: "'IBM Plex Mono', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap',
    weights: [300, 400, 500, 600, 700],
    hasLigatures: false
  },
  {
    id: 'cascadia-code',
    name: 'Cascadia Code',
    category: 'monospace',
    description: 'Microsoft terminal font with ligatures',
    cssFamily: "'Cascadia Code', monospace",
    googleFontsUrl: null, // Not on Google Fonts, will use system fallback
    weights: [300, 400, 600, 700],
    hasLigatures: true
  },
  {
    id: 'monaco',
    name: 'Monaco',
    category: 'monospace',
    description: 'Classic macOS monospace',
    cssFamily: "'Monaco', 'Consolas', monospace",
    googleFontsUrl: null, // System font
    weights: [400],
    hasLigatures: false
  },
  {
    id: 'consolas',
    name: 'Consolas',
    category: 'monospace',
    description: 'Classic Windows monospace',
    cssFamily: "'Consolas', 'Monaco', monospace",
    googleFontsUrl: null, // System font
    weights: [400],
    hasLigatures: false
  },
  {
    id: 'courier-new',
    name: 'Courier New',
    category: 'monospace',
    description: 'Classic typewriter-style monospace',
    cssFamily: "'Courier New', 'Courier', monospace",
    googleFontsUrl: null, // System font
    weights: [400],
    hasLigatures: false
  },
  {
    id: 'original-sublime',
    name: 'Original (Sublime)',
    category: 'monospace',
    description: 'Original Sublime Text font stack',
    cssFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    googleFontsUrl: null, // System font stack
    weights: [400],
    hasLigatures: false
  },
  {
    id: 'inter',
    name: 'Inter',
    category: 'sans-serif',
    description: 'Modern sans-serif for UI',
    cssFamily: "'Inter', sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    weights: [300, 400, 500, 600, 700],
    hasLigatures: false
  },
  {
    id: 'sf-pro',
    name: 'SF Pro',
    category: 'sans-serif',
    description: 'Apple system font',
    cssFamily: "'-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', sans-serif",
    googleFontsUrl: null, // System font
    weights: [300, 400, 500, 600, 700],
    hasLigatures: false
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

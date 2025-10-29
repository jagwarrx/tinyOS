/**
 * Algorithmic Theme Generator
 * Generates complete theme objects from primary color + mode
 */

import chroma from 'chroma-js'

/**
 * Generate a complete theme from primary color and configuration
 * @param {Object} config - Theme configuration
 * @param {string} config.id - Unique theme identifier
 * @param {string} config.name - Display name
 * @param {string} config.primary - Primary/accent color (hex)
 * @param {string} config.mode - 'light' or 'dark'
 * @param {string} [config.secondary] - Optional secondary accent color (hex)
 * @param {string} [config.bgBase] - Optional custom background base color
 * @param {Object} [config.gradient] - Optional gradient configuration
 * @returns {Object} Complete theme object
 */
export function generateTheme(config) {
  const { id, name, primary, mode, secondary, bgBase, gradient } = config

  const isDark = mode === 'dark'
  const primaryColor = chroma(primary)
  const secondaryColor = secondary ? chroma(secondary) : null

  // Generate background colors
  const bg = generateBackgrounds(bgBase, isDark)

  // Generate foreground/text colors
  const fg = generateForegrounds(bg.primary, isDark)

  // Generate border colors
  const border = generateBorders(bg.primary, primaryColor, isDark)

  // Generate semantic colors (error, warning, success, info)
  const semantic = generateSemanticColors(primaryColor, isDark)

  // Generate accent colors
  const accent = generateAccentColors(primaryColor, secondaryColor, isDark)

  // Generate editor colors
  const editor = generateEditorColors(bg.primary, fg.primary, primaryColor, isDark)

  // Generate syntax colors (rainbow from primary hue)
  const syntax = generateSyntaxColors(primaryColor, isDark)

  return {
    id,
    name,
    category: mode,
    ...(gradient && { gradient }),
    colors: {
      bg,
      fg,
      border,
      semantic,
      accent,
      editor,
      syntax
    }
  }
}

/**
 * Generate background color scale
 */
function generateBackgrounds(bgBase, isDark) {
  if (bgBase) {
    // Custom background provided
    const base = chroma(bgBase)
    return {
      primary: base.hex(),
      secondary: isDark ? base.darken(0.3).hex() : base.darken(0.15).hex(),
      tertiary: isDark ? base.darken(0.5).hex() : base.darken(0.25).hex(),
      elevated: isDark ? base.brighten(0.2).hex() : base.brighten(0.1).hex()
    }
  }

  if (isDark) {
    // Dark mode: start with very dark gray with slight blue tint
    const base = chroma('#2c2e34')
    return {
      primary: base.hex(),
      secondary: base.darken(0.3).hex(),
      tertiary: base.darken(0.5).hex(),
      elevated: base.brighten(0.2).hex()
    }
  } else {
    // Light mode: pure white to subtle grays
    return {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      elevated: '#ffffff'
    }
  }
}

/**
 * Generate foreground/text color scale
 */
function generateForegrounds(bgPrimary, isDark) {
  const bg = chroma(bgPrimary)

  if (isDark) {
    // Dark mode: light text on dark background
    return {
      primary: '#e2e2e3',
      secondary: '#a7a9b0',
      tertiary: '#7f8490',
      inverse: bg.hex()
    }
  } else {
    // Light mode: dark text on light background
    return {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#64748b',
      inverse: '#ffffff'
    }
  }
}

/**
 * Generate border color scale
 */
function generateBorders(bgPrimary, primaryColor, isDark) {
  const bg = chroma(bgPrimary)

  if (isDark) {
    return {
      primary: bg.brighten(0.6).hex(),
      secondary: bg.brighten(0.3).hex(),
      focus: primaryColor.hex()
    }
  } else {
    return {
      primary: '#cbd5e1',
      secondary: '#e2e8f0',
      focus: primaryColor.hex()
    }
  }
}

/**
 * Generate semantic colors (error, warning, success, info)
 * Using color wheel rotations from primary hue
 */
function generateSemanticColors(primaryColor, isDark) {
  const hue = primaryColor.get('hsl.h')

  // Red for errors (hue ~0°)
  const error = chroma.hsl(0, 0.7, isDark ? 0.65 : 0.5)

  // Yellow for warnings (hue ~50°)
  const warning = chroma.hsl(50, 0.65, isDark ? 0.65 : 0.5)

  // Green for success (hue ~120°)
  const success = chroma.hsl(120, 0.5, isDark ? 0.65 : 0.45)

  // Blue for info (hue ~200°)
  const info = chroma.hsl(200, 0.65, isDark ? 0.65 : 0.5)

  return {
    error: error.hex(),
    warning: warning.hex(),
    success: success.hex(),
    info: info.hex()
  }
}

/**
 * Generate accent color scale
 */
function generateAccentColors(primaryColor, secondaryColor, isDark) {
  const secondary = secondaryColor || chroma.hsl(
    (primaryColor.get('hsl.h') + 180) % 360,
    primaryColor.get('hsl.s'),
    primaryColor.get('hsl.l')
  )

  return {
    primary: primaryColor.hex(),
    secondary: secondary.hex(),
    hover: isDark ? primaryColor.brighten(0.5).hex() : primaryColor.brighten(0.3).hex(),
    active: isDark ? primaryColor.darken(0.5).hex() : primaryColor.darken(0.3).hex()
  }
}

/**
 * Generate editor-specific colors
 */
function generateEditorColors(bgPrimary, fgPrimary, primaryColor, isDark) {
  const hue = primaryColor.get('hsl.h')

  // Yellow for bold/highlights
  const boldColor = chroma.hsl(50, 0.65, isDark ? 0.65 : 0.5)

  // Cyan/blue for code
  const codeColor = chroma.hsl(200, 0.65, isDark ? 0.65 : 0.5)

  return {
    text: fgPrimary,
    background: bgPrimary,
    bold: boldColor.hex(),
    code: codeColor.hex(),
    highlight: isDark ? boldColor.hex() : boldColor.brighten(1.5).hex(),
    highlightText: isDark ? bgPrimary : fgPrimary
  }
}

/**
 * Generate syntax highlighting colors
 * Creates a rainbow from primary color hue
 */
function generateSyntaxColors(primaryColor, isDark) {
  const baseHue = primaryColor.get('hsl.h')
  const saturation = 0.65
  const lightness = isDark ? 0.65 : 0.5

  return {
    red: chroma.hsl(0, saturation, lightness).hex(),
    orange: chroma.hsl(30, saturation, lightness).hex(),
    yellow: chroma.hsl(50, saturation, lightness).hex(),
    green: chroma.hsl(120, saturation * 0.8, lightness).hex(),
    blue: chroma.hsl(200, saturation, lightness).hex(),
    purple: primaryColor.hex(), // Use primary color for purple
    grey: isDark ? '#7f8490' : '#64748b'
  }
}

/**
 * Reverse engineer an existing theme to extract primary color and config
 * Analyzes theme colors to determine the primary color
 * @param {Object} theme - Existing theme object
 * @returns {Object} Config object { primary, mode, secondary?, bgBase? }
 */
export function reverseEngineerTheme(theme) {
  const config = {
    id: theme.id,
    name: theme.name,
    mode: theme.category,
    primary: theme.colors.accent.primary
  }

  // Check if it has a custom background (not default gray/white)
  const bgPrimary = theme.colors.bg.primary
  const isDefaultDarkBg = chroma.deltaE(bgPrimary, '#2c2e34') < 10
  const isDefaultLightBg = bgPrimary === '#ffffff' || chroma.deltaE(bgPrimary, '#ffffff') < 5

  if (!isDefaultDarkBg && !isDefaultLightBg) {
    config.bgBase = bgPrimary
  }

  // Check if secondary accent is significantly different
  const primaryColor = chroma(theme.colors.accent.primary)
  const secondaryColor = chroma(theme.colors.accent.secondary)
  const hueDiff = Math.abs(primaryColor.get('hsl.h') - secondaryColor.get('hsl.h'))

  if (hueDiff > 20 && hueDiff < 340) { // Not same hue, not complementary (180°)
    config.secondary = theme.colors.accent.secondary
  }

  // Check for gradient
  if (theme.gradient) {
    config.gradient = theme.gradient
  }

  return config
}

/**
 * Extract primary colors from all existing themes
 * @param {Object} allThemes - Object containing all theme definitions
 * @returns {Object} Map of theme IDs to config objects
 */
export function reverseEngineerAllThemes(allThemes) {
  const configs = {}

  Object.values(allThemes).forEach(theme => {
    configs[theme.id] = reverseEngineerTheme(theme)
  })

  return configs
}

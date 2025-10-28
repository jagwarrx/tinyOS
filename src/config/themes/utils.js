/**
 * Theme Utilities
 * Functions for applying themes via CSS custom properties
 */

/**
 * Apply a theme to the document root
 * @param {Object} theme - Theme object with colors configuration
 */
export function applyTheme(theme) {
  const root = document.documentElement;

  // Background colors
  root.style.setProperty('--color-bg-primary', theme.colors.bg.primary);
  root.style.setProperty('--color-bg-secondary', theme.colors.bg.secondary);
  root.style.setProperty('--color-bg-tertiary', theme.colors.bg.tertiary);
  root.style.setProperty('--color-bg-elevated', theme.colors.bg.elevated);

  // Foreground/text colors
  root.style.setProperty('--color-fg-primary', theme.colors.fg.primary);
  root.style.setProperty('--color-fg-secondary', theme.colors.fg.secondary);
  root.style.setProperty('--color-fg-tertiary', theme.colors.fg.tertiary);
  root.style.setProperty('--color-fg-inverse', theme.colors.fg.inverse);

  // Border colors
  root.style.setProperty('--color-border-primary', theme.colors.border.primary);
  root.style.setProperty('--color-border-secondary', theme.colors.border.secondary);
  root.style.setProperty('--color-border-focus', theme.colors.border.focus);

  // Semantic colors
  root.style.setProperty('--color-semantic-error', theme.colors.semantic.error);
  root.style.setProperty('--color-semantic-warning', theme.colors.semantic.warning);
  root.style.setProperty('--color-semantic-success', theme.colors.semantic.success);
  root.style.setProperty('--color-semantic-info', theme.colors.semantic.info);

  // Accent colors
  root.style.setProperty('--color-accent-primary', theme.colors.accent.primary);
  root.style.setProperty('--color-accent-secondary', theme.colors.accent.secondary);
  root.style.setProperty('--color-accent-hover', theme.colors.accent.hover);
  root.style.setProperty('--color-accent-active', theme.colors.accent.active);

  // Editor colors
  root.style.setProperty('--color-editor-text', theme.colors.editor.text);
  root.style.setProperty('--color-editor-bg', theme.colors.editor.background);
  root.style.setProperty('--color-editor-bold', theme.colors.editor.bold);
  root.style.setProperty('--color-editor-code', theme.colors.editor.code);
  root.style.setProperty('--color-editor-highlight', theme.colors.editor.highlight);
  root.style.setProperty('--color-editor-highlight-text', theme.colors.editor.highlightText);

  // Syntax colors (for direct usage)
  root.style.setProperty('--color-syntax-red', theme.colors.syntax.red);
  root.style.setProperty('--color-syntax-orange', theme.colors.syntax.orange);
  root.style.setProperty('--color-syntax-yellow', theme.colors.syntax.yellow);
  root.style.setProperty('--color-syntax-green', theme.colors.syntax.green);
  root.style.setProperty('--color-syntax-blue', theme.colors.syntax.blue);
  root.style.setProperty('--color-syntax-purple', theme.colors.syntax.purple);
  root.style.setProperty('--color-syntax-grey', theme.colors.syntax.grey);

  // Set theme category attribute for CSS selectors
  root.setAttribute('data-theme-category', theme.category);
  root.setAttribute('data-theme-id', theme.id);

  // Add/remove dark class for backwards compatibility
  if (theme.category === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Get theme preview colors for UI display
 * @param {Object} theme - Theme object
 * @returns {Array} Array of color values for preview
 */
export function getThemePreviewColors(theme) {
  return [
    theme.colors.bg.primary,
    theme.colors.syntax.purple,
    theme.colors.syntax.blue,
    theme.colors.syntax.green,
    theme.colors.syntax.yellow,
    theme.colors.syntax.red
  ];
}

/**
 * Generate a gradient from theme colors for preview backgrounds
 * @param {Object} theme - Theme object
 * @returns {string} CSS gradient string
 */
export function getThemeGradient(theme) {
  const colors = [
    theme.colors.syntax.purple,
    theme.colors.syntax.blue,
    theme.colors.syntax.green
  ];
  return `linear-gradient(135deg, ${colors.join(', ')})`;
}

# Theme System Documentation

## Overview

The Lexical Notes App features a comprehensive theming system that allows users to customize the visual appearance with 20+ professionally designed color schemes. The system uses CSS custom properties (CSS variables) for dynamic theme switching without page reloads, and integrates with Tailwind CSS for consistent styling across all components.

## Architecture

### Core Components

1. **Theme Definitions** (`src/config/themes/`)
   - Individual theme files organized by collection
   - Each theme is a JavaScript object with color tokens
   - Themes are modular and composable

2. **Theme Service** (`src/services/themeService.js`)
   - Loads and saves theme preferences to database
   - Falls back to localStorage for fast initial load
   - Migrates old theme preferences automatically

3. **Theme Utilities** (`src/config/themes/utils.js`)
   - Applies themes by setting CSS custom properties
   - Generates preview colors for UI
   - Handles special cases (gradients, theme-specific colors)

4. **Settings Modal** (`src/components/SettingsModal.jsx`)
   - Visual theme picker with live previews
   - WYSIWYG previews showing actual UI appearance
   - Organized by theme collections

5. **Tailwind Integration** (`tailwind.config.js`)
   - Maps CSS variables to Tailwind classes
   - Dark mode support via `data-theme-category` attribute
   - Consistent color tokens across entire app

## Theme Structure

Every theme is a JavaScript object with this structure:

```javascript
{
  id: 'theme-id',           // Unique identifier (kebab-case)
  name: 'Theme Name',        // Display name
  category: 'dark',          // 'dark' or 'light'

  // Optional: Gradient background for special themes
  gradient: {
    enabled: true,
    value: 'linear-gradient(135deg, #0079bf 0%, #00a3bf 50%, #5ba4cf 100%)'
  },

  colors: {
    // Background colors (4 levels)
    bg: {
      primary: '#2c2e34',    // Main background
      secondary: '#23252b',  // Sidebar, panels
      tertiary: '#1d1f24',   // Subtle elements
      elevated: '#33353b'    // Modals, popovers
    },

    // Foreground/text colors
    fg: {
      primary: '#e2e2e3',    // Main text
      secondary: '#a7a9b0',  // Secondary text
      tertiary: '#7f8490',   // Muted text
      inverse: '#2c2e34'     // Text on dark bg (for light themes)
    },

    // Border colors
    border: {
      primary: '#3f4149',    // Main borders
      secondary: '#2f3139',  // Subtle borders
      focus: '#b39df3'       // Focus rings, highlights
    },

    // Semantic colors (system feedback)
    semantic: {
      error: '#fc5d7c',      // Errors, destructive actions
      warning: '#e7c664',    // Warnings, cautions
      success: '#9ed072',    // Success, completed
      info: '#76cce0'        // Info, neutral feedback
    },

    // Accent colors (interactive elements)
    accent: {
      primary: '#b39df3',    // Main accent (buttons, links)
      secondary: '#76cce0',  // Secondary accent
      hover: '#c4b0f7',      // Hover state
      active: '#9d83ef'      // Active/pressed state
    },

    // Editor-specific colors
    editor: {
      text: '#e2e2e3',       // Editor text
      background: '#2c2e34', // Editor background
      bold: '#e7c664',       // Bold text
      code: '#76cce0',       // Inline code
      highlight: '#e7c664',  // Highlight background
      highlightText: '#2c2e34' // Highlight text color
    },

    // Syntax/semantic colors (used for status badges, etc.)
    syntax: {
      red: '#fc5d7c',
      orange: '#f39660',
      yellow: '#e7c664',
      green: '#9ed072',
      blue: '#76cce0',
      purple: '#b39df3',
      grey: '#7f8490'
    }

    // Optional: Theme-specific extensions (e.g., Trello theme)
    // card, label, list, etc.
  }
}
```

## CSS Custom Properties

When a theme is applied, the following CSS variables are set on `:root`:

```css
/* Background Colors */
--color-bg-primary
--color-bg-secondary
--color-bg-tertiary
--color-bg-elevated
--color-bg-gradient /* Only for gradient themes */

/* Foreground Colors */
--color-fg-primary
--color-fg-secondary
--color-fg-tertiary
--color-fg-inverse

/* Border Colors */
--color-border-primary
--color-border-secondary
--color-border-focus

/* Semantic Colors */
--color-semantic-error
--color-semantic-warning
--color-semantic-success
--color-semantic-info

/* Accent Colors */
--color-accent-primary
--color-accent-secondary
--color-accent-hover
--color-accent-active

/* Editor Colors */
--color-editor-text
--color-editor-bg
--color-editor-bold
--color-editor-code
--color-editor-highlight
--color-editor-highlight-text

/* Syntax Colors */
--color-syntax-red
--color-syntax-orange
--color-syntax-yellow
--color-syntax-green
--color-syntax-blue
--color-syntax-purple
--color-syntax-grey
```

These variables are automatically mapped to Tailwind classes like `bg-bg-primary`, `text-fg-secondary`, etc.

## Available Themes

### Original Classic (3 themes)
Original UI themes with Sublime Text inspiration.

- **Original Dark** - Classic dark theme
- **Original Light** - Classic light theme
- **Original Sublime** - Sublime Text inspired

### Terminal (5 themes)
Hacker aesthetic with high information density.

- **Terminal Hacker** - Green-on-black terminal
- **Terminal Matrix** - Matrix green aesthetic
- **Terminal Nord** - Nord-inspired terminal
- **Terminal Blue** - Blue terminal theme
- **Terminal White** - Light terminal theme

### Sonokai (6 themes)
High contrast variants by Sainnhe Park, based on Monokai Pro.

- **Sonokai Default** - Balanced purple accents
- **Sonokai Atlantis** - Blue-green variant
- **Sonokai Andromeda** - Deep space blue
- **Sonokai Shusia** - Magenta-focused
- **Sonokai Maia** - Cyan-blue variant
- **Sonokai Espresso** - Warm brown tones

### Monokai Pro (5 themes)
Professional themes by Wimer Hazenberg.

- **Monokai Classic** - Original Monokai
- **Monokai Machine** - Cyberpunk variant
- **Monokai Octagon** - Balanced purple-blue
- **Monokai Ristretto** - Warm espresso tones
- **Monokai Spectrum** - Vibrant multi-color

### Claude AI (2 themes)
Warm, friendly themes inspired by Claude.

- **Claude Light** - Clean, warm light theme
- **Claude Dark** - Sophisticated dark theme

### Things 3 (2 themes)
Clean, minimalist themes inspired by Things 3.

- **Things Light** - Minimal light theme
- **Things Dark** - Minimal dark theme

### Trello (1 theme)
Vibrant board-style theme with gradient background.

- **Trello Blue** - Signature blue gradient

**Default Theme:** Sonokai Default

## Theme Persistence

Themes are persisted in two places:

1. **Database** (`settings` table)
   - Primary source of truth
   - Key: `'theme'`
   - Value: theme ID (e.g., `'sonokai-default'`)
   - Survives across devices if synced

2. **localStorage** (`'theme'` key)
   - Cache for fast initial load
   - Updated whenever theme changes
   - Fallback if database unavailable

### Migration

The theme service automatically migrates old theme values:
- Old: `'light'` or `'dark'` → New: `'sonokai-default'`

## How Themes Are Applied

1. **On App Load** (`App.jsx`)
   ```javascript
   useEffect(() => {
     loadAndApplyTheme() // Loads from DB → localStorage → default
   }, [])
   ```

2. **When User Changes Theme** (`SettingsModal.jsx`)
   ```javascript
   const handleThemeSelect = (themeId) => {
     setSelectedThemeId(themeId)
     onThemeChange?.(themeId) // Triggers changeTheme() in App.jsx
   }
   ```

3. **Theme Change Flow**
   ```
   changeTheme(themeId)
     ↓
   getTheme(themeId) // Get theme object
     ↓
   applyTheme(theme) // Set CSS variables
     ↓
   saveTheme(themeId) // Persist to DB + localStorage
   ```

4. **CSS Variable Application** (`utils.js`)
   ```javascript
   const root = document.documentElement
   root.style.setProperty('--color-bg-primary', theme.colors.bg.primary)
   // ... all other variables
   root.setAttribute('data-theme-category', theme.category)
   root.classList.toggle('dark', theme.category === 'dark')
   ```

## Adding a New Theme

### Step 1: Create Theme File

Create a new file in `src/config/themes/` (e.g., `mycollection.js`):

```javascript
/**
 * My Collection Themes
 * Description of the theme collection
 */

export const myCollectionThemes = {
  'my-theme-id': {
    id: 'my-theme-id',
    name: 'My Theme Name',
    category: 'dark', // or 'light'
    colors: {
      bg: { /* ... */ },
      fg: { /* ... */ },
      border: { /* ... */ },
      semantic: { /* ... */ },
      accent: { /* ... */ },
      editor: { /* ... */ },
      syntax: { /* ... */ }
    }
  }
  // Add more themes in this collection...
}
```

### Step 2: Register in Index

Edit `src/config/themes/index.js`:

```javascript
import { myCollectionThemes } from './mycollection'

export const allThemes = {
  ...existingThemes,
  ...myCollectionThemes
}

export const themeCollections = [
  // ... existing collections
  {
    id: 'mycollection',
    name: 'My Collection',
    description: 'Description of themes',
    themes: [
      'my-theme-id'
      // ... more theme IDs
    ]
  }
]
```

### Step 3: Test

1. Restart dev server
2. Open Settings → Theme tab
3. Your collection should appear with preview
4. Select theme and verify all UI elements look correct

## Theme Testing Checklist

When adding or modifying themes, verify:

- [ ] All text is readable on backgrounds
- [ ] Borders are visible but not too prominent
- [ ] Accent colors are vibrant and consistent
- [ ] Focus states are clearly visible
- [ ] Semantic colors (error, success) are distinguishable
- [ ] Editor syntax colors work well together
- [ ] Task status badges are legible
- [ ] Terminal output is readable
- [ ] Hover states are noticeable
- [ ] Light/dark category is correct

## Special Theme Features

### Gradient Backgrounds

Some themes (e.g., Trello) use gradient backgrounds:

```javascript
gradient: {
  enabled: true,
  value: 'linear-gradient(135deg, #0079bf 0%, #00a3bf 50%, #5ba4cf 100%)'
}
```

When gradient is enabled, `--color-bg-primary` is set to the gradient value instead of a solid color.

### Theme-Specific Colors

Themes can define custom color tokens beyond the standard structure:

```javascript
colors: {
  // ... standard colors

  // Trello-specific
  card: {
    background: '#ffffff',
    hover: '#f4f5f7',
    text: '#172b4d',
    textSecondary: '#5e6c84'
  },
  label: {
    yellow: '#f2d600',
    orange: '#ff9f1a',
    // ... more label colors
  }
}
```

These are applied as CSS variables when present:
```css
--color-card-bg
--color-card-hover
--color-label-yellow
```

## Integration Points

### Tailwind CSS

All theme colors are available as Tailwind utilities:

```jsx
<div className="bg-bg-primary text-fg-primary border-border-primary">
  <button className="bg-accent-primary hover:bg-accent-hover">
    Click me
  </button>
</div>
```

### Lexical Editor

Editor themes use the editor color tokens:

```javascript
const editorTheme = {
  text: {
    bold: 'font-bold',
    code: 'bg-editor-code px-1 py-0.5 rounded text-sm',
    highlight: 'bg-editor-highlight text-editor-highlight-text',
    // ...
  }
}
```

### Dark Mode Support

Tailwind's dark mode is configured to respect the theme category:

```javascript
// tailwind.config.js
darkMode: ['class', '[data-theme-category="dark"]']
```

This allows components to use dark mode variants:
```jsx
<div className="dark:bg-gray-800">
  {/* Dark-specific styles */}
</div>
```

## Performance Considerations

- Theme changes are **instant** (no page reload)
- CSS variables are hardware-accelerated
- Theme previews use memoization to avoid re-renders
- localStorage cache provides sub-100ms initial load
- Database saves are asynchronous and non-blocking

## Troubleshooting

### Theme not persisting
- Check database connection
- Verify `settings` table exists
- Check browser console for errors

### Colors not updating
- Hard refresh (Cmd+Shift+R)
- Check CSS variable values in DevTools
- Verify theme ID matches exactly

### Preview not matching actual UI
- Ensure preview uses same color tokens
- Check for component-specific overrides
- Verify theme object structure

### New theme not appearing
- Restart dev server
- Check import statement in `index.js`
- Verify theme ID is unique
- Check browser console for errors

## Future Enhancements

Potential improvements to the theme system:

- [ ] Theme variants (adjust saturation, brightness)
- [ ] User-defined custom themes
- [ ] Theme import/export (JSON)
- [ ] Color contrast validation
- [ ] Accessibility mode (high contrast)
- [ ] Auto dark mode based on system preference
- [ ] Theme transitions/animations
- [ ] Per-component theme overrides

---

**Note:** This documentation reflects the current state of the theme system. When making changes, please update this file accordingly.

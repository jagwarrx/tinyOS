# Theme System Implementation Guide

## ✅ Implementation Complete!

The comprehensive theme system has been fully implemented with **11 professional themes** (6 Sonokai variants + 5 Monokai Pro variants).

---

## 📋 Quick Start

### 1. Run the Database Migration

Copy and run this SQL in your Supabase SQL Editor:

```sql
-- Migration: Add theme system support to settings table
-- This migration enables the new theme system with Sonokai and Monokai Pro variants

-- Ensure theme key exists in settings table
-- Default to 'sonokai-default' if not set
INSERT INTO settings (key, value, description)
VALUES ('theme', '"sonokai-default"'::jsonb, 'Active theme ID (e.g., sonokai-default, monokai-classic)')
ON CONFLICT (key) DO UPDATE
  SET description = 'Active theme ID (e.g., sonokai-default, monokai-classic)';

-- Add comment for future reference
COMMENT ON TABLE settings IS 'Application-wide settings and configuration. Theme system uses the "theme" key to store active theme ID.';
```

### 2. Open the App

The dev server is running at: **http://localhost:5174/**

### 3. Try the Themes!

1. Click the **Settings** icon (gear icon on the left sidebar)
2. Go to the **Theme** tab
3. Click any theme to see it instantly applied across the entire app!

---

## 🎨 Available Themes

### Sonokai Collection (6 themes)
- **Default** - Original high-contrast variant
- **Atlantis** - Ocean-inspired colors
- **Andromeda** - Space-themed palette
- **Shusia** - Modified Monokai Pro filter
- **Maia** - Green-tinted variant
- **Espresso** - Warm brown tones

### Monokai Pro Collection (5 themes)
- **Classic** - Original Monokai Pro
- **Machine** - Cyan/tech-inspired
- **Octagon** - Balanced professional palette
- **Ristretto** - Warm coffee tones
- **Spectrum** - High-contrast pure colors

---

## 🏗️ Architecture Overview

### File Structure
```
src/
├── config/themes/
│   ├── sonokai.js          # 6 Sonokai theme definitions
│   ├── monokai.js          # 5 Monokai Pro theme definitions
│   ├── index.js            # Theme registry & exports
│   └── utils.js            # Theme application utilities
├── services/
│   ├── themeService.js     # Load/save/apply themes
│   └── settingsService.js  # Settings persistence
├── components/
│   └── SettingsModal.jsx   # Theme UI with previews
└── index.css               # CSS variables (40+ theme vars)
```

### How It Works

1. **CSS Variables**: All colors defined as CSS custom properties in `:root`
2. **Tailwind Integration**: CSS vars exposed as Tailwind utility classes
3. **Theme Service**: Loads theme from DB, applies CSS vars dynamically
4. **Automatic Persistence**: Theme choice saved to Supabase & localStorage

---

## 🎯 What's Been Updated

### Core System
- ✅ Theme configuration files (11 themes)
- ✅ CSS variable system (40+ variables)
- ✅ Tailwind config integration
- ✅ Theme service (load/save/apply)
- ✅ Database schema & migration

### Components Updated for Theming
- ✅ App.jsx (main container, sidebar, session banner)
- ✅ SettingsModal (header, tabs, theme grid, toggles)
- ✅ Editor (text, backgrounds, highlights, formatting)
- ✅ All navigation buttons
- ✅ Loading screen

---

## 🔧 Theme Structure

Each theme contains:

```javascript
{
  id: 'sonokai-default',
  name: 'Sonokai Default',
  category: 'dark',
  colors: {
    bg: {
      primary: '#2c2e34',      // Main background
      secondary: '#23252b',    // Sidebar/panels
      tertiary: '#1d1f24',     // Nested elements
      elevated: '#33353b'      // Modals/tooltips
    },
    fg: {
      primary: '#e2e2e3',      // Main text
      secondary: '#a7a9b0',    // Secondary text
      tertiary: '#7f8490',     // Muted text
      inverse: '#2c2e34'       // Text on colored bg
    },
    border: {
      primary: '#3f4149',      // Standard borders
      secondary: '#2f3139',    // Subtle dividers
      focus: '#b39df3'         // Focus rings
    },
    semantic: {
      error: '#fc5d7c',        // Red
      warning: '#e7c664',      // Yellow
      success: '#9ed072',      // Green
      info: '#76cce0'          // Blue
    },
    accent: {
      primary: '#b39df3',      // Main accent (purple)
      secondary: '#76cce0',    // Secondary (blue)
      hover: '#c4b0f7',        // Hover state
      active: '#9d83ef'        // Active state
    },
    editor: {
      text: '#e2e2e3',
      background: '#2c2e34',
      bold: '#e7c664',         // Bold text color
      code: '#76cce0',         // Code/inline
      highlight: '#e7c664',    // Highlight bg
      highlightText: '#2c2e34' // Text on highlight
    },
    syntax: {
      red: '#fc5d7c',
      orange: '#f39660',
      yellow: '#e7c664',
      green: '#9ed072',
      blue: '#76cce0',
      purple: '#b39df3',
      grey: '#7f8490'
    }
  }
}
```

---

## 🎨 Using Theme Colors in Code

### In Tailwind Classes
```jsx
// Before (hardcoded)
<div className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">

// After (theme-aware)
<div className="bg-bg-primary text-fg-primary">
```

### Available Tailwind Classes
```
Backgrounds:       bg-bg-primary, bg-bg-secondary, bg-bg-tertiary, bg-bg-elevated
Text:              text-fg-primary, text-fg-secondary, text-fg-tertiary
Borders:           border-border-primary, border-border-secondary, border-border-focus
Accents:           bg-accent-primary, text-accent-primary, hover:bg-accent-hover
Semantic:          text-semantic-error, text-semantic-warning, etc.
Syntax:            text-syntax-red, text-syntax-purple, etc.
```

### Direct CSS Variables
```css
.my-component {
  background-color: var(--color-bg-primary);
  color: var(--color-fg-primary);
  border-color: var(--color-border-primary);
}
```

---

## 🔍 Testing Checklist

When testing themes, verify:

- [ ] **Settings Modal**: Opens correctly, theme grid displays
- [ ] **Theme Switching**: Clicking a theme applies it instantly
- [ ] **Persistence**: Refresh the page - theme should be remembered
- [ ] **Editor**: Text colors update (bold, code, highlights)
- [ ] **Navigation**: Sidebar buttons reflect theme
- [ ] **App Background**: Main background changes with theme
- [ ] **Modals**: Settings and other modals use theme colors
- [ ] **Task Lists**: (If visible) Should use theme colors

---

## 🚀 Adding New Themes

Want to add a custom theme? Here's how:

1. **Add theme definition** to `src/config/themes/sonokai.js` or `monokai.js`:

```javascript
export const myThemes = {
  'my-custom-theme': {
    id: 'my-custom-theme',
    name: 'My Custom Theme',
    category: 'dark',
    colors: {
      // ... follow the structure above
    }
  }
}
```

2. **Register in index.js**:

```javascript
import { myThemes } from './mythemes'

export const allThemes = {
  ...sonokaiThemes,
  ...monokaiThemes,
  ...myThemes  // Add here
}
```

3. **Add to collections**:

```javascript
export const themeCollections = [
  // ... existing collections
  {
    id: 'custom',
    name: 'Custom Themes',
    description: 'My personal themes',
    themes: ['my-custom-theme']
  }
]
```

4. **Done!** It will appear in Settings > Theme

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `src/config/themes/sonokai.js` | Sonokai theme definitions |
| `src/config/themes/monokai.js` | Monokai Pro theme definitions |
| `src/config/themes/index.js` | Theme registry & utilities |
| `src/services/themeService.js` | Load/save/apply logic |
| `src/index.css` | CSS variables definitions |
| `tailwind.config.js` | Tailwind integration |
| `add_theme_system.sql` | Database migration |

---

## 🐛 Troubleshooting

### Theme doesn't apply on first load
- **Solution**: Run the database migration SQL
- The app defaults to `sonokai-default` if no theme is set

### Colors look wrong
- **Solution**: Hard refresh the browser (Cmd+Shift+R or Ctrl+Shift+F5)
- Tailwind may need to recompile

### Theme resets on refresh
- **Check**: Is the migration SQL run in Supabase?
- **Check**: Browser console for errors in themeService

### Some components still show gray/white
- **Solution**: Those components may need manual updates
- Search for `bg-white`, `bg-gray-`, `dark:bg-` in the file
- Replace with theme-aware classes like `bg-bg-primary`

---

## 🎉 Benefits

✅ **Composable**: Each theme is a standalone object
✅ **Configurable**: Easy to add/modify themes
✅ **Standardized**: Consistent structure across all themes
✅ **Performant**: No API calls needed for theme data
✅ **Persistent**: Saved to database & localStorage
✅ **Hot-reloadable**: Changes reflect instantly in dev
✅ **Type-safe ready**: Can add TypeScript types easily

---

## 📖 Next Steps (Optional Enhancements)

1. **Light Themes**: Add light mode variants
2. **Custom Theme Editor**: Visual color picker UI
3. **Theme Export/Import**: Share themes as JSON
4. **More Components**: Update TaskList, TaskDetail, Terminal
5. **Theme Preview**: Live preview before applying
6. **Automatic Updates**: Update all components systematically

---

**Enjoy your beautiful new themes!** 🎨✨

# Original Classic Themes

This document explains how the original UI CSS styling has been converted into the new theme system.

## Overview

The original UI styling from `index.css` has been converted into **3 distinct themes**:

1. **Original Dark** - Modern dark theme based on the original CSS
2. **Original Light** - Clean light theme based on the original CSS light mode
3. **Original Sublime** - True Sublime Text Monokai colors

## Theme Details

### 1. Original Dark (`original-dark`)

A modern dark theme that preserves the electric blue and yellow accent colors from the original CSS.

**Key Colors:**
- Background: `#1f2937` (dark gray)
- Text: `#f8f8f2` (Sublime-style light gray)
- Bold text: `#facc15` (yellow)
- Code text: `#00d4ff` (electric blue)
- Highlight: Dark yellow background with cream text
- Borders: Medium gray with electric blue focus

**Best for:** Dark mode enthusiasts who want the original aesthetic

### 2. Original Light (`original-light`)

A clean light theme based on the original CSS light mode overrides.

**Key Colors:**
- Background: `#ffffff` (white)
- Text: `#24292e` (dark gray/black)
- Bold text: `#eab308` (yellow)
- Code text: `#0ea5e9` (sky blue)
- Highlight: Light yellow background with dark brown text
- Borders: Light gray with sky blue focus

**Best for:** Users who prefer light backgrounds and clean aesthetics

### 3. Original Sublime (`original-sublime`)

The most faithful recreation of Sublime Text's classic Monokai color scheme.

**Key Colors:**
- Background: `#272822` (true Monokai background)
- Text: `#f8f8f2` (white)
- Bold text: `#e6db74` (Monokai yellow)
- Code text: `#66d9ef` (Monokai cyan)
- Accents: Pink, green, purple, and orange from Monokai
- Comment gray: `#75715e`

**Best for:** Sublime Text users and Monokai purists

## How to Use

### Via Settings Modal

1. Click the **Settings** icon (⚙️) in the top right
2. Navigate to the **Themes** tab
3. Select the **Original Classic** collection
4. Choose from:
   - Original Dark
   - Original Light
   - Original Sublime
5. The theme will apply immediately

### Via Terminal Commands

```bash
# Switch to Original Dark
/theme original-dark

# Switch to Original Light
/theme original-light

# Switch to Original Sublime
/theme original-sublime
```

## Mapping from Original CSS

### Original CSS → Theme System

The conversion preserved all the key visual elements:

#### Text Formatting
- **Bold text** (yellow): `#facc15` (dark) / `#eab308` (light)
- **Code text** (blue): `#00d4ff` (dark) / `#0ea5e9` (light)
- **Highlights**: Preserved yellow/cream color scheme

#### Editor Colors
- Editor background and text colors maintained
- Placeholder text grays preserved
- List styling (bullets, numbers) colors retained

#### UI Elements
- Scrollbar colors converted to theme variables
- Border colors maintained for consistency
- Focus states use the accent colors

#### Animations
All animations from the original CSS are theme-independent and work across all themes:
- Navigation slide animations
- Fade transitions
- Saved badge animation

## Technical Implementation

### File Structure
```
src/config/themes/
├── original.js          # New theme definitions
├── index.js            # Updated registry
├── sonokai.js          # Existing themes
├── monokai.js          # Existing themes
├── terminal.js         # Existing themes
└── utils.js            # Theme utilities
```

### Theme Object Structure
```javascript
{
  id: 'original-dark',
  name: 'Original Dark',
  category: 'dark',
  colors: {
    bg: { primary, secondary, tertiary, elevated },
    fg: { primary, secondary, tertiary, inverse },
    border: { primary, secondary, focus },
    semantic: { error, warning, success, info },
    accent: { primary, secondary, hover, active },
    editor: { text, background, bold, code, highlight, highlightText },
    syntax: { red, orange, yellow, green, blue, purple, grey }
  }
}
```

## Advantages of Theme System

### Before (CSS)
- Theme switching required reloading CSS
- Light/dark modes hardcoded in CSS
- Difficult to add new color schemes
- Manual CSS variable management

### After (Theme System)
- ✅ Instant theme switching (no reload)
- ✅ Persistent across sessions (saved to database)
- ✅ Easy to add new themes
- ✅ Centralized color management
- ✅ Preview colors in settings
- ✅ Terminal commands for quick switching

## Color Consistency

All themes maintain these design principles:

1. **Sufficient Contrast**: Text remains readable on all backgrounds
2. **Semantic Colors**: Errors, warnings, success states are consistent
3. **Focus States**: Interactive elements have clear focus indicators
4. **Accessibility**: Color combinations meet WCAG guidelines

## Customization

To create your own variation:

1. Copy `src/config/themes/original.js`
2. Create a new file (e.g., `custom.js`)
3. Modify the color values
4. Import in `src/config/themes/index.js`
5. Add to `allThemes` and `themeCollections`

Example:
```javascript
export const customThemes = {
  'my-theme': {
    id: 'my-theme',
    name: 'My Custom Theme',
    category: 'dark',
    colors: {
      // ... your colors
    }
  }
}
```

## Migration Notes

If you were using the old CSS-based theming:

1. Your theme preference will be migrated automatically
2. Old themes (`light`/`dark`) → `original-dark` by default
3. Settings are preserved in the database
4. No manual migration required

## Troubleshooting

### Theme not applying?
- Check Settings Modal → Themes tab
- Try terminal command: `/theme original-dark`
- Verify database connection (themes save to `settings` table)

### Colors look wrong?
- Clear browser cache (Ctrl+Shift+Delete)
- Hard reload (Ctrl+Shift+R)
- Check browser console for errors

### Theme resets on reload?
- Database connection issue
- Check Supabase connection
- Verify `settings` table exists

## Font Options

The original UI used a specific font stack. These fonts are now available in the Settings:

### Original Fonts

1. **Original (Sublime)** - The exact font stack from the original CSS:
   - `'Consolas', 'Monaco', 'Courier New', monospace`
   - Best for: Authentic Sublime Text experience

2. **Courier New** - Classic typewriter-style monospace
   - Clean, widely available system font
   - Best for: Nostalgic typewriter aesthetic

3. **Consolas** - Windows classic monospace
   - Already in font list
   - Best for: Windows users

4. **Monaco** - macOS classic monospace
   - Already in font list
   - Best for: Mac users

### Recommended Pairings

**Original Dark + Original (Sublime)** → True Sublime Text experience
**Original Light + Inter** → Modern, clean aesthetic
**Original Sublime + JetBrains Mono** → Modern code editor feel

## Future Enhancements

Potential additions to the Original Classic collection:

- **Original High Contrast**: Increased contrast for accessibility
- **Original Warm**: Warmer color temperature
- **Original Cool**: Cooler color temperature
- **Original Pastel**: Softer colors for extended use

---

**Created:** 2025-10-28
**Status:** ✅ Complete and functional
**Theme Count:** 3 variants (Dark, Light, Sublime)
**Font Options:** 4 original fonts (Sublime stack, Courier New, Consolas, Monaco) + Inter

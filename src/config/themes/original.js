/**
 * Original Classic Themes
 * Based on the original CSS styling with Sublime Text inspiration
 */

export const originalThemes = {
  'original-dark': {
    id: 'original-dark',
    name: 'Original Dark',
    category: 'dark',
    colors: {
      bg: {
        primary: '#1f2937',      // Dark gray background
        secondary: '#111827',    // Darker gray for elevated sections
        tertiary: '#0f172a',     // Even darker for depth
        elevated: '#374151'      // Lighter gray for elevated cards
      },
      fg: {
        primary: '#f8f8f2',      // Light grayish white (Sublime Text style)
        secondary: '#d1d5db',    // Medium gray text
        tertiary: '#9ca3af',     // Lighter gray for subtle text
        inverse: '#1f2937'       // Dark for light backgrounds
      },
      border: {
        primary: '#4b5563',      // Medium gray borders
        secondary: '#374151',    // Darker borders
        focus: '#00d4ff'         // Electric blue for focus
      },
      semantic: {
        error: '#ef4444',        // Red for errors
        warning: '#f59e0b',      // Orange for warnings
        success: '#10b981',      // Green for success
        info: '#00d4ff'          // Electric blue for info
      },
      accent: {
        primary: '#00d4ff',      // Electric blue
        secondary: '#facc15',    // Yellow
        hover: '#22d3ee',        // Lighter cyan on hover
        active: '#0891b2'        // Darker cyan when active
      },
      editor: {
        text: '#f8f8f2',         // Light grayish white
        background: '#1f2937',   // Dark gray
        bold: '#facc15',         // Yellow for bold
        code: '#00d4ff',         // Electric blue for code
        highlight: '#a16207',    // Dark yellow/brown background
        highlightText: '#fef3c7' // Light cream text
      },
      syntax: {
        red: '#ef4444',
        orange: '#f59e0b',
        yellow: '#facc15',
        green: '#10b981',
        blue: '#00d4ff',
        purple: '#a855f7',
        grey: '#75715e'          // Sublime Text placeholder gray
      }
    }
  },

  'original-light': {
    id: 'original-light',
    name: 'Original Light',
    category: 'light',
    colors: {
      bg: {
        primary: '#ffffff',      // White background
        secondary: '#f8fafc',    // Light gray for sections
        tertiary: '#f1f5f9',     // Slightly darker gray
        elevated: '#ffffff'      // White for elevated cards
      },
      fg: {
        primary: '#24292e',      // Dark gray/black text
        secondary: '#57606a',    // Medium gray text
        tertiary: '#6a737d',     // Light gray for subtle text
        inverse: '#ffffff'       // White for dark backgrounds
      },
      border: {
        primary: '#d0d7de',      // Light gray borders
        secondary: '#e5e7eb',    // Very light gray borders
        focus: '#0ea5e9'         // Sky blue for focus
      },
      semantic: {
        error: '#dc2626',        // Red for errors
        warning: '#d97706',      // Orange for warnings
        success: '#059669',      // Green for success
        info: '#0ea5e9'          // Sky blue for info
      },
      accent: {
        primary: '#0ea5e9',      // Sky blue
        secondary: '#eab308',    // Yellow
        hover: '#0284c7',        // Darker blue on hover
        active: '#0369a1'        // Even darker when active
      },
      editor: {
        text: '#24292e',         // Dark gray/black
        background: '#ffffff',   // White
        bold: '#eab308',         // Yellow for bold
        code: '#0ea5e9',         // Sky blue for code
        highlight: '#fef08a',    // Light yellow background
        highlightText: '#854d0e' // Dark brown text
      },
      syntax: {
        red: '#dc2626',
        orange: '#ea580c',
        yellow: '#eab308',
        green: '#059669',
        blue: '#0ea5e9',
        purple: '#9333ea',
        grey: '#6a737d'          // Placeholder gray
      }
    }
  },

  'original-sublime': {
    id: 'original-sublime',
    name: 'Original Sublime',
    category: 'dark',
    description: 'True Sublime Text Monokai colors',
    colors: {
      bg: {
        primary: '#272822',      // True Sublime/Monokai background
        secondary: '#1e1f1c',    // Darker variant
        tertiary: '#181914',     // Even darker
        elevated: '#2e2f2a'      // Lighter elevated
      },
      fg: {
        primary: '#f8f8f2',      // Sublime text color
        secondary: '#cfcfc2',    // Dimmed text
        tertiary: '#75715e',     // Comment gray
        inverse: '#272822'       // Background color for inverse
      },
      border: {
        primary: '#49483e',      // Subtle border
        secondary: '#3e3d32',    // Darker border
        focus: '#66d9ef'         // Cyan focus (Monokai cyan)
      },
      semantic: {
        error: '#f92672',        // Monokai pink/red
        warning: '#e6db74',      // Monokai yellow
        success: '#a6e22e',      // Monokai green
        info: '#66d9ef'          // Monokai cyan
      },
      accent: {
        primary: '#66d9ef',      // Monokai cyan
        secondary: '#ae81ff',    // Monokai purple
        hover: '#7de2f7',        // Lighter cyan
        active: '#4ec9e0'        // Darker cyan
      },
      editor: {
        text: '#f8f8f2',         // White text
        background: '#272822',   // Monokai background
        bold: '#e6db74',         // Yellow for bold
        code: '#66d9ef',         // Cyan for code
        highlight: '#49483e',    // Dark gray highlight bg
        highlightText: '#f8f8f2' // White highlight text
      },
      syntax: {
        red: '#f92672',          // Pink/red
        orange: '#fd971f',       // Orange
        yellow: '#e6db74',       // Yellow
        green: '#a6e22e',        // Green
        blue: '#66d9ef',         // Cyan
        purple: '#ae81ff',       // Purple
        grey: '#75715e'          // Gray
      }
    }
  }
}

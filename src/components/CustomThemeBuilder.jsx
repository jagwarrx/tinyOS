import { useState } from 'react'
import { Palette, Sparkles } from 'lucide-react'

export default function CustomThemeBuilder({ onThemeCreate }) {
  const [primary, setPrimary] = useState('#b39df3')
  const [mode, setMode] = useState('dark')
  const [themeName, setThemeName] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleCreate = () => {
    if (!themeName.trim()) {
      alert('Please enter a theme name')
      return
    }

    const config = {
      id: `custom-${Date.now()}`,
      name: themeName,
      primary,
      mode
    }

    onThemeCreate(config)

    // Reset form
    setThemeName('')
    setPrimary('#b39df3')
    setMode('dark')
    setIsExpanded(false)
  }

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border-2 border-dashed border-accent-primary/30 hover:border-accent-primary/60 rounded-lg transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/20 rounded-lg">
              <Sparkles size={20} className="text-accent-primary" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-fg-primary">
                Create Custom Theme
              </div>
              <div className="text-xs text-fg-secondary">
                Generate a unique theme from your colors
              </div>
            </div>
          </div>
          <div className="text-accent-primary font-bold">
            {isExpanded ? '−' : '+'}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 p-6 bg-bg-secondary border border-border-primary rounded-lg space-y-4">
          {/* Theme Name */}
          <div>
            <label className="block text-xs font-bold text-fg-primary mb-2 uppercase tracking-wide">
              Theme Name
            </label>
            <input
              type="text"
              placeholder="My Awesome Theme"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded text-sm text-fg-primary placeholder-fg-tertiary focus:outline-none focus:border-border-focus"
            />
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-xs font-bold text-fg-primary mb-2 uppercase tracking-wide">
              Primary Color
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="w-full h-10 border border-border-primary rounded flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: primary }}
                >
                  <Palette size={18} className="text-white drop-shadow-lg" />
                </div>
              </div>
              <input
                type="text"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                placeholder="#b39df3"
                className="flex-1 px-3 py-2 bg-bg-primary border border-border-primary rounded text-sm text-fg-primary placeholder-fg-tertiary focus:outline-none focus:border-border-focus font-mono"
              />
            </div>
            <p className="text-xs text-fg-tertiary mt-1">
              This will be your accent color and drive the entire theme palette
            </p>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-bold text-fg-primary mb-2 uppercase tracking-wide">
              Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('dark')}
                className={`p-3 border-2 text-center transition-all ${
                  mode === 'dark'
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-border-primary bg-bg-primary hover:border-border-focus'
                }`}
              >
                <div className="text-sm font-bold text-fg-primary">Dark</div>
                <div className="text-xs text-fg-secondary mt-0.5">
                  Dark backgrounds
                </div>
              </button>
              <button
                onClick={() => setMode('light')}
                className={`p-3 border-2 text-center transition-all ${
                  mode === 'light'
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-border-primary bg-bg-primary hover:border-border-focus'
                }`}
              >
                <div className="text-sm font-bold text-fg-primary">Light</div>
                <div className="text-xs text-fg-secondary mt-0.5">
                  Light backgrounds
                </div>
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-xs font-bold text-fg-primary mb-2 uppercase tracking-wide">
              Preview
            </label>
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: mode === 'dark' ? '#2c2e34' : '#ffffff',
                borderColor: mode === 'dark' ? '#3f4149' : '#cbd5e1'
              }}
            >
              <div className="space-y-2">
                <div
                  className="text-sm font-medium"
                  style={{ color: mode === 'dark' ? '#e2e2e3' : '#0f172a' }}
                >
                  Sample Text
                </div>
                <div
                  className="inline-block px-3 py-1 rounded text-xs font-bold"
                  style={{
                    backgroundColor: primary,
                    color: mode === 'dark' ? '#2c2e34' : '#ffffff'
                  }}
                >
                  Accent Button
                </div>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCreate}
              className="flex-1 px-4 py-2.5 bg-accent-primary hover:bg-accent-hover text-fg-inverse text-sm font-bold rounded transition-colors"
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles size={16} />
                Generate Theme
              </div>
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2.5 bg-bg-tertiary hover:bg-bg-primary border border-border-primary text-fg-primary text-sm font-medium rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

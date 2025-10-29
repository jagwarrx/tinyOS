import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Star, Check, Type } from 'lucide-react'
import {
  fetchAllMusicLinks,
  createMusicLink,
  updateMusicLink,
  deleteMusicLink,
  setAsDefault
} from '../services/musicLinksService'
import { getUIPreferences, updateUIPreferences } from '../services/settingsService'
import { themeCollections, getTheme, getThemePreviewColors, registerCustomThemes, getCustomThemes } from '../config/themes'
import { addCustomTheme, deleteCustomTheme as deleteCustomThemeService, loadCustomThemes } from '../services/themeService'
import { availableFonts, applyFont, loadFontPreference } from '../config/fonts'
import { availableUIModes, applyUIMode, loadUIModePreference } from '../config/uiModes'
import CustomThemeBuilder from './CustomThemeBuilder'

export default function SettingsModal({ isOpen, onClose, currentThemeId, onThemeChange, onMusicLinksChanged, onUIPreferencesChanged }) {
  const [activeTab, setActiveTab] = useState('general')
  const [musicLinks, setMusicLinks] = useState({ spotify: [], youtube: [] })
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newLink, setNewLink] = useState({ title: '', url: '', type: 'spotify' })
  const [editingId, setEditingId] = useState(null)
  const [uiPreferences, setUiPreferences] = useState({ show_priority_formula: true })
  const [selectedThemeId, setSelectedThemeId] = useState(currentThemeId || 'sonokai-default')
  const [selectedFontId, setSelectedFontId] = useState(loadFontPreference())
  const [selectedUIModeId, setSelectedUIModeId] = useState(loadUIModePreference())
  const [customThemes, setCustomThemes] = useState({})

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMusicLinks()
      loadUIPreferences()
      loadAndRegisterCustomThemes()
      setSelectedThemeId(currentThemeId || 'sonokai-default')
      setSelectedFontId(loadFontPreference())
      setSelectedUIModeId(loadUIModePreference())
    }
  }, [isOpen, currentThemeId])

  const loadAndRegisterCustomThemes = async () => {
    try {
      const configs = await loadCustomThemes()
      registerCustomThemes(configs)
      setCustomThemes(getCustomThemes())
    } catch (error) {
      console.error('Failed to load custom themes:', error)
    }
  }

  const loadMusicLinks = async () => {
    try {
      const links = await fetchAllMusicLinks()
      setMusicLinks(links)
    } catch (error) {
      console.error('Failed to load music links:', error)
    }
  }

  const loadUIPreferences = async () => {
    try {
      const prefs = await getUIPreferences()
      setUiPreferences(prefs)
    } catch (error) {
      console.error('Failed to load UI preferences:', error)
    }
  }

  const handleTogglePriorityFormula = async () => {
    const newValue = !uiPreferences.show_priority_formula
    try {
      await updateUIPreferences({ show_priority_formula: newValue })
      setUiPreferences({ ...uiPreferences, show_priority_formula: newValue })
      onUIPreferencesChanged?.()
    } catch (error) {
      console.error('Failed to update UI preferences:', error)
    }
  }

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url) return

    try {
      await createMusicLink(newLink)
      await loadMusicLinks()
      setNewLink({ title: '', url: '', type: 'spotify' })
      setIsAddingNew(false)
      onMusicLinksChanged?.()
    } catch (error) {
      console.error('Failed to add music link:', error)
    }
  }

  const handleDeleteLink = async (id, type) => {
    if (!confirm('Delete this music link?')) return

    try {
      await deleteMusicLink(id, type)
      await loadMusicLinks()
      onMusicLinksChanged?.()
    } catch (error) {
      console.error('Failed to delete music link:', error)
    }
  }

  const handleSetDefault = async (id, type) => {
    try {
      await setAsDefault(id, type)
      await loadMusicLinks()
      onMusicLinksChanged?.()
    } catch (error) {
      console.error('Failed to set default:', error)
    }
  }

  const handleUpdateLink = async (id, type, updates) => {
    try {
      await updateMusicLink(id, type, updates)
      await loadMusicLinks()
      setEditingId(null)
      onMusicLinksChanged?.()
    } catch (error) {
      console.error('Failed to update music link:', error)
    }
  }

  const handleThemeSelect = (themeId) => {
    setSelectedThemeId(themeId)
    onThemeChange?.(themeId)
  }

  const handleFontSelect = (fontId) => {
    setSelectedFontId(fontId)
    applyFont(fontId)
  }

  const handleUIModeSelect = (modeId) => {
    setSelectedUIModeId(modeId)
    applyUIMode(modeId)
  }

  const handleCustomThemeCreate = async (config) => {
    try {
      // Add custom theme to database
      const theme = await addCustomTheme(config)

      // Reload custom themes
      await loadAndRegisterCustomThemes()

      // Apply it immediately
      handleThemeSelect(theme.id)
    } catch (error) {
      console.error('Failed to create custom theme:', error)
      alert(`Failed to create theme: ${error.message}`)
    }
  }

  const handleDeleteCustomTheme = async (themeId) => {
    if (!confirm('Delete this custom theme?')) return

    try {
      await deleteCustomThemeService(themeId)

      // Reload custom themes
      await loadAndRegisterCustomThemes()

      // If the deleted theme was active, switch to default
      if (selectedThemeId === themeId) {
        handleThemeSelect('sonokai-default')
      }
    } catch (error) {
      console.error('Failed to delete custom theme:', error)
      alert(`Failed to delete theme: ${error.message}`)
    }
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'theme', label: 'Theme' },
    { id: 'music', label: 'Music' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={onClose}>
      <div
        className="bg-bg-elevated rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
          <h2 className="text-xl font-semibold text-fg-primary">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded transition-colors"
          >
            <X size={20} className="text-fg-secondary" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-secondary px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-fg-secondary hover:text-fg-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Task Panel Section */}
              <div>
                <h3 className="text-sm font-medium text-fg-primary mb-3">
                  Task Panel
                </h3>

                {/* Task Score Formula Toggle */}
                <div className="flex items-center justify-between p-3 bg-bg-secondary border border-border-primary rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-fg-primary">
                      Show Task Score Calculation
                    </div>
                    <div className="text-xs text-fg-secondary mt-0.5">
                      Display the task score formula inputs in task detail panel
                    </div>
                  </div>
                  <button
                    onClick={handleTogglePriorityFormula}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      uiPreferences.show_priority_formula
                        ? 'bg-accent-primary'
                        : 'bg-bg-tertiary'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-bg-primary transition-transform ${
                        uiPreferences.show_priority_formula ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div className="space-y-8">
              {/* UI Mode Section */}
              <div>
                <h3 className="text-sm font-bold text-fg-primary mb-2 uppercase tracking-wide">
                  UI Mode
                </h3>
                <p className="text-xs text-fg-secondary mb-4">
                  Choose between polished or terminal-style interface
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {availableUIModes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => handleUIModeSelect(mode.id)}
                      className={`p-4 border-2 text-left transition-all ${
                        selectedUIModeId === mode.id
                          ? 'border-accent-primary bg-accent-primary/10'
                          : 'border-border-primary bg-bg-secondary hover:border-border-focus'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-fg-primary">
                          {mode.name}
                        </span>
                        {selectedUIModeId === mode.id && (
                          <Check size={16} className="text-accent-primary" />
                        )}
                      </div>
                      <p className="text-xs text-fg-secondary">
                        {mode.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Section */}
              <div>
                <h3 className="text-sm font-bold text-fg-primary mb-2 uppercase tracking-wide">
                  Font
                </h3>
                <p className="text-xs text-fg-secondary mb-4">
                  Select your preferred typeface
                </p>

                <div className="space-y-2">
                  {availableFonts.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => handleFontSelect(font.id)}
                      className={`w-full p-3 border text-left transition-all ${
                        selectedFontId === font.id
                          ? 'border-accent-primary bg-accent-primary/10'
                          : 'border-border-primary bg-bg-secondary hover:border-border-focus'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Type size={14} className="text-fg-tertiary" />
                          <span className="text-sm font-medium text-fg-primary">
                            {font.name}
                          </span>
                          {selectedFontId === font.id && (
                            <Check size={14} className="text-accent-primary" />
                          )}
                        </div>
                        {font.hasLigatures && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-accent-primary/20 text-accent-primary font-bold">
                            LIGATURES
                          </span>
                        )}
                      </div>
                      <div
                        className="text-sm text-fg-primary mt-2"
                        style={{ fontFamily: font.cssFamily }}
                      >
                        The quick brown fox jumps over 0123456789
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Theme Builder */}
              <CustomThemeBuilder onThemeCreate={handleCustomThemeCreate} />

              {/* Custom Themes Section */}
              {Object.keys(customThemes).length > 0 && (
                <div className="mb-8">
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-fg-primary uppercase tracking-wide">
                      Your Custom Themes
                    </h3>
                    <p className="text-xs text-fg-secondary mt-1">
                      Themes you've created
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.values(customThemes).map((theme) => {
                      const isActive = selectedThemeId === theme.id

                      return (
                        <div key={theme.id} className="relative">
                          <button
                            onClick={() => handleThemeSelect(theme.id)}
                            className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                              isActive
                                ? 'border-accent-primary ring-2 ring-accent-primary/20'
                                : 'border-border-primary hover:border-border-focus'
                            }`}
                          >
                            {/* Theme Preview - Same as preset themes */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-sm font-semibold text-fg-primary">
                                  {theme.name}
                                </div>
                                {isActive && (
                                  <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: theme.colors.accent.primary }}>
                                    <Check size={10} style={{ color: theme.colors.fg.inverse }} />
                                    <span className="text-[10px] font-medium" style={{ color: theme.colors.fg.inverse }}>Active</span>
                                  </div>
                                )}
                              </div>

                              <div
                                className="rounded-lg border overflow-hidden"
                                style={{
                                  backgroundColor: theme.colors.bg.primary,
                                  borderColor: theme.colors.border.primary
                                }}
                              >
                                <div
                                  className="p-3 border-b"
                                  style={{
                                    backgroundColor: theme.colors.bg.secondary,
                                    borderColor: theme.colors.border.primary
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.accent.primary }} />
                                    <div className="text-[10px] font-medium" style={{ color: theme.colors.fg.primary }}>
                                      Notes
                                    </div>
                                  </div>
                                  <div className="text-[9px]" style={{ color: theme.colors.fg.secondary }}>
                                    Custom theme
                                  </div>
                                </div>

                                <div className="p-3 space-y-2">
                                  <div className="space-y-1">
                                    <div className="text-[10px] font-medium" style={{ color: theme.colors.fg.primary }}>
                                      Primary text
                                    </div>
                                    <div className="text-[9px]" style={{ color: theme.colors.fg.secondary }}>
                                      Secondary text
                                    </div>
                                  </div>

                                  <div className="flex gap-1 pt-1">
                                    <div className="flex-1 h-1 rounded" style={{ backgroundColor: theme.colors.syntax.purple }} />
                                    <div className="flex-1 h-1 rounded" style={{ backgroundColor: theme.colors.syntax.blue }} />
                                    <div className="flex-1 h-1 rounded" style={{ backgroundColor: theme.colors.syntax.green }} />
                                    <div className="flex-1 h-1 rounded" style={{ backgroundColor: theme.colors.syntax.yellow }} />
                                    <div className="flex-1 h-1 rounded" style={{ backgroundColor: theme.colors.syntax.red }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteCustomTheme(theme.id)}
                            className="absolute top-2 right-2 p-1.5 bg-semantic-error/10 hover:bg-semantic-error/20 rounded transition-colors"
                            title="Delete custom theme"
                          >
                            <Trash2 size={14} className="text-semantic-error" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Color Schemes Section */}
              <div>
                <h3 className="text-sm font-bold text-fg-primary mb-2 uppercase tracking-wide">
                  Preset Themes
                </h3>
                <p className="text-xs text-fg-secondary mb-4">
                  Or choose from our curated collection
                </p>
              </div>

              {themeCollections.map((collection) => (
                <div key={collection.id}>
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-fg-primary">
                      {collection.name}
                    </h3>
                    <p className="text-xs text-fg-secondary mt-0.5">
                      {collection.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {collection.themes.map((themeId) => {
                      const theme = getTheme(themeId)
                      if (!theme) return null

                      const isActive = selectedThemeId === themeId

                      return (
                        <button
                          key={themeId}
                          onClick={() => handleThemeSelect(themeId)}
                          className={`relative p-4 border-2 rounded-lg transition-all text-left ${
                            isActive
                              ? 'border-accent-primary ring-2 ring-accent-primary/20'
                              : 'border-border-primary hover:border-border-focus'
                          }`}
                        >
                          {/* WYSIWYG Theme Preview */}
                          <div className="space-y-2">
                            {/* Theme Name Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-sm font-semibold text-fg-primary">
                                {theme.name.replace('Sonokai ', '').replace('Monokai Pro ', '')}
                              </div>
                              {isActive && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: theme.colors.accent.primary }}>
                                  <Check size={10} style={{ color: theme.colors.fg.inverse }} />
                                  <span className="text-[10px] font-medium" style={{ color: theme.colors.fg.inverse }}>Active</span>
                                </div>
                              )}
                            </div>

                            {/* Main Preview Area - Shows actual UI */}
                            <div
                              className="rounded-lg border overflow-hidden"
                              style={{
                                backgroundColor: theme.colors.bg.primary,
                                borderColor: theme.colors.border.primary
                              }}
                            >
                              {/* Sidebar Simulation */}
                              <div
                                className="p-3 border-b"
                                style={{
                                  backgroundColor: theme.colors.bg.secondary,
                                  borderColor: theme.colors.border.primary
                                }}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.accent.primary }} />
                                  <div className="text-[10px] font-medium" style={{ color: theme.colors.fg.primary }}>
                                    Notes
                                  </div>
                                </div>
                                <div className="text-[9px]" style={{ color: theme.colors.fg.secondary }}>
                                  Starred items
                                </div>
                              </div>

                              {/* Content Area with Sample Task */}
                              <div className="p-3 space-y-2">
                                {/* Sample Text Hierarchy */}
                                <div className="space-y-1">
                                  <div className="text-[10px] font-medium" style={{ color: theme.colors.fg.primary }}>
                                    Primary text
                                  </div>
                                  <div className="text-[9px]" style={{ color: theme.colors.fg.secondary }}>
                                    Secondary text
                                  </div>
                                  <div className="text-[9px]" style={{ color: theme.colors.fg.tertiary }}>
                                    Tertiary text
                                  </div>
                                </div>

                                {/* Sample Task Item */}
                                <div
                                  className="flex items-center gap-2 p-2 rounded border"
                                  style={{
                                    backgroundColor: theme.colors.bg.tertiary,
                                    borderColor: theme.colors.border.primary
                                  }}
                                >
                                  <div className="w-2 h-2 rounded border" style={{ borderColor: theme.colors.border.primary }} />
                                  <div className="flex-1 text-[9px]" style={{ color: theme.colors.fg.primary }}>
                                    Sample task
                                  </div>
                                  <div
                                    className="px-1.5 py-0.5 rounded text-[8px] font-medium"
                                    style={{
                                      backgroundColor: `${theme.colors.syntax.blue}20`,
                                      color: theme.colors.syntax.blue
                                    }}
                                  >
                                    DOING
                                  </div>
                                </div>

                                {/* Status Colors Row */}
                                <div className="flex gap-1 pt-1">
                                  <div className="flex-1 h-1 rounded" style={{ backgroundColor: theme.colors.syntax.purple }} title="Purple" />
                                  <div className="flex-1 h-1 rounded" style={{ backgroundColor: theme.colors.syntax.blue }} title="Blue" />
                                  <div className="flex-1 h-1 rounded" style={{ backgroundColor: theme.colors.syntax.green }} title="Green" />
                                  <div className="flex-1 h-1 rounded" style={{ backgroundColor: theme.colors.syntax.yellow }} title="Yellow" />
                                  <div className="flex-1 h-1 rounded" style={{ backgroundColor: theme.colors.syntax.red }} title="Red" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Music Tab */}
          {activeTab === 'music' && (
            <div className="space-y-6">
              {/* Spotify Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-fg-primary">
                    Spotify Playlists
                  </h3>
                  <button
                    onClick={() => {
                      setNewLink({ title: '', url: '', type: 'spotify' })
                      setIsAddingNew(true)
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-white text-xs font-medium rounded transition-colors"
                  >
                    <Plus size={14} />
                    Add Spotify
                  </button>
                </div>

                {musicLinks.spotify?.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-bg-secondary border border-border-primary rounded mb-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-fg-primary">
                          {link.title}
                        </span>
                        {link.is_default && (
                          <Star size={14} className="text-syntax-yellow fill-syntax-yellow" />
                        )}
                      </div>
                      <p className="text-xs text-fg-tertiary truncate">
                        {link.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!link.is_default && (
                        <button
                          onClick={() => handleSetDefault(link.id, 'spotify')}
                          className="p-1.5 hover:bg-bg-tertiary rounded transition-colors"
                          title="Set as default"
                        >
                          <Star size={16} className="text-fg-tertiary" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteLink(link.id, 'spotify')}
                        className="p-1.5 hover:bg-semantic-error/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-semantic-error" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* YouTube Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-fg-primary">
                    YouTube Videos
                  </h3>
                  <button
                    onClick={() => {
                      setNewLink({ title: '', url: '', type: 'youtube' })
                      setIsAddingNew(true)
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                  >
                    <Plus size={14} />
                    Add YouTube
                  </button>
                </div>

                {musicLinks.youtube?.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-bg-secondary border border-border-primary rounded mb-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-fg-primary">
                          {link.title}
                        </span>
                        {link.is_default && (
                          <Star size={14} className="text-syntax-yellow fill-syntax-yellow" />
                        )}
                      </div>
                      <p className="text-xs text-fg-tertiary truncate">
                        {link.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!link.is_default && (
                        <button
                          onClick={() => handleSetDefault(link.id, 'youtube')}
                          className="p-1.5 hover:bg-bg-tertiary rounded transition-colors"
                          title="Set as default"
                        >
                          <Star size={16} className="text-fg-tertiary" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteLink(link.id, 'youtube')}
                        className="p-1.5 hover:bg-semantic-error/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-semantic-error" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Link Form */}
              {isAddingNew && (
                <div className="border-t border-border-primary pt-4">
                  <h4 className="text-sm font-medium text-fg-primary mb-3">
                    Add New {newLink.type === 'spotify' ? 'Spotify' : 'YouTube'} Link
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Title (e.g., 'Focus Playlist', 'Brown Noise')"
                      value={newLink.title}
                      onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded text-sm text-fg-primary placeholder-fg-tertiary focus:outline-none focus:border-border-focus"
                    />
                    <input
                      type="text"
                      placeholder="URL"
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded text-sm text-fg-primary placeholder-fg-tertiary focus:outline-none focus:border-border-focus"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddLink}
                        className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/80 text-fg-inverse text-sm font-medium rounded transition-colors"
                      >
                        Add Link
                      </button>
                      <button
                        onClick={() => setIsAddingNew(false)}
                        className="px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary text-fg-primary text-sm font-medium rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * TagInput Component
 * Input for adding hierarchical tags with autocomplete
 */

import { useState, useEffect, useRef } from 'react'
import { Plus, AlertCircle } from 'lucide-react'
import { searchTags } from '../services/tagService'
import { validateTagPath } from '../utils/tagUtils'

export default function TagInput({ onAddTag, placeholder = 'Add tag...', compact = false }) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Search for tag suggestions as user types
  useEffect(() => {
    const searchForTags = async () => {
      if (inputValue.trim().length < 1) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      try {
        setIsLoading(true)
        const results = await searchTags(inputValue)

        // Determine the current level being typed
        const trimmedInput = inputValue.trim()
        const slashCount = (trimmedInput.match(/\//g) || []).length
        const endsWithSlash = trimmedInput.endsWith('/')
        const currentLevel = endsWithSlash ? slashCount : slashCount

        // If user is typing at a specific level, filter to show only that level
        // Example: "work/" should show only L1 tags under "work"
        // Example: "work/qbotica/" should show only L2 tags under "work/qbotica"
        let filteredResults = results

        if (endsWithSlash && trimmedInput.length > 1) {
          // User just typed a slash - show next level suggestions
          const parentPath = trimmedInput.slice(0, -1)
          filteredResults = results.filter(tag =>
            tag.full_path.startsWith(parentPath + '/') &&
            tag.level === currentLevel
          )
        } else {
          // User is typing within a level - show suggestions for that level
          filteredResults = results.filter(tag => tag.level === currentLevel)
        }

        setSuggestions(filteredResults)
        setShowSuggestions(filteredResults.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Error searching tags:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchForTags, 200)
    return () => clearTimeout(debounce)
  }, [inputValue])

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value
    setInputValue(value)
    setError('')
  }

  // Handle adding a tag
  const handleAddTag = async () => {
    if (!inputValue.trim()) {
      return
    }

    // Validate tag path
    const validation = validateTagPath(inputValue.trim())
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    try {
      await onAddTag(inputValue.trim())
      setInputValue('')
      setError('')
      setSuggestions([])
      setShowSuggestions(false)
      inputRef.current?.focus()
    } catch (error) {
      console.error('Error adding tag:', error)
      setError(error.message || 'Failed to add tag')
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.full_path)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      if (showSuggestions && selectedIndex >= 0 && suggestions[selectedIndex]) {
        // Select highlighted suggestion
        handleSuggestionClick(suggestions[selectedIndex])
      } else {
        // Add tag
        handleAddTag()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showSuggestions && suggestions.length > 0) {
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showSuggestions && suggestions.length > 0) {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  // Compact mode - inline without button
  if (compact) {
    return (
      <div className="relative inline-block min-w-[160px]">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full bg-bg-secondary border border-border-primary rounded px-2 py-0.5 text-xs text-fg-primary placeholder-fg-tertiary focus:outline-none focus:border-accent-primary font-mono"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-64 mt-1 bg-bg-elevated border border-border-primary rounded shadow-lg max-h-48 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full px-3 py-2 text-left text-xs font-mono transition-colors ${
                  index === selectedIndex
                    ? 'bg-accent-primary/20 text-fg-primary'
                    : 'text-fg-primary hover:bg-bg-tertiary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{suggestion.full_path}</span>
                  <span className="text-fg-tertiary text-[10px]">L{suggestion.level}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Error tooltip */}
        {error && (
          <div className="absolute z-50 top-full left-0 mt-1 px-2 py-1 bg-semantic-error text-white text-[10px] rounded shadow-lg whitespace-nowrap">
            {error}
          </div>
        )}
      </div>
    )
  }

  // Full mode - with button and help text
  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full bg-bg-secondary border border-border-primary rounded px-3 py-2 text-xs text-fg-primary placeholder-fg-tertiary focus:outline-none focus:border-border-focus font-mono"
          />

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-bg-elevated border border-border-primary rounded shadow-lg max-h-48 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-3 py-2 text-left text-xs font-mono transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent-primary/20 text-fg-primary'
                      : 'text-fg-primary hover:bg-bg-tertiary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{suggestion.full_path}</span>
                    <span className="text-fg-tertiary text-[10px]">Level {suggestion.level}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleAddTag}
          disabled={!inputValue.trim() || isLoading}
          className="flex-shrink-0 px-3 py-2 bg-accent-primary hover:bg-accent-secondary disabled:bg-bg-tertiary disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-1.5"
          title="Add tag"
        >
          <Plus size={14} />
          <span className="text-xs font-medium">Add</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-semantic-error">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}

      {/* Helper text */}
      <p className="mt-2 text-[10px] text-fg-tertiary">
        Use slashes (/) for hierarchy: work/qbotica/projects/calvetti
      </p>
    </div>
  )
}

/**
 * TagFilter Component
 * Filter panel for searching and selecting tags to filter tasks
 */

import { useState, useEffect } from 'react'
import { Search, X, Tag as TagIcon, ChevronRight } from 'lucide-react'
import { fetchAllTags, searchTags } from '../services/tagService'

/**
 * Get color for tag based on its level
 */
function getTagColor(level) {
  const colors = [
    'bg-syntax-blue/20 text-syntax-blue border-syntax-blue/30',
    'bg-syntax-purple/20 text-syntax-purple border-syntax-purple/30',
    'bg-syntax-green/20 text-syntax-green border-syntax-green/30',
    'bg-syntax-yellow/20 text-syntax-yellow border-syntax-yellow/30',
    'bg-accent-primary/20 text-accent-primary border-accent-primary/30'
  ]
  return colors[Math.min(level, colors.length - 1)]
}

export default function TagFilter({ selectedTagIds = [], onTagsChange }) {
  const [allTags, setAllTags] = useState([])
  const [filteredTags, setFilteredTags] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [expandedRoots, setExpandedRoots] = useState(new Set())

  // Load all tags on mount
  useEffect(() => {
    loadTags()
  }, [])

  // Filter tags based on search query
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setFilteredTags(allTags)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = allTags.filter(tag =>
        tag.full_path.toLowerCase().includes(query) ||
        tag.name.toLowerCase().includes(query)
      )
      setFilteredTags(filtered)

      // Auto-expand roots that have matching tags
      const roots = new Set()
      filtered.forEach(tag => {
        const root = tag.full_path.split('/')[0]
        roots.add(root)
      })
      setExpandedRoots(roots)
    }
  }, [searchQuery, allTags])

  const loadTags = async () => {
    try {
      setIsLoading(true)
      const tags = await fetchAllTags()
      setAllTags(tags)
      setFilteredTags(tags)
    } catch (error) {
      console.error('Error loading tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleTag = (tagId) => {
    const newSelectedIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId]

    onTagsChange(newSelectedIds)
  }

  const handleClearAll = () => {
    onTagsChange([])
    setSearchQuery('')
  }

  const toggleRoot = (root) => {
    const newExpanded = new Set(expandedRoots)
    if (newExpanded.has(root)) {
      newExpanded.delete(root)
    } else {
      newExpanded.add(root)
    }
    setExpandedRoots(newExpanded)
  }

  // Group tags by root (first part of path)
  const groupedTags = {}
  filteredTags.forEach(tag => {
    const root = tag.full_path.split('/')[0]
    if (!groupedTags[root]) {
      groupedTags[root] = []
    }
    groupedTags[root].push(tag)
  })

  // Get selected tags for display
  const selectedTags = allTags.filter(tag => selectedTagIds.includes(tag.id))

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tags..."
          className="w-full pl-9 pr-3 py-2 bg-bg-secondary border border-border-primary rounded text-xs text-fg-primary placeholder-fg-tertiary focus:outline-none focus:border-border-focus font-mono"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-fg-tertiary hover:text-fg-primary transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fg-primary">
              Active Filters ({selectedTags.length})
            </span>
            <button
              onClick={handleClearAll}
              className="text-xs text-fg-tertiary hover:text-semantic-error transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleToggleTag(tag.id)}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono transition-colors ${getTagColor(tag.level)}`}
                title={`Click to remove: ${tag.full_path}`}
              >
                <TagIcon size={10} />
                <span>{tag.full_path}</span>
                <X size={10} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Available Tags */}
      <div>
        <div className="text-xs font-semibold text-fg-secondary mb-2">
          {searchQuery ? 'Search Results' : 'All Tags'}
          {!isLoading && ` (${filteredTags.length})`}
        </div>

        {isLoading ? (
          <div className="text-xs text-fg-tertiary py-4 text-center">
            Loading tags...
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="text-xs text-fg-tertiary py-4 text-center italic">
            {searchQuery ? 'No tags match your search' : 'No tags yet. Add tags to tasks to see them here.'}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(groupedTags).map(([root, tags]) => {
              const isExpanded = expandedRoots.has(root)
              const rootTag = tags.find(t => t.full_path === root)
              const childTags = tags.filter(t => t.full_path !== root)

              return (
                <div key={root} className="space-y-1">
                  {/* Root Tag */}
                  <div className="flex items-center gap-1">
                    {childTags.length > 0 && (
                      <button
                        onClick={() => toggleRoot(root)}
                        className="p-0.5 hover:bg-bg-tertiary rounded transition-colors"
                      >
                        <ChevronRight
                          size={12}
                          className={`text-fg-tertiary transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </button>
                    )}
                    {rootTag && (
                      <button
                        onClick={() => handleToggleTag(rootTag.id)}
                        className={`flex-1 flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono transition-all ${
                          selectedTagIds.includes(rootTag.id)
                            ? `${getTagColor(rootTag.level)} ring-2 ring-accent-primary/50`
                            : `${getTagColor(rootTag.level)} opacity-60 hover:opacity-100`
                        }`}
                      >
                        <TagIcon size={10} />
                        <span className="flex-1 text-left">{rootTag.name}</span>
                        <span className="text-[9px] text-fg-tertiary">
                          {tags.filter(t => selectedTagIds.includes(t.id)).length > 0 && '•'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Child Tags */}
                  {isExpanded && childTags.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {childTags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => handleToggleTag(tag.id)}
                          className={`w-full flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono transition-all ${
                            selectedTagIds.includes(tag.id)
                              ? `${getTagColor(tag.level)} ring-2 ring-accent-primary/50`
                              : `${getTagColor(tag.level)} opacity-60 hover:opacity-100`
                          }`}
                          style={{ paddingLeft: `${(tag.level) * 0.5 + 0.5}rem` }}
                        >
                          <TagIcon size={10} />
                          <span className="flex-1 text-left">{tag.name}</span>
                          <span className="text-[9px] text-fg-tertiary">L{tag.level}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-[10px] text-fg-tertiary pt-2 border-t border-border-primary">
        Select tags to filter tasks. Selecting a parent tag (e.g., "work") will show all tasks with that tag or any of its children (e.g., "work/qbotica").
      </div>
    </div>
  )
}

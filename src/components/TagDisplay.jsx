/**
 * TagDisplay Component
 * Displays hierarchical tags with remove functionality
 */

import { X, Tag as TagIcon } from 'lucide-react'

/**
 * Get color for tag based on its level
 * Deeper levels get different colors
 */
function getTagColor(level) {
  const colors = [
    'bg-syntax-blue/20 text-syntax-blue border-syntax-blue/30',     // Level 0
    'bg-syntax-purple/20 text-syntax-purple border-syntax-purple/30', // Level 1
    'bg-syntax-green/20 text-syntax-green border-syntax-green/30',   // Level 2
    'bg-syntax-yellow/20 text-syntax-yellow border-syntax-yellow/30', // Level 3
    'bg-accent-primary/20 text-accent-primary border-accent-primary/30' // Level 4+
  ]

  return colors[Math.min(level, colors.length - 1)]
}

/**
 * Individual tag badge component
 */
function TagBadge({ tag, onRemove, showRemove = true, size = 'sm' }) {
  const colorClass = getTagColor(tag.level)

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5'
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded border font-mono ${colorClass} ${sizeClasses[size]} transition-colors`}
      title={`Level ${tag.level} tag`}
    >
      <TagIcon size={10} />
      <span>{tag.full_path}</span>

      {showRemove && onRemove && (
        <button
          onClick={() => onRemove(tag)}
          className="hover:opacity-70 transition-opacity"
          title={`Remove tag: ${tag.full_path}`}
        >
          <X size={10} />
        </button>
      )}
    </div>
  )
}

/**
 * Main TagDisplay component
 * Shows all tags for an entity with grouping options
 */
export default function TagDisplay({
  tags = [],
  onRemoveTag,
  showRemove = true,
  size = 'sm',
  groupByHierarchy = false,
  emptyMessage = 'No tags yet'
}) {
  if (!tags || tags.length === 0) {
    return (
      <div className="text-xs text-fg-tertiary italic">
        {emptyMessage}
      </div>
    )
  }

  // Sort tags by level and path
  const sortedTags = [...tags].sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level
    }
    return a.full_path.localeCompare(b.full_path)
  })

  if (groupByHierarchy) {
    // Group tags by their root (first part of path)
    const grouped = {}

    sortedTags.forEach(tag => {
      const root = tag.full_path.split('/')[0]
      if (!grouped[root]) {
        grouped[root] = []
      }
      grouped[root].push(tag)
    })

    return (
      <div className="space-y-3">
        {Object.entries(grouped).map(([root, groupTags]) => (
          <div key={root}>
            <div className="text-[10px] text-fg-tertiary font-semibold mb-1.5 uppercase">
              {root}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {groupTags.map(tag => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  onRemove={onRemoveTag}
                  showRemove={showRemove}
                  size={size}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Simple flat list
  return (
    <div className="flex flex-wrap gap-1.5">
      {sortedTags.map(tag => (
        <TagBadge
          key={tag.id}
          tag={tag}
          onRemove={onRemoveTag}
          showRemove={showRemove}
          size={size}
        />
      ))}
    </div>
  )
}

/**
 * Compact tag display for showing only leaf tags (deepest level)
 * Useful for task lists where you don't want to show all hierarchy
 */
export function CompactTagDisplay({ tags = [], size = 'xs' }) {
  if (!tags || tags.length === 0) {
    return null
  }

  // Filter to only leaf tags (tags that aren't parents of other tags)
  const leafTags = tags.filter(tag => {
    const isParent = tags.some(otherTag =>
      otherTag.full_path !== tag.full_path &&
      otherTag.full_path.startsWith(tag.full_path + '/')
    )
    return !isParent
  })

  if (leafTags.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1">
      {leafTags.map(tag => (
        <TagBadge
          key={tag.id}
          tag={tag}
          showRemove={false}
          size={size}
        />
      ))}
    </div>
  )
}

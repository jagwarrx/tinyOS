/**
 * TagTreeView Component
 * Displays hierarchical tags in a collapsible tree structure with drag-and-drop reordering
 */

import { useState } from 'react'
import { ChevronRight, ChevronDown, Tag, GripVertical } from 'lucide-react'

/**
 * Recursive tree node component
 */
function TagTreeNode({ node, onSelectTag, selectedTagId, depth = 0, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isDragOver }) {
  const [isExpanded, setIsExpanded] = useState(depth < 2) // Auto-expand first 2 levels
  const hasChildren = node.children && node.children.length > 0

  const handleToggle = (e) => {
    e.stopPropagation()
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleSelect = (e) => {
    e.stopPropagation()
    onSelectTag(node.tag)
  }

  const isSelected = selectedTagId === node.tag.id
  const isBeingDragged = isDragging === node.tag.id
  const isBeingDraggedOver = isDragOver === node.tag.id

  return (
    <div className="select-none">
      <div
        draggable={depth === 0} // Only root-level tags can be dragged
        onDragStart={(e) => depth === 0 && onDragStart(e, node.tag.id)}
        onDragOver={(e) => depth === 0 && onDragOver(e, node.tag.id)}
        onDrop={(e) => depth === 0 && onDrop(e, node.tag.id)}
        onDragEnd={(e) => depth === 0 && onDragEnd(e)}
        className={`flex items-center gap-1.5 py-1 px-2 cursor-pointer transition-colors group ${
          isSelected
            ? 'bg-accent-primary/20 text-fg-primary'
            : 'hover:bg-bg-tertiary/50 text-fg-primary'
        } ${isBeingDragged ? 'opacity-50' : ''} ${isBeingDraggedOver && !isBeingDragged ? 'border-t-2 border-accent-primary' : ''}`}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        {/* Drag handle - only for root level tags */}
        {depth === 0 && (
          <GripVertical size={14} className="text-fg-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing" />
        )}

        {/* Expand/collapse icon */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 p-0.5 hover:bg-bg-tertiary rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={14} className="text-fg-tertiary" />
            ) : (
              <ChevronRight size={14} className="text-fg-tertiary" />
            )}
          </button>
        ) : (
          <div className="w-[22px]" /> // Spacer for alignment
        )}

        {/* Tag icon */}
        <Tag size={12} className="text-fg-tertiary flex-shrink-0" />

        {/* Tag name - clickable */}
        <button
          onClick={handleSelect}
          className="flex-1 text-left text-xs font-mono truncate"
          title={node.tag.full_path}
        >
          {node.tag.name}
        </button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TagTreeNode
              key={child.tag.id}
              node={child}
              onSelectTag={onSelectTag}
              selectedTagId={selectedTagId}
              depth={depth + 1}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              isDragging={isDragging}
              isDragOver={isDragOver}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Main TagTreeView component
 */
export default function TagTreeView({ tagTree, onSelectTag, selectedTagId, onReorder }) {
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  if (!tagTree || tagTree.length === 0) {
    return (
      <div className="p-4 text-center text-fg-tertiary">
        <Tag size={32} className="mx-auto mb-2 opacity-40" />
        <p className="text-xs">No tags yet</p>
      </div>
    )
  }

  const handleDragStart = (e, tagId) => {
    setDraggedId(tagId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, tagId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(tagId)
  }

  const handleDrop = (e, targetId) => {
    e.preventDefault()

    if (draggedId && draggedId !== targetId) {
      // Find indices
      const draggedIndex = tagTree.findIndex(node => node.tag.id === draggedId)
      const targetIndex = tagTree.findIndex(node => node.tag.id === targetId)

      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Notify parent to reorder
        onReorder(draggedIndex, targetIndex)
      }
    }

    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <div className="py-2">
      {tagTree.map((node) => (
        <TagTreeNode
          key={node.tag.id}
          node={node}
          onSelectTag={onSelectTag}
          selectedTagId={selectedTagId}
          depth={0}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          isDragging={draggedId}
          isDragOver={dragOverId}
        />
      ))}
    </div>
  )
}

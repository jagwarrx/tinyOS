import { Plus, FileText, Home, Star, Tag, ChevronDown, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import TagTreeView from './TagTreeView'
import { buildTagHierarchy } from '../utils/tagUtils'
import { fetchAllTags } from '../services/tagService'
import { loadTagOrder, saveTagOrder, applyCustomOrder, reorderArray } from '../utils/tagOrderUtils'

export default function NotesList({
  notes,           // from context
  selectedNote,    // from context
  homeNote,        // from context
  onSelectNote,    // callback
  onCreateNote,    // callback
  onGoHome,        // callback
  onToggleStar,    // callback
  onSelectTag      // callback for tag selection
}) {
  const [allTags, setAllTags] = useState([])
  const [tagTree, setTagTree] = useState([])
  const [isTagsExpanded, setIsTagsExpanded] = useState(true)
  const [isNotesExpanded, setIsNotesExpanded] = useState(true)
  const [selectedTagId, setSelectedTagId] = useState(null)

  // Fetch all tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await fetchAllTags()
        setAllTags(tags)

        // Apply custom order from localStorage
        const customOrder = loadTagOrder()
        const orderedTags = applyCustomOrder(tags, customOrder)

        const tree = buildTagHierarchy(orderedTags)
        setTagTree(tree)
      } catch (error) {
        console.error('Error loading tags:', error)
      }
    }
    loadTags()
  }, [])

  // Refresh tags periodically to catch new tags created from terminal
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const tags = await fetchAllTags()
        // Only update if tags have changed
        if (JSON.stringify(tags) !== JSON.stringify(allTags)) {
          setAllTags(tags)

          // Apply custom order from localStorage
          const customOrder = loadTagOrder()
          const orderedTags = applyCustomOrder(tags, customOrder)

          const tree = buildTagHierarchy(orderedTags)
          setTagTree(tree)
        }
      } catch (error) {
        console.error('Error refreshing tags:', error)
      }
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [allTags])
  const getPreview = (content) => {
    try {
      const parsed = JSON.parse(content)
      const firstParagraph = parsed?.root?.children?.[0]?.children?.[0]?.text || ''
      return firstParagraph.slice(0, 80) + (firstParagraph.length > 80 ? '...' : '')
    } catch {
      return 'Empty note'
    }
  }

  // Handle tag selection
  const handleSelectTag = (tag) => {
    setSelectedTagId(tag.id)
    onSelectTag(tag)
  }

  // Handle tag reordering
  const handleReorder = (fromIndex, toIndex) => {
    // Reorder the tag tree
    const reorderedTree = reorderArray(tagTree, fromIndex, toIndex)
    setTagTree(reorderedTree)

    // Extract root-level tag IDs in new order
    const newOrder = reorderedTree.map(node => node.tag.id)

    // Save to localStorage
    saveTagOrder(newOrder)
  }

  // Filter: show only starred notes (including HOME if starred), max 5
  const starredNotes = notes.filter(n => n.is_starred).slice(0, 5)

  return (
    <div className="w-72 h-screen bg-bg-secondary flex flex-col border-r border-border-primary">
      <div className="pt-20 pb-4 px-4 border-b border-border-primary flex justify-between items-center">
        <h2 className="text-lg font-medium text-fg-primary">Notes</h2>
        <button
          onClick={onCreateNote}
          className="p-2 text-fg-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
          title="New Note"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Starred Notes Section */}
        <div className="border-t border-b border-border-primary">
          <button
            onClick={() => setIsNotesExpanded(!isNotesExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-bg-tertiary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Star size={14} className="text-fg-tertiary" />
              <span className="text-lg font-medium text-fg-primary">Notes</span>
            </div>
            {isNotesExpanded ? (
              <ChevronDown size={16} className="text-fg-tertiary" />
            ) : (
              <ChevronRight size={16} className="text-fg-tertiary" />
            )}
          </button>

          {isNotesExpanded && (
            <>
              {starredNotes.length === 0 ? (
                <div className="p-4 text-center text-fg-tertiary">
                  <Star size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No starred notes</p>
                  <p className="text-[10px] mt-1">Star notes to pin them here</p>
                </div>
              ) : (
                <>
                  {starredNotes.map((note) => {
                const isSelected = selectedNote?.id === note.id

                return (
                  <div
                    key={note.id}
                    className={`p-3 border-b border-border-secondary cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-bg-tertiary'
                        : 'hover:bg-bg-tertiary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1">
                        {note.is_home && (
                          <Home size={14} className="text-fg-tertiary flex-shrink-0" />
                        )}
                        <button
                          onClick={(e) => onSelectNote(note, e.shiftKey)}
                          className="font-medium text-sm flex-1 text-left text-fg-primary"
                          title="Click to open | Shift+Click for side-by-side"
                        >
                          {note.title || 'Untitled'}
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleStar(note.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        title="Unstar (hides from sidebar)"
                      >
                        <Star
                          size={14}
                          className="fill-syntax-yellow text-syntax-yellow"
                        />
                      </button>
                    </div>

                    <div className="text-xs text-fg-secondary line-clamp-2">
                      {getPreview(note.content)}
                    </div>

                    <div className="text-xs text-fg-tertiary mt-1.5">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                )
              })}
                </>
              )}
            </>
          )}
        </div>

        {/* Tags Section */}
        <div>
          <button
            onClick={() => setIsTagsExpanded(!isTagsExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-bg-tertiary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-fg-tertiary" />
              <span className="text-lg font-medium text-fg-primary">Tags</span>
            </div>
            {isTagsExpanded ? (
              <ChevronDown size={16} className="text-fg-tertiary" />
            ) : (
              <ChevronRight size={16} className="text-fg-tertiary" />
            )}
          </button>

          {isTagsExpanded && (
            <div className="max-h-96 overflow-y-auto">
              <TagTreeView
                tagTree={tagTree}
                onSelectTag={handleSelectTag}
                selectedTagId={selectedTagId}
                onReorder={handleReorder}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
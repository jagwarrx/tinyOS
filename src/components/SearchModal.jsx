import { useState, useEffect, useRef } from 'react'
import { X, Search, FileText, CheckSquare, ArrowRight } from 'lucide-react'

/**
 * Simple fuzzy search scorer
 * Returns a score between 0-1 based on how well the query matches the text
 */
function fuzzyScore(query, text) {
  if (!query || !text) return 0

  query = query.toLowerCase()
  text = text.toLowerCase()

  // Exact match gets highest score
  if (text === query) return 1.0
  if (text.includes(query)) return 0.8

  // Fuzzy match: check if all query characters appear in order
  let queryIndex = 0
  let textIndex = 0
  let matches = 0

  while (queryIndex < query.length && textIndex < text.length) {
    if (query[queryIndex] === text[textIndex]) {
      matches++
      queryIndex++
    }
    textIndex++
  }

  if (matches === query.length) {
    // All characters matched, score based on match density
    return 0.5 * (matches / text.length)
  }

  return 0
}

/**
 * SearchModal Component
 *
 * Global search across notes and tasks with fuzzy matching.
 * Features:
 * - Keyboard navigation (up/down arrows, Enter to select)
 * - Fuzzy search across titles and content
 * - Grouped results (Notes, Tasks)
 * - Shows context/preview
 *
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Callback to close modal
 * @param {Array} notes - All notes to search
 * @param {Array} tasks - All tasks to search
 * @param {function} onSelectNote - Callback when note is selected
 * @param {function} onSelectTask - Callback when task is selected
 */
export default function SearchModal({
  isOpen,
  onClose,
  notes = [],
  tasks = [],
  onSelectNote,
  onSelectTask
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ notes: [], tasks: [] })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Search function
  useEffect(() => {
    if (!query.trim()) {
      setResults({ notes: [], tasks: [] })
      setSelectedIndex(0)
      return
    }

    // Search notes
    const noteResults = notes
      .map(note => {
        const titleScore = fuzzyScore(query, note.title || '')

        // Extract text from Lexical content
        let contentText = ''
        try {
          const content = JSON.parse(note.content)
          const extractText = (node) => {
            if (node.text) return node.text
            if (node.children) {
              return node.children.map(extractText).join(' ')
            }
            return ''
          }
          contentText = extractText(content.root)
        } catch (e) {
          // Ignore parse errors
        }

        const contentScore = fuzzyScore(query, contentText)
        const maxScore = Math.max(titleScore, contentScore)

        return {
          ...note,
          score: maxScore,
          preview: contentText.substring(0, 100)
        }
      })
      .filter(n => n.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Top 5 notes

    // Search tasks
    const taskResults = tasks
      .map(task => {
        const textScore = fuzzyScore(query, task.text || '')
        const contextScore = fuzzyScore(query, task.context || '')
        const workNotesScore = fuzzyScore(query, task.work_notes || '')
        const maxScore = Math.max(textScore, contextScore, workNotesScore)

        return {
          ...task,
          score: maxScore
        }
      })
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Top 5 tasks

    setResults({
      notes: noteResults,
      tasks: taskResults
    })
    setSelectedIndex(0)
  }, [query, notes, tasks])

  // Get flat list of all results for keyboard navigation
  const allResults = [
    ...results.notes.map(n => ({ type: 'note', item: n })),
    ...results.tasks.map(t => ({ type: 'task', item: t }))
  ]

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = allResults[selectedIndex]
      if (selected) {
        if (selected.type === 'note') {
          onSelectNote(selected.item)
        } else {
          onSelectTask(selected.item)
        }
        onClose()
      }
    }
  }

  // Handle result click
  const handleResultClick = (type, item) => {
    if (type === 'note') {
      onSelectNote(item)
    } else {
      onSelectTask(item)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[100] pt-20"
      onClick={onClose}
    >
      <div
        className="bg-bg-elevated rounded-xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col border border-border-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border-primary">
          <Search size={20} className="text-fg-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes and tasks..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-fg-primary placeholder-fg-tertiary"
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded transition-colors"
            title="Close (Esc)"
          >
            <X size={20} className="text-fg-secondary" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {!query.trim() && (
            <div className="text-center py-12">
              <Search size={48} className="text-fg-tertiary mx-auto mb-4 opacity-50" />
              <p className="text-fg-secondary text-sm">
                Start typing to search notes and tasks...
              </p>
              <p className="text-fg-tertiary text-xs mt-2">
                Use ↑↓ to navigate, Enter to select, Esc to close
              </p>
            </div>
          )}

          {query.trim() && allResults.length === 0 && (
            <div className="text-center py-12">
              <p className="text-fg-secondary text-sm">No results found for "{query}"</p>
            </div>
          )}

          {/* Notes Results */}
          {results.notes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wide text-fg-tertiary mb-3 px-2">
                Notes ({results.notes.length})
              </h3>
              <div className="space-y-1">
                {results.notes.map((note, index) => {
                  const globalIndex = index
                  const isSelected = selectedIndex === globalIndex

                  return (
                    <button
                      key={note.id}
                      onClick={() => handleResultClick('note', note)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full text-left p-3 rounded-lg transition-all group ${
                        isSelected
                          ? 'bg-accent-primary text-fg-inverse'
                          : 'hover:bg-bg-secondary'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText
                          size={18}
                          className={`flex-shrink-0 mt-0.5 ${
                            isSelected ? 'text-fg-inverse' : 'text-fg-tertiary'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm mb-1 ${
                            isSelected ? 'text-fg-inverse' : 'text-fg-primary'
                          }`}>
                            {note.title || 'Untitled'}
                          </div>
                          {note.preview && (
                            <div className={`text-xs line-clamp-2 ${
                              isSelected ? 'text-fg-inverse opacity-80' : 'text-fg-tertiary'
                            }`}>
                              {note.preview}
                            </div>
                          )}
                          {note.ref_id && (
                            <div className={`text-xs mt-1 font-mono ${
                              isSelected ? 'text-fg-inverse opacity-70' : 'text-fg-tertiary'
                            }`}>
                              {note.ref_id}
                            </div>
                          )}
                        </div>
                        <ArrowRight
                          size={16}
                          className={`flex-shrink-0 transition-transform ${
                            isSelected
                              ? 'text-fg-inverse translate-x-0'
                              : 'text-fg-tertiary opacity-0 group-hover:opacity-100 -translate-x-1'
                          }`}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tasks Results */}
          {results.tasks.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-fg-tertiary mb-3 px-2">
                Tasks ({results.tasks.length})
              </h3>
              <div className="space-y-1">
                {results.tasks.map((task, index) => {
                  const globalIndex = results.notes.length + index
                  const isSelected = selectedIndex === globalIndex

                  return (
                    <button
                      key={task.id}
                      onClick={() => handleResultClick('task', task)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full text-left p-3 rounded-lg transition-all group ${
                        isSelected
                          ? 'bg-accent-primary text-fg-inverse'
                          : 'hover:bg-bg-secondary'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <CheckSquare
                          size={18}
                          className={`flex-shrink-0 mt-0.5 ${
                            isSelected ? 'text-fg-inverse' : 'text-fg-tertiary'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm mb-1 ${
                            isSelected ? 'text-fg-inverse' : 'text-fg-primary'
                          }`}>
                            {task.text}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              isSelected
                                ? 'bg-fg-inverse/20 text-fg-inverse'
                                : 'bg-syntax-blue/20 text-syntax-blue'
                            }`}>
                              {task.status}
                            </span>
                            {task.ref_id && (
                              <span className={`text-xs font-mono ${
                                isSelected ? 'text-fg-inverse opacity-70' : 'text-fg-tertiary'
                              }`}>
                                {task.ref_id}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight
                          size={16}
                          className={`flex-shrink-0 transition-transform ${
                            isSelected
                              ? 'text-fg-inverse translate-x-0'
                              : 'text-fg-tertiary opacity-0 group-hover:opacity-100 -translate-x-1'
                          }`}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        {allResults.length > 0 && (
          <div className="px-6 py-3 border-t border-border-primary bg-bg-secondary">
            <div className="flex items-center gap-4 text-xs text-fg-tertiary">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-bg-tertiary border border-border-primary rounded text-[10px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-bg-tertiary border border-border-primary rounded text-[10px]">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 bg-bg-tertiary border border-border-primary rounded text-[10px]">↵</kbd>
                to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 bg-bg-tertiary border border-border-primary rounded text-[10px]">esc</kbd>
                to close
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

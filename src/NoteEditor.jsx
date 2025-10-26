import { useState, useEffect, useRef } from 'react'
import Editor from './Editor'
import { Home, Star } from 'lucide-react'

export default function NoteEditor({ 
  note, 
  allNotes,
  onSave, 
  onDelete,
  onSetAsHome,
  onToggleStar,
  onSetUp,
  onRemoveUp,
  onSetDown,
  onRemoveDown,
  onSetLeft,
  onSetRight,
  onRemoveLeft,
  onRemoveRight,
  onNavigate,
  onCreateDraftLinked
}) {
  const [title, setTitle] = useState('')
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const editorRef = useRef(null)
  const autoSaveTimerRef = useRef(null)
  const contextMenuRef = useRef(null)

  useEffect(() => {
    if (note) {
      setTitle(note.title || '')
    } else {
      setTitle('')
    }
  }, [note])

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setShowContextMenu(false)
      }
    }

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showContextMenu])

  // Handle right-click on title
  const handleTitleContextMenu = (e) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setShowContextMenu(true)
  }

  const handleSetAsHome = async () => {
    if (note) {
      await onSetAsHome(note.id)
      setShowContextMenu(false)
    }
  }

  // Auto-save on title or content change
  const triggerAutoSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave()
    }, 1000) // Auto-save after 1 second of inactivity
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    triggerAutoSave()
  }

  const handleSave = async () => {
    if (!note || !editorRef.current) return
    
    const content = editorRef.current.getContent()
    await onSave({ ...note, title, content })
  }

  const handleDelete = async () => {
    if (!note) return
    if (note.is_home) {
      alert('Cannot delete HOME note')
      return
    }
    if (window.confirm('Are you sure you want to delete this note?')) {
      await onDelete(note.id)
    }
  }

  // Keyboard navigation handler with draft creation
  useEffect(() => {
    if (!note) return

    const handleKeyDown = async (e) => {
      // Check if user is editing (focus is on title or editor)
      const isEditingTitle = document.activeElement.tagName === 'INPUT'
      const isEditingContent = document.activeElement.getAttribute('contenteditable') === 'true'
      const isEditing = isEditingTitle || isEditingContent
      
      // Check for Ctrl+Shift+Arrow (create new linked note)
      const isCreateNew = (e.ctrlKey || e.metaKey) && e.shiftKey
      
      // Check for Ctrl+Arrow (force navigation even when editing)
      const isForceNavigate = (e.ctrlKey || e.metaKey) && !e.shiftKey

      // Check for Ctrl+S (save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
        return
      }

      // Check for Ctrl+Backspace (delete)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
        e.preventDefault()
        handleDelete()
        return
      }

      // Plain arrow key navigation (only when not editing)
      if (!isEditing && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const canNavigate = (direction) => {
          switch(direction) {
            case 'up':
              return note.up_id !== null && note.up_id !== undefined
            case 'down':
              return note.down_id !== null && note.down_id !== undefined
            case 'left':
              return note.left_id !== null && note.left_id !== undefined
            case 'right':
              return note.right_id !== null && note.right_id !== undefined
            default:
              return false
          }
        }

        if (e.key === 'ArrowUp' && canNavigate('up')) {
          e.preventDefault()
          onNavigate(note.up_id)
          return
        }
        if (e.key === 'ArrowDown' && canNavigate('down')) {
          e.preventDefault()
          onNavigate(note.down_id)
          return
        }
        if (e.key === 'ArrowLeft' && canNavigate('left')) {
          e.preventDefault()
          onNavigate(note.left_id)
          return
        }
        if (e.key === 'ArrowRight' && canNavigate('right')) {
          e.preventDefault()
          onNavigate(note.right_id)
          return
        }
      }

      if (isCreateNew) {
        e.preventDefault()
        
        switch(e.key) {
          case 'ArrowUp':
            if (!note.up_id) {
              await onCreateDraftLinked(note, 'up')
            }
            break
          case 'ArrowDown':
            if (!note.down_id) {
              await onCreateDraftLinked(note, 'down')
            }
            break
          case 'ArrowLeft':
            if (!note.left_id) {
              await onCreateDraftLinked(note, 'left')
            }
            break
          case 'ArrowRight':
            if (!note.right_id) {
              await onCreateDraftLinked(note, 'right')
            }
            break
        }
      } else if (isForceNavigate) {
        e.preventDefault()
        
        switch(e.key) {
          case 'ArrowUp':
            if (note.up_id) {
              onNavigate(note.up_id)
            }
            break
          case 'ArrowDown':
            if (note.down_id) {
              onNavigate(note.down_id)
            }
            break
          case 'ArrowLeft':
            if (note.left_id) onNavigate(note.left_id)
            break
          case 'ArrowRight':
            if (note.right_id) onNavigate(note.right_id)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [note, onNavigate, onCreateDraftLinked, title])

  if (!note) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 max-w-lg">
          <div className="text-center">
            <p className="text-xl text-gray-400 dark:text-gray-600 mb-6">Select a note or create a new one</p>
            <div className="text-xs text-gray-500 dark:text-gray-500 space-y-2 bg-gray-50 dark:bg-gray-850 p-6 rounded-lg">
              <p className="font-medium mb-3 text-gray-600 dark:text-gray-400">Keyboard Shortcuts:</p>
              <p><kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">Ctrl+S</kbd> Save note</p>
              <p><kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">Ctrl+Backspace</kbd> Delete note</p>
              <p><kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">â†‘â†“â†â†’</kbd> Navigate (when not editing)</p>
              <p><kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">Ctrl+â†‘â†“â†â†’</kbd> Force navigate (while editing)</p>
              <p><kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">Ctrl+Shift+â†‘â†“â†â†’</kbd> Create linked note</p>
              <p className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-3"><kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">Right-click title</kbd> Set as HOME</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getNoteTitleById = (id) => {
    return allNotes.find(n => n.id === id)?.title || 'Untitled'
  }

  return (
    <div className="h-full flex flex-col">
      {/* Card Container */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Navigation Breadcrumb Panel */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-3 text-sm flex-wrap">
            {/* Up Link */}
            {note.up_id ? (
              <button
                onClick={() => onNavigate(note.up_id)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                title="Navigate up (↑)"
              >
                ↑ {getNoteTitleById(note.up_id)}
              </button>
            ) : (
              <span className="text-gray-400 dark:text-gray-600 text-xs">up ()</span>
            )}

            <span className="text-gray-300 dark:text-gray-700">|</span>

            {/* Left Link */}
            {note.left_id ? (
              <button
                onClick={() => onNavigate(note.left_id)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                title="Navigate left (← )"
              >
                ← {getNoteTitleById(note.left_id)}
              </button>
            ) : (
              <span className="text-gray-400 dark:text-gray-600 text-xs">left ()</span>
            )}

            {/* Current Note */}
            <span className="font-semibold text-gray-900 dark:text-gray-100 px-3 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
              {title || 'Untitled'}
            </span>

            {/* Right Link */}
            {note.right_id ? (
              <button
                onClick={() => onNavigate(note.right_id)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                title="Navigate right ( →)"
              >
                {getNoteTitleById(note.right_id)} →
              </button>
            ) : (
              <span className="text-gray-400 dark:text-gray-600 text-xs">right ()</span>
            )}

            <span className="text-gray-300 dark:text-gray-700">|</span>

            {/* Down Link */}
            {note.down_id ? (
              <button
                onClick={() => onNavigate(note.down_id)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                title="Navigate down (↓)"
              >
                ↓ {getNoteTitleById(note.down_id)}
              </button>
            ) : (
              <span className="text-gray-400 dark:text-gray-600 text-xs">down ()</span>
            )}
          </div>
        </div>

        {/* Title Section */}
        <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-750">
          <div className="relative flex items-start gap-3">
            {/* Home indicator */}
            {note.is_home && (
              <div className="mt-2">
                <Home size={20} className="text-gray-400 dark:text-gray-600" />
              </div>
            )}
            
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onContextMenu={handleTitleContextMenu}
              placeholder="Untitled"
              className="text-3xl font-semibold outline-none flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600"
            />
            
            {/* Star button */}
            <button
              onClick={() => onToggleStar(note.id)}
              className="mt-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={note.is_starred ? 'Unstar (hide from sidebar)' : 'Star (show in sidebar)'}
            >
              <Star
                size={20}
                className={note.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 dark:text-gray-600'}
              />
            </button>
          </div>
        </div>

        {/* Editor Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Editor
            ref={editorRef}
            initialContent={note.content}
            onContentChange={triggerAutoSave}
          />
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            top: `${contextMenuPosition.y}px`,
            left: `${contextMenuPosition.x}px`,
            zIndex: 1000,
          }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[180px]"
        >
          <button
            onClick={handleSetAsHome}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Home size={14} />
            {note.is_home ? 'Unset as HOME' : 'Set as HOME'}
          </button>
          
          {!note.is_home && (
            <button
              onClick={() => {
                handleDelete()
                setShowContextMenu(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Delete Note
            </button>
          )}
        </div>
      )}
    </div>
  )
}
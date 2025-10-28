import { useState, useEffect, useRef } from 'react'
import Editor from './Editor'
import TaskList from './TaskList'
import CollapsibleFilterBar from './CollapsibleFilterBar'
import { Home, Star } from 'lucide-react'
import { formatTodayLong } from '../utils/dateUtils'

export default function NoteEditor({
  note,
  allNotes,
  currentTasks,
  selectedTaskId,
  onTaskSelect,
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
  onCreateDraftLinked,
  onToggleTaskComplete,
  onToggleTaskStar,
  onChangeTaskStatus,
  onScheduleTask,
  onReorderTasks,
  onRefIdNavigate,
  onTaskDoubleClick,
  statusFilter,
  taskTypeFilter,
  onStatusFilterChange,
  onTaskTypeFilterChange
}) {
  const [title, setTitle] = useState('')
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [slideDirection, setSlideDirection] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [showDoneSection, setShowDoneSection] = useState(false)
  const [doneSectionWidth, setDoneSectionWidth] = useState(50) // Percentage width of done section
  const [isResizing, setIsResizing] = useState(false)
  const [showSavedBadge, setShowSavedBadge] = useState(false)
  const editorRef = useRef(null)
  const autoSaveTimerRef = useRef(null)
  const contextMenuRef = useRef(null)
  const previousNoteIdRef = useRef(null)
  const resizeContainerRef = useRef(null)
  const savedBadgeTimerRef = useRef(null)

  // Detect navigation direction and trigger animation
  useEffect(() => {
    if (note && previousNoteIdRef.current && previousNoteIdRef.current !== note.id) {
      const previousNote = allNotes.find(n => n.id === previousNoteIdRef.current)

      if (previousNote) {
        // Determine direction based on link relationships
        let direction = ''
        if (previousNote.up_id === note.id) direction = 'from-bottom'
        else if (previousNote.down_id === note.id) direction = 'from-top'
        else if (previousNote.left_id === note.id) direction = 'from-right'
        else if (previousNote.right_id === note.id) direction = 'from-left'
        else direction = 'fade' // Default for non-directional navigation

        setSlideDirection(direction)
        setIsAnimating(true)

        // Reset animation after it completes
        setTimeout(() => {
          setIsAnimating(false)
          setSlideDirection('')
        }, 300)
      }
    }

    if (note) {
      setTitle(note.title || '')
      previousNoteIdRef.current = note.id
    } else {
      setTitle('')
      previousNoteIdRef.current = null
    }
  }, [note, allNotes])

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

  // Handle resizing of done section
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !resizeContainerRef.current) return

      const container = resizeContainerRef.current
      const rect = container.getBoundingClientRect()
      const containerWidth = rect.width
      const mouseX = e.clientX - rect.left

      // Calculate percentage (clamp between 20% and 80%)
      let percentage = (mouseX / containerWidth) * 100
      percentage = Math.max(20, Math.min(80, percentage))

      // Done section is on the right, so we calculate from the right
      const doneSectionPercentage = 100 - percentage
      setDoneSectionWidth(doneSectionPercentage)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleResizeStart = () => {
    setIsResizing(true)
  }

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

    // Show "saved" badge after a brief delay (seamless feel)
    setTimeout(() => {
      setShowSavedBadge(true)

      // Clear any existing timer
      if (savedBadgeTimerRef.current) {
        clearTimeout(savedBadgeTimerRef.current)
      }

      // Hide badge after 25 seconds of inactivity
      savedBadgeTimerRef.current = setTimeout(() => {
        setShowSavedBadge(false)
      }, 25000)
    }, 2000) // Show badge 2 seconds after save
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
          // Don't navigate if on a task list with a selected task (let App.jsx handle it)
          if (note.note_type === 'task_list' && selectedTaskId) {
            return
          }
          e.preventDefault()
          onNavigate(note.left_id)
          return
        }
        if (e.key === 'ArrowRight' && canNavigate('right')) {
          // Don't navigate if on a task list with a selected task (let App.jsx handle it)
          if (note.note_type === 'task_list' && selectedTaskId) {
            return
          }
          e.preventDefault()
          onNavigate(note.right_id)
          return
        }
      }

      if (isCreateNew) {
        // Only handle arrow keys for creating new linked notes
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
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
        }
      } else if (isForceNavigate) {
        // Only handle arrow keys for force navigation
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
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
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      if (savedBadgeTimerRef.current) {
        clearTimeout(savedBadgeTimerRef.current)
      }
    }
  }, [note, onNavigate, onCreateDraftLinked, title, selectedTaskId])

  if (!note) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 max-w-lg">
          <div className="text-center">
            <p className="text-xl text-gray-400 dark:text-gray-600 mb-6">Select a note or create a new one</p>
            <div className="text-xs text-gray-500 dark:text-gray-500 space-y-2 bg-gray-50 dark:bg-gray-850 p-6 rounded">
              <p className="font-medium mb-3 text-gray-600 dark:text-gray-400">Keyboard Shortcuts:</p>
              <p><kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">Ctrl+S</kbd> Save note</p>
              <p><kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">Ctrl+Backspace</kbd> Delete note</p>
              <p><kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">↑↓←→</kbd> Navigate (when not editing)</p>
              <p><kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">Ctrl+↑↓←→</kbd> Force navigate (while editing)</p>
              <p><kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">Ctrl+Shift+↑↓←→</kbd> Create linked note</p>
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

  // Animation class based on direction
  const getAnimationClass = () => {
    if (!isAnimating || !slideDirection) return ''

    const animations = {
      'from-top': 'animate-slide-from-top',
      'from-bottom': 'animate-slide-from-bottom',
      'from-left': 'animate-slide-from-left',
      'from-right': 'animate-slide-from-right',
      'fade': 'animate-fade-in'
    }

    return animations[slideDirection] || ''
  }

  return (
    <div className="h-full flex flex-col">
      {/* Card Container */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${getAnimationClass()}`}>
        
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
                title="Navigate left (←)"
              >
                ← {getNoteTitleById(note.left_id)}
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
                title="Navigate right (→)"
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

            <div className="flex-1 flex items-baseline gap-3">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onContextMenu={handleTitleContextMenu}
                placeholder="Untitled"
                className="text-3xl font-semibold outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600"
                style={{ width: 'auto', minWidth: '100px' }}
              />

              {/* Date next to Today title */}
              {note.title === 'Today' && (
                <span className="text-lg text-gray-500 dark:text-gray-400 font-normal whitespace-nowrap" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {formatTodayLong()}
                </span>
              )}
            </div>

            {/* Saved badge - subtle and unobtrusive */}
            {showSavedBadge && (
              <div className="mt-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-medium text-gray-500 dark:text-gray-400 opacity-0 animate-saved-badge">
                Saved
              </div>
            )}

            {/* Star button */}
            <button
              onClick={() => onToggleStar(note.id)}
              className="mt-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
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
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {note.note_type === 'task_list' ? (
            <>
              {/* Collapsible Filter Bar - only show for Tasks, Today, and Week pages */}
              {note.title !== 'Someday/Maybe' && (
                <CollapsibleFilterBar
                  selectedTaskType={taskTypeFilter}
                  selectedStatuses={statusFilter}
                  onTaskTypeChange={onTaskTypeFilterChange}
                  onStatusChange={onStatusFilterChange}
                />
              )}

              {/* Task List Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {note.title === 'Today' ? (
                  // Today view: Optional split screen with Planned and Done
                  <>
                    {/* Toggle Done Section Button - Window Corner */}
                    <button
                      onClick={() => setShowDoneSection(!showDoneSection)}
                      className={`absolute bottom-6 right-6 z-10 px-3 py-1.5 text-xs font-mono transition-all ${
                        showDoneSection
                          ? 'bg-gray-100 dark:bg-gray-750 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          : 'bg-transparent text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      } rounded border border-gray-200 dark:border-gray-700`}
                      title={showDoneSection ? 'Hide Done section' : 'Show Done section'}
                    >
                      DONE ({(currentTasks || []).filter(t => t.status === 'DONE').length})
                    </button>

                    <div className={`h-full ${showDoneSection ? 'flex' : ''}`} ref={resizeContainerRef}>
                      {/* Planned Section */}
                      <div
                        className="flex flex-col h-full"
                        style={showDoneSection ? { width: `${100 - doneSectionWidth}%` } : {}}
                      >
                        {showDoneSection && (
                          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                            Planned
                          </h3>
                        )}
                        <div className="flex-1 overflow-y-auto">
                          <TaskList
                            tasks={(currentTasks || []).filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED')}
                            allNotes={allNotes}
                            viewType={note.title}
                            selectedTaskId={selectedTaskId}
                            onTaskSelect={onTaskSelect}
                            onToggleComplete={onToggleTaskComplete}
                            onToggleStar={onToggleTaskStar}
                            onStatusChange={onChangeTaskStatus}
                            onScheduleTask={onScheduleTask}
                            onReorder={onReorderTasks}
                            onTaskDoubleClick={onTaskDoubleClick}
                          />
                        </div>
                      </div>

                      {/* Resizable Divider */}
                      {showDoneSection && (
                        <div
                          className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-500 cursor-col-resize transition-colors mx-4 flex-shrink-0"
                          onMouseDown={handleResizeStart}
                          style={{ userSelect: 'none' }}
                          title="Drag to resize"
                        />
                      )}

                      {/* Done Section - only shown when toggle is active */}
                      {showDoneSection && (
                        <div
                          className="flex flex-col h-full"
                          style={{ width: `${doneSectionWidth}%` }}
                        >
                          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                            Done
                          </h3>
                          <div className="flex-1 overflow-y-auto">
                            <TaskList
                              tasks={(currentTasks || []).filter(t => t.status === 'DONE')}
                              allNotes={allNotes}
                              viewType={note.title}
                              selectedTaskId={selectedTaskId}
                              onTaskSelect={onTaskSelect}
                              onToggleComplete={onToggleTaskComplete}
                              onToggleStar={onToggleTaskStar}
                              onStatusChange={onChangeTaskStatus}
                              onScheduleTask={onScheduleTask}
                              onReorder={onReorderTasks}
                              onTaskDoubleClick={onTaskDoubleClick}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Other task views: Regular single list
                  <TaskList
                    tasks={currentTasks || []}
                    allNotes={allNotes}
                    viewType={note.title}
                    selectedTaskId={selectedTaskId}
                    onTaskSelect={onTaskSelect}
                    onToggleComplete={onToggleTaskComplete}
                    onToggleStar={onToggleTaskStar}
                    onStatusChange={onChangeTaskStatus}
                    onScheduleTask={onScheduleTask}
                    onReorder={onReorderTasks}
                    onTaskDoubleClick={onTaskDoubleClick}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 p-6 overflow-y-auto">
              <Editor
                ref={editorRef}
                initialContent={note.content}
                onContentChange={triggerAutoSave}
                onRefIdNavigate={onRefIdNavigate}
              />
            </div>
          )}
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
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-xl py-1 min-w-[180px]"
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
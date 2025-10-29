/**
 * TaskList Component
 *
 * Displays a plain text numbered list of tasks.
 *
 * Features:
 * - Numbered list format
 * - Checkbox to toggle task completion
 * - Project display in [PROJECT] format (muted)
 * - Clickable status with dropdown menu
 * - Color-coded status text
 * - Drag-and-drop to reorder tasks
 * - Double-click to open task detail panel
 *
 * @param {Array} tasks - Array of task objects to display
 * @param {Array} allNotes - All notes (for resolving project names)
 * @param {function} onToggleComplete - Callback when checkbox clicked (taskId)
 * @param {function} onToggleStar - Callback when star clicked (taskId)
 * @param {function} onReorder - Callback when drag-drop completes (fromIndex, toIndex)
 * @param {function} onStatusChange - Callback when status is changed (taskId, newStatus)
 * @param {function} onTaskDoubleClick - Callback when task is double-clicked (task)
 */

import { useState, useRef, useEffect } from 'react'
import { Check, Circle, ChevronDown, Star, Calendar, AlertCircle, FileText } from 'lucide-react'
import DatePicker from './DatePicker'
import { formatDateNatural } from '../utils/dateUtils'

export default function TaskList({
  tasks,
  allNotes,
  viewType,
  selectedTaskId,
  onTaskSelect,
  onToggleComplete,
  onToggleStar,
  onReorder,
  onStatusChange,
  onTaskDoubleClick,
  onScheduleTask
}) {
  // State for dropdowns and date pickers
  const [openDropdown, setOpenDropdown] = useState(null)
  const [openDatePicker, setOpenDatePicker] = useState(null)
  const dropdownRef = useRef(null)
  const datePickerRef = useRef(null)

  const statusOptions = [
    { value: 'BACKLOG', label: 'BACKLOG', icon: null },
    { value: 'PLANNED', label: 'PLANNED', icon: null },
    { value: 'DOING', label: 'DOING', icon: null },
    { value: 'BLOCKED', label: 'BLOCKED', icon: null },
    { value: 'DONE', label: 'DONE', icon: null },
    { value: 'CANCELLED', label: 'CANCELLED', icon: null }
  ]

  // Close dropdown and date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null)
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setOpenDatePicker(null)
      }
    }

    if (openDropdown || openDatePicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown, openDatePicker])

  // Handle keyboard shortcuts for reordering tasks
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle if a task is selected and Shift is pressed
      if (!selectedTaskId || !e.shiftKey) return

      // Find the index of the selected task
      const selectedIndex = tasks.findIndex(task => task.id === selectedTaskId)
      if (selectedIndex === -1) return

      // Handle Shift + ArrowUp - move task up
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (selectedIndex > 0) {
          onReorder(selectedIndex, selectedIndex - 1)
        }
      }

      // Handle Shift + ArrowDown - move task down
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (selectedIndex < tasks.length - 1) {
          onReorder(selectedIndex, selectedIndex + 1)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedTaskId, tasks, onReorder])

  /**
   * Get the title of a project note by its ID
   * @param {string} projectId - ID of the project note
   * @returns {string|null} - Project title or null if not found
   */
  const getProjectName = (projectId) => {
    if (!projectId) return null
    const project = allNotes.find(n => n.id === projectId)
    return project?.title || 'Unknown Project'
  }

  /**
   * Get color class for status text
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'DOING':
        return 'text-syntax-blue'
      case 'PLANNED':
        return 'text-syntax-purple'
      case 'BLOCKED':
        return 'text-syntax-yellow'
      case 'OVERDUE':
        return 'text-syntax-red font-semibold'
      case 'DONE':
        return 'text-syntax-green'
      case 'CANCELLED':
        return 'text-syntax-red'
      case 'BACKLOG':
      default:
        return 'text-fg-tertiary'
    }
  }

  /**
   * Check if task is scheduled for today
   */
  const isScheduledForToday = (task) => {
    if (!task.scheduled_date) return false
    const today = new Date()
    const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return task.scheduled_date === todayISO
  }

  const handleStatusClick = (taskId) => {
    setOpenDropdown(openDropdown === taskId ? null : taskId)
  }

  const handleStatusChange = (taskId, newStatus) => {
    onStatusChange?.(taskId, newStatus)
    setOpenDropdown(null)
  }

  /**
   * Handle drag start - save the dragged item's index
   */
  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  /**
   * Handle drag over - allow dropping
   */
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  /**
   * Handle drop - reorder tasks if indices differ
   */
  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (dragIndex !== dropIndex) {
      onReorder(dragIndex, dropIndex)
    }
  }

  // Empty state: show helpful message when no tasks
  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-8 text-center text-fg-tertiary">
        <Circle size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">No tasks yet</p>
        <p className="text-xs mt-2">Use terminal to add tasks</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 text-sm">
      {tasks.map((task, index) => {
        const isSelected = selectedTaskId === task.id

        // Debug logging for first 3 tasks
        if (index < 3) {
          console.log(`📋 Task ${index}:`, {
            taskId: task.id,
            selectedTaskId,
            isSelected,
            taskText: task.text.substring(0, 30)
          })
        }

        const handleTaskClick = () => {
          console.log('🖱️  Task clicked:', { taskId: task.id, isSelected })

          if (isSelected) {
            // Already selected - open panel
            console.log('  → Already selected, opening panel')
            onTaskDoubleClick?.(task)
          } else {
            // Not selected - highlight/select it
            console.log('  → Not selected, highlighting task')
            onTaskSelect?.(task.id)
          }
        }

        // Debug: Log computed styles for selected task
        if (isSelected) {
          console.log('🎨 Selected task styles:', {
            taskId: task.id,
            taskText: task.text.substring(0, 30),
            isSelected,
            expectedBg: 'bg-accent-primary/20',
            expectedBorder: 'border-accent-primary/50',
            accentPrimaryColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary')
          })
        }

        return (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onClick={handleTaskClick}
            className={`group flex items-center gap-3 py-1 px-2 rounded cursor-pointer transition-all border hover:bg-accent-hover ${
              isSelected
                ? 'bg-accent-hover border-accent-primary'
                : 'border-transparent'
            }`}
            title={isSelected ? "Click to open details" : "Click to select"}
          >
          {/* Number */}
          <span className="text-fg-tertiary select-none w-8 flex-shrink-0">
            {index + 1}.
          </span>

          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleComplete(task.id)
            }}
            className="flex-shrink-0"
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
              task.status === 'DONE'
                ? 'bg-syntax-green border-syntax-green'
                : 'border-border-primary hover:border-syntax-green'
            }`}>
              {task.status === 'DONE' && <Check size={10} className="text-fg-inverse" strokeWidth={3} />}
            </div>
          </button>

          {/* Task text, project, and status */}
          <div className="flex-1 min-w-0 flex items-baseline gap-2">
            {/* Task text */}
            <span className={`${
              task.status === 'DONE'
                ? 'line-through text-fg-tertiary'
                : 'text-fg-primary'
            }`}>
              {task.text}
            </span>

            {/* Notes indicator */}
            {task.context && task.context.trim() && (
              <FileText
                size={12}
                className="text-fg-tertiary flex-shrink-0"
                title="Has notes"
              />
            )}

            {/* Project - hide when already viewing a project page */}
            {task.project_id && viewType !== 'project' && (
              <span className="text-fg-tertiary text-xs">
                [{getProjectName(task.project_id)}]
              </span>
            )}

            {/* Spacer to push badges to the right */}
            <span className="flex-1" />

            {/* Task Type */}
            {task.task_type && (
              <span className="text-fg-secondary text-xs font-medium flex-shrink-0">
                [{task.task_type.replace(/_/g, ' ')}]
              </span>
            )}

            {/* Badge container - slides status left on hover after delay */}
            <div className="flex items-baseline gap-2 task-badges-container">
              {/* Scheduled date display - always visible */}
              {task.scheduled_date && (
                <div className="relative flex-shrink-0" ref={openDatePicker === task.id ? datePickerRef : null}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenDatePicker(openDatePicker === task.id ? null : task.id)
                    }}
                    className="flex items-center gap-1 text-xs text-syntax-purple hover:opacity-70 transition-opacity"
                    title="Scheduled date"
                  >
                    <Calendar size={12} />
                    {formatDateNatural(task.scheduled_date)}
                  </button>

                  {/* Date picker */}
                  {openDatePicker === task.id && (
                    <DatePicker
                      value={task.scheduled_date}
                      onChange={(date) => {
                        onScheduleTask?.(task.id, date)
                        setOpenDatePicker(null)
                      }}
                      onClose={() => setOpenDatePicker(null)}
                    />
                  )}
                </div>
              )}

              {/* Calendar icon for scheduling (shown when no date) - always hidden on hover on all pages */}
              {!task.scheduled_date && (
                <div className="relative flex-shrink-0" ref={openDatePicker === task.id ? datePickerRef : null}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenDatePicker(openDatePicker === task.id ? null : task.id)
                    }}
                    className="text-fg-tertiary hover:text-syntax-purple transition-all duration-200 opacity-0 group-hover:opacity-100"
                    title="Schedule task"
                  >
                    <Calendar size={14} />
                  </button>

                  {/* Date picker */}
                  {openDatePicker === task.id && (
                    <DatePicker
                      value={task.scheduled_date}
                      onChange={(date) => {
                        onScheduleTask?.(task.id, date)
                        setOpenDatePicker(null)
                      }}
                      onClose={() => setOpenDatePicker(null)}
                    />
                  )}
                </div>
              )}

              {/* Star button - hidden initially, shown on hover after delay */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleStar(task.id)
                }}
                className="flex-shrink-0"
                title={(task.starred || isScheduledForToday(task)) ? "Remove from Today" : "Add to Today"}
              >
                <Star
                  size={14}
                  className={(task.starred || isScheduledForToday(task)) ? "fill-syntax-yellow text-syntax-yellow" : "text-fg-tertiary"}
                />
              </button>

              {/* Status - clickable, animated position */}
              <div className={`relative flex-shrink-0 transition-all duration-300 status-badge ${
                viewType === 'Today' ? 'today-status' : ''
              }`} ref={openDropdown === task.id ? dropdownRef : null}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusClick(task.id)
                  }}
                  className={`flex items-center gap-1 hover:opacity-70 transition-opacity font-mono ${getStatusColor(task.status)}`}
                >
                  {task.status === 'OVERDUE' && <AlertCircle size={12} className="opacity-70" />}
                  [{task.status}]
                  <ChevronDown size={12} className="opacity-50" />
                </button>

                {/* Dropdown menu */}
                {openDropdown === task.id && (
                  <div className="absolute right-0 top-full mt-1 bg-bg-elevated border border-border-secondary rounded shadow-lg py-1 z-50 min-w-[120px]">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(task.id, option.value)}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-bg-tertiary transition-colors flex items-center gap-1.5 font-mono ${getStatusColor(option.value)}`}
                      >
                        {option.icon && <option.icon size={12} className="opacity-60" />}
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    })}
    </div>
  )
}

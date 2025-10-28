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
import { Check, Circle, ChevronDown, Star, Calendar, AlertCircle } from 'lucide-react'
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
        return 'text-blue-600 dark:text-blue-400'
      case 'PLANNED':
        return 'text-purple-600 dark:text-purple-400'
      case 'BLOCKED':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'OVERDUE':
        return 'text-red-600 dark:text-red-400 font-semibold'
      case 'DONE':
        return 'text-green-600 dark:text-green-400'
      case 'CANCELLED':
        return 'text-red-600 dark:text-red-400'
      case 'BACKLOG':
      default:
        return 'text-gray-500 dark:text-gray-500'
    }
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
      <div className="p-8 text-center text-gray-400 dark:text-gray-600">
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

        return (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onClick={handleTaskClick}
            className={`group flex items-start gap-3 py-1.5 px-2 rounded cursor-pointer transition-all border hover:bg-blue-100 dark:hover:bg-blue-900/30 ${
              isSelected
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'border-transparent'
            }`}
            title={isSelected ? "Click to open details" : "Click to select"}
          >
          {/* Number */}
          <span className="text-gray-400 dark:text-gray-600 select-none w-8 flex-shrink-0">
            {index + 1}.
          </span>

          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleComplete(task.id)
            }}
            className="mt-0.5 flex-shrink-0"
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
              task.status === 'DONE'
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
            }`}>
              {task.status === 'DONE' && <Check size={10} className="text-white" strokeWidth={3} />}
            </div>
          </button>

          {/* Task text, project, and status */}
          <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
            {/* Task text */}
            <span className={`${
              task.status === 'DONE'
                ? 'line-through text-gray-400 dark:text-gray-600'
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {task.text}
            </span>

            {/* Task Type */}
            {task.task_type && (
              <span className="text-gray-500 dark:text-gray-500 text-xs font-medium">
                [{task.task_type.replace(/_/g, ' ')}]
              </span>
            )}

            {/* Project */}
            {task.project_id && (
              <span className="text-gray-400 dark:text-gray-600 text-xs">
                [{getProjectName(task.project_id)}]
              </span>
            )}

            {/* Spacer to push status to the right */}
            <span className="flex-1" />

            {/* Status - clickable, hidden on Today unless hovering (always show if DOING) */}
            <div className={`relative flex-shrink-0 transition-opacity ${
              viewType === 'Today' && task.status !== 'DOING' ? 'opacity-0 group-hover:opacity-100' : ''
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
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg py-1 z-50 min-w-[120px]">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(task.id, option.value)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 font-mono ${getStatusColor(option.value)}`}
                    >
                      {option.icon && <option.icon size={12} className="opacity-60" />}
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduled date display - hidden on Today unless hovering (always show if DOING) */}
            {task.scheduled_date && (
              <div className={`relative flex-shrink-0 transition-opacity ${
                viewType === 'Today' && task.status !== 'DOING' ? 'opacity-0 group-hover:opacity-100' : ''
              }`} ref={openDatePicker === task.id ? datePickerRef : null}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenDatePicker(openDatePicker === task.id ? null : task.id)
                  }}
                  className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:opacity-70 transition-opacity"
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
                  className="text-gray-400 dark:text-gray-600 hover:text-purple-600 dark:hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100"
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

            {/* Star button - on Today page, only show on hover (always show if DOING) */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleStar(task.id)
              }}
              className={`flex-shrink-0 transition-opacity ${
                viewType === 'Today' && task.status !== 'DOING'
                  ? "opacity-0 group-hover:opacity-100"
                  : (viewType === 'Today' && task.status === 'DOING'
                      ? "opacity-100"
                      : (task.starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"))
              }`}
              title={task.starred ? "Remove from Today" : "Add to Today"}
            >
              <Star
                size={14}
                className={task.starred ? "fill-yellow-500 text-yellow-500" : "text-gray-400 dark:text-gray-600"}
              />
            </button>
          </div>
        </div>
      )
    })}
    </div>
  )
}

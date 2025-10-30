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
import { Check, Circle, ChevronDown, Star, Calendar, AlertCircle, FileText, Brain, Zap, Wrench, Users, Compass, Inbox, Flag } from 'lucide-react'
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
  onScheduleTask,
  onTypeChange,
  onMoveToInbox,
  onEffortChange,
  onToggleHighlight
}) {
  // State for dropdowns and date pickers
  const [openDropdown, setOpenDropdown] = useState(null)
  const [openTypeDropdown, setOpenTypeDropdown] = useState(null)
  const [openDatePicker, setOpenDatePicker] = useState(null)
  const [hoveredTaskId, setHoveredTaskId] = useState(null)
  const dropdownRef = useRef(null)
  const typeDropdownRef = useRef(null)
  const datePickerRef = useRef(null)

  const statusOptions = [
    { value: 'BACKLOG', label: 'BACKLOG', icon: null },
    { value: 'PLANNED', label: 'PLANNED', icon: null },
    { value: 'DOING', label: 'DOING', icon: null },
    { value: 'BLOCKED', label: 'BLOCKED', icon: null },
    { value: 'DONE', label: 'DONE', icon: null },
    { value: 'CANCELLED', label: 'CANCELLED', icon: null }
  ]

  const typeOptions = [
    { value: 'deep_work', label: 'Deep Work', icon: Brain },
    { value: 'quick_wins', label: 'Quick Wins', icon: Zap },
    { value: 'grunt_work', label: 'Grunt Work', icon: Wrench },
    { value: 'people_time', label: 'People Time', icon: Users },
    { value: 'planning', label: 'Planning', icon: Compass }
  ]

  // Close dropdown and date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null)
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setOpenTypeDropdown(null)
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setOpenDatePicker(null)
      }
    }

    if (openDropdown || openTypeDropdown || openDatePicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown, openTypeDropdown, openDatePicker])

  // Handle keyboard shortcuts for navigation and reordering tasks
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // Only handle arrow keys
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return

      // If no task selected and there are tasks, select the first one
      if (!selectedTaskId && tasks.length > 0) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          const firstTask = tasks[0]
          onTaskSelect?.(firstTask.id)
          setTimeout(() => {
            const element = document.querySelector(`[data-task-id="${firstTask.id}"]`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }, 0)
          return
        }
      }

      if (!selectedTaskId) return

      // Find the index of the selected task
      const selectedIndex = tasks.findIndex(task => task.id === selectedTaskId)
      if (selectedIndex === -1) return

      // Handle Shift + Arrow keys for reordering
      if (e.shiftKey) {
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
      } else {
        // Handle Arrow keys for navigation (without Shift)
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          if (selectedIndex > 0) {
            const prevTask = tasks[selectedIndex - 1]
            onTaskSelect?.(prevTask.id)
            // Scroll into view
            setTimeout(() => {
              const element = document.querySelector(`[data-task-id="${prevTask.id}"]`)
              element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }, 0)
          }
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault()
          if (selectedIndex < tasks.length - 1) {
            const nextTask = tasks[selectedIndex + 1]
            onTaskSelect?.(nextTask.id)
            // Scroll into view
            setTimeout(() => {
              const element = document.querySelector(`[data-task-id="${nextTask.id}"]`)
              element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }, 0)
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedTaskId, tasks, onReorder, onTaskSelect])

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

  /**
   * Check if task is minimal (only has title, no other data)
   */
  const isMinimalTask = (task) => {
    return (
      !task.project_id &&
      !task.scheduled_date &&
      (!task.context || task.context.trim() === '') &&
      !task.task_type &&
      !task.is_starred &&
      task.status === 'BACKLOG'
    )
  }

  const handleStatusClick = (taskId) => {
    // Close other dropdowns first
    setOpenTypeDropdown(null)
    setOpenDatePicker(null)
    // Then toggle this one
    setOpenDropdown(openDropdown === taskId ? null : taskId)
  }

  const handleStatusChange = (taskId, newStatus) => {
    onStatusChange?.(taskId, newStatus)
    setOpenDropdown(null)
  }

  const handleTypeClick = (taskId) => {
    // Close other dropdowns first
    setOpenDropdown(null)
    setOpenDatePicker(null)
    // Then toggle this one
    setOpenTypeDropdown(openTypeDropdown === taskId ? null : taskId)
  }

  const handleTypeChange = (taskId, newType) => {
    onTypeChange?.(taskId, newType)
    setOpenTypeDropdown(null)
  }

  const handleEffortChange = (taskId, newEffort) => {
    onEffortChange?.(taskId, newEffort)
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

  // Check if we're in Hacker mode
  const isHackerMode = document.documentElement.classList.contains('ui-hacker')

  /**
   * Render table for Hacker mode using CSS borders
   */
  const renderHackerTable = () => {
    const isDoneView = viewType === 'Done'
    const isScheduledView = viewType === 'Scheduled'

    return (
      <table
        className="hacker-table w-full"
        style={{
          fontFamily: 'Monaco, Menlo, Consolas, monospace',
          fontSize: '13px'
        }}
      >
        <thead>
          <tr>
            <th style={{ width: '5%' }}>☐</th>
            {!isDoneView && <th style={{ width: '5%' }}>#</th>}
            <th style={{ width: isDoneView ? '55%' : (isScheduledView ? '40%' : '45%') }}>TASK</th>
            <th style={{ width: '10%' }}>STATUS</th>
            {!isDoneView && <th style={{ width: isScheduledView ? '15%' : '10%' }}>DUE</th>}
            <th style={{ width: '10%' }}>TTV</th>
            <th style={{ width: '15%' }}>TYPE</th>
            {isDoneView && <th style={{ width: '5%' }}>⚑</th>}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => {
            const isSelected = selectedTaskId === task.id
            const projectName = task.project_id ? getProjectName(task.project_id) : null
            const dueDate = task.scheduled_date ? formatDateNatural(task.scheduled_date) : '-'
            const taskType = task.task_type ? task.task_type.replace(/_/g, ' ').toUpperCase() : '-'

            const handleTaskClick = () => {
              if (isSelected) {
                onTaskDoubleClick?.(task)
              } else {
                onTaskSelect?.(task.id)
              }
            }

            return (
              <tr
                key={task.id}
                data-task-id={task.id}
                data-selected={isSelected ? 'true' : 'false'}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onClick={handleTaskClick}
                className={`group cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-accent-primary/10'
                    : 'hover:bg-accent-primary/5'
                }`}
              >
                {/* Checkbox */}
                <td className="text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleComplete(task.id)
                    }}
                    className={`${
                      task.status === 'DONE'
                        ? 'text-syntax-green'
                        : 'text-fg-secondary hover:text-syntax-green'
                    }`}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    title={task.status === 'DONE' ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.status === 'DONE' ? '✓' : '☐'}
                  </button>
                </td>

                {/* Priority Number */}
                {!isDoneView && (
                  <td className="text-fg-tertiary" title={`Priority: ${task.priority}`}>
                    {task.priority}
                  </td>
                )}

                {/* Task */}
                <td
                  className={`${
                    task.status === 'DONE' && !isDoneView
                      ? 'line-through text-fg-tertiary'
                      : 'text-fg-primary'
                  }`}
                  title={task.text + (projectName ? ` [${projectName}]` : '')}
                >
                  <span>{task.text}</span>
                  {isMinimalTask(task) && (
                    <span className="text-fg-tertiary ml-2" style={{ fontSize: '0.85em' }}>
                      [null]
                    </span>
                  )}
                  {projectName && (
                    <span className="text-fg-tertiary ml-2" style={{ fontSize: '0.9em' }}>
                      [{projectName}]
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="relative" style={{ overflow: 'visible', position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusClick(task.id)
                    }}
                    className={`hover:opacity-70 ${getStatusColor(task.status)}`}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}
                    title="Click to change status"
                  >
                    {task.status}
                  </button>
                  {openDropdown === task.id && (
                    <div className="absolute left-0 top-full mt-1 bg-bg-elevated border border-border-secondary shadow-lg py-1 z-50 min-w-[120px]">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(task.id, option.value)
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-bg-tertiary transition-colors flex items-center gap-1.5 font-mono ${getStatusColor(option.value)}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </td>

                {/* Due */}
                {!isDoneView && (
                  <td className="relative" style={{ overflow: 'visible', position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenDatePicker(openDatePicker === task.id ? null : task.id)
                      }}
                      className="text-syntax-purple hover:opacity-70"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}
                      title="Click to change due date"
                    >
                      {dueDate}
                    </button>
                    {openDatePicker === task.id && (
                      <div ref={datePickerRef} style={{ position: 'relative' }}>
                        <DatePicker
                          value={task.scheduled_date}
                          onChange={(date) => {
                            onScheduleTask?.(task.id, date)
                            setOpenDatePicker(null)
                          }}
                          onClose={() => setOpenDatePicker(null)}
                        />
                      </div>
                    )}
                  </td>
                )}

                {/* Time to Value */}
                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((level) => {
                      const isHighlighted = (task.effort || 0) >= level
                      return (
                        <div
                          key={level}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEffortChange(task.id, level)
                          }}
                          className={`w-4 h-4 rounded border transition-all cursor-pointer ${
                            isHighlighted
                              ? 'bg-syntax-orange border-syntax-orange opacity-100'
                              : 'bg-transparent border-fg-tertiary hover:border-syntax-orange hover:bg-syntax-orange/20'
                          }`}
                          title={`Time to Value: ${level}/5`}
                        />
                      )
                    })}
                  </div>
                </td>

                {/* Type */}
                <td className="relative" style={{ overflow: 'visible', position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTypeClick(task.id)
                    }}
                    className="text-fg-secondary hover:opacity-70"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}
                    title="Click to change type"
                  >
                    {taskType}
                  </button>
                  {openTypeDropdown === task.id && (
                    <div className="absolute left-0 top-full mt-1 bg-bg-elevated border border-border-secondary shadow-lg py-1 z-50 min-w-[140px]">
                      {typeOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <button
                            key={option.value || 'null'}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTypeChange(task.id, option.value)
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-bg-tertiary transition-colors font-mono text-fg-secondary flex items-center gap-2"
                          >
                            {Icon && <Icon size={14} />}
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </td>

                {/* Flag */}
                {isDoneView && (
                  <td className="text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleHighlight?.(task.id, !task.is_highlighted)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        outline: 'none',
                        color: task.is_highlighted ? '#ef4444' : '#6b7280'
                      }}
                      onMouseEnter={(e) => {
                        if (!task.is_highlighted) {
                          e.currentTarget.style.color = '#ef4444'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!task.is_highlighted) {
                          e.currentTarget.style.color = '#6b7280'
                        }
                      }}
                      title={task.is_highlighted ? 'Remove highlight' : 'Highlight'}
                    >
                      <Flag size={14} fill={task.is_highlighted ? 'currentColor' : 'none'} strokeWidth={task.is_highlighted ? 2.5 : 2} />
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
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

  // Render Hacker mode table if enabled
  if (isHackerMode) {
    return renderHackerTable()
  }

  return (
    <div className="space-y-1.5">
      {tasks.map((task, index) => {
        const isSelected = selectedTaskId === task.id

        const handleTaskClick = () => {
          if (isSelected) {
            // Already selected - open panel
            onTaskDoubleClick?.(task)
          } else {
            // Not selected - highlight/select it
            onTaskSelect?.(task.id)
          }
        }

        return (
          <div
            key={task.id}
            data-task-id={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onClick={handleTaskClick}
            onMouseEnter={() => setHoveredTaskId(task.id)}
            onMouseLeave={() => setHoveredTaskId(null)}
            className={`group flex items-center gap-3 py-2.5 px-3 pr-14 rounded-lg cursor-pointer transition-all relative ${
              isSelected
                ? 'bg-bg-secondary border border-accent-primary/30 shadow-sm'
                : 'hover:bg-bg-secondary/50 border border-transparent'
            }`}
            title={isSelected ? "Click to open details" : "Click to select"}
          >
          {/* Number */}
          <span className="text-fg-tertiary select-none text-xs w-6 flex-shrink-0 font-mono">
            {index + 1}
          </span>

          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleComplete(task.id)
            }}
            className="flex-shrink-0"
          >
            <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${
              task.status === 'DONE'
                ? 'bg-semantic-success border-semantic-success'
                : 'border-border-secondary hover:border-semantic-success hover:bg-semantic-success/5'
            }`}>
              {task.status === 'DONE' && <Check size={11} className="text-white" strokeWidth={3} />}
            </div>
          </button>

          {/* Task text and metadata */}
          <div className="flex-1 min-w-0 flex items-center gap-2.5">
            {/* Task text */}
            <span className={`text-sm font-medium ${
              task.status === 'DONE'
                ? 'line-through text-fg-tertiary'
                : 'text-fg-primary'
            }`}>
              {task.text}
            </span>

            {/* Null indicator for minimal tasks */}
            {isMinimalTask(task) && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-mono text-fg-tertiary bg-bg-tertiary border border-border-primary flex-shrink-0"
                title="Minimal task - only has title, no other data"
              >
                null
              </span>
            )}

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
              <span className="text-fg-tertiary text-xs flex-shrink-0">
                [{getProjectName(task.project_id)}]
              </span>
            )}
          </div>

          {/* Right section: Task Type + Badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Task Type */}
            <div className="relative" ref={openTypeDropdown === task.id ? typeDropdownRef : null}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleTypeClick(task.id)
                }}
                className="text-fg-secondary text-xs font-medium hover:opacity-70 transition-opacity"
                title="Click to change type"
              >
                [{task.task_type ? task.task_type.replace(/_/g, ' ') : '-'}]
              </button>

              {/* Type dropdown */}
              {openTypeDropdown === task.id && (
                <div className="absolute right-0 top-full mt-1 bg-bg-elevated border border-border-secondary rounded shadow-lg py-1 z-50 min-w-[120px]">
                  {typeOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.value || 'null'}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTypeChange(task.id, option.value)
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-bg-tertiary transition-colors text-fg-secondary flex items-center gap-2"
                      >
                        {Icon && <Icon size={14} />}
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Badge container */}
            <div className="flex items-center gap-2">
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

              {/* Move to Inbox button - only show if task has a project and not already in Inbox view */}
              {task.project_id && viewType !== 'Inbox' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onMoveToInbox?.(task.id)
                  }}
                  className="flex-shrink-0 text-fg-tertiary hover:text-accent-primary transition-all duration-200 opacity-0 group-hover:opacity-100"
                  title="Move to Inbox"
                >
                  <Inbox size={14} />
                </button>
              )}

              {/* Status - clickable */}
              <div className="relative" ref={openDropdown === task.id ? dropdownRef : null}>
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

          {/* Flag button - positioned absolutely on far right */}
          <div className={`absolute right-2 top-1/2 -translate-y-1/2 transition-opacity ${
            task.is_highlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleHighlight?.(task.id, !task.is_highlighted)
              }}
              className={`p-1 rounded transition-colors ${
                task.is_highlighted
                  ? 'text-semantic-error bg-semantic-error/10'
                  : 'text-fg-tertiary hover:text-semantic-error hover:bg-semantic-error/10'
              }`}
              title={task.is_highlighted ? 'Remove highlight' : 'Highlight'}
            >
              <Flag size={14} fill={task.is_highlighted ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      )
    })}
    </div>
  )
}

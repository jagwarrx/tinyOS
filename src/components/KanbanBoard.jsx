/**
 * KanbanBoard Component
 *
 * Displays tasks in a Kanban board layout with columns for different task statuses.
 * Supports drag-and-drop to move tasks between columns.
 *
 * Features:
 * - Dynamic columns: Backlog, Planned, Waiting (conditional), Doing, Done, Cancelled (conditional)
 * - Waiting and Cancelled columns only appear when they contain tasks
 * - Drag-and-drop task cards between columns
 * - Updates task status when moved
 * - Color-coded columns
 * - Scrollable columns for many tasks
 *
 * @param {Array} tasks - Array of tasks to display
 * @param {Array} allNotes - All notes (for project references)
 * @param {string} selectedTaskId - ID of selected task
 * @param {function} onTaskSelect - Callback when task is selected
 * @param {function} onToggleComplete - Callback to toggle task completion
 * @param {function} onToggleStar - Callback to toggle task star
 * @param {function} onStatusChange - Callback when task status changes
 * @param {function} onScheduleTask - Callback to schedule task
 * @param {function} onTaskDoubleClick - Callback for task double-click
 */

import { useState } from 'react'
import { formatDateNatural } from '../utils/dateUtils'

export default function KanbanBoard({
  tasks,
  allNotes,
  selectedTaskId,
  onTaskSelect,
  onToggleComplete,
  onToggleStar,
  onStatusChange,
  onScheduleTask,
  onTaskDoubleClick
}) {
  const [draggedTask, setDraggedTask] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)

  // Define all possible columns with their properties
  const allColumns = [
    {
      id: 'BACKLOG',
      title: 'Backlog',
      status: 'BACKLOG',
      color: 'bg-bg-secondary',
      borderColor: 'border-border-primary',
      headerColor: 'text-fg-secondary',
      taskTypeFilter: null,
      alwaysShow: true
    },
    {
      id: 'PLANNED',
      title: 'Planned',
      status: 'PLANNED',
      color: 'bg-syntax-blue/5',
      borderColor: 'border-syntax-blue/20',
      headerColor: 'text-syntax-blue',
      taskTypeFilter: null,
      alwaysShow: true
    },
    {
      id: 'WAITING',
      title: 'Waiting',
      status: null, // Waiting is a task_type, not status
      color: 'bg-syntax-yellow/5',
      borderColor: 'border-syntax-yellow/20',
      headerColor: 'text-syntax-yellow',
      taskTypeFilter: 'waiting',
      alwaysShow: false // Only show if has tasks
    },
    {
      id: 'DOING',
      title: 'Doing',
      status: 'DOING',
      color: 'bg-syntax-purple/5',
      borderColor: 'border-syntax-purple/20',
      headerColor: 'text-syntax-purple',
      taskTypeFilter: null,
      alwaysShow: true
    },
    {
      id: 'DONE',
      title: 'Done',
      status: 'DONE',
      color: 'bg-syntax-green/5',
      borderColor: 'border-syntax-green/20',
      headerColor: 'text-syntax-green',
      taskTypeFilter: null,
      alwaysShow: true
    },
    {
      id: 'CANCELLED',
      title: 'Cancelled',
      status: 'CANCELLED',
      color: 'bg-syntax-red/5',
      borderColor: 'border-syntax-red/20',
      headerColor: 'text-syntax-red',
      taskTypeFilter: null,
      alwaysShow: false // Only show if has tasks
    }
  ]

  /**
   * Filter tasks for a specific column
   */
  const getTasksForColumn = (column) => {
    if (!tasks) return []

    if (column.id === 'WAITING') {
      // Waiting column shows tasks with task_type='waiting'
      return tasks.filter(task => task.task_type === 'waiting')
    } else {
      // Other columns filter by status
      return tasks.filter(task => task.status === column.status)
    }
  }

  /**
   * Handle drag start
   */
  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target)
  }

  /**
   * Handle drag over column
   */
  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  /**
   * Handle drag leave column
   */
  const handleDragLeave = (e, columnId) => {
    // Only clear if leaving the column container itself
    if (e.target.classList.contains('kanban-column')) {
      setDragOverColumn(null)
    }
  }

  /**
   * Handle drop on column
   */
  const handleDrop = (e, column) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedTask) return

    // Determine what change to make based on column
    if (column.id === 'WAITING') {
      // Moving to Waiting column - set task_type to 'waiting'
      // We'll need to add a new callback for this
      // For now, just change status to BLOCKED (commonly used for waiting)
      if (draggedTask.status !== 'BLOCKED') {
        onStatusChange(draggedTask.id, 'BLOCKED')
      }
    } else if (column.status) {
      // Moving to status column - update status
      if (draggedTask.status !== column.status) {
        onStatusChange(draggedTask.id, column.status)
      }
    }

    setDraggedTask(null)
  }

  /**
   * Handle drag end
   */
  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  /**
   * Get badge color based on scheduled date
   */
  const getScheduledDateColor = (scheduledDate) => {
    if (!scheduledDate) return null

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

    if (scheduledDate < today) {
      // Overdue - dark red
      return {
        bg: 'var(--color-semantic-error, #dc2626)',
        text: 'white'
      }
    } else if (scheduledDate === today) {
      // Today - red/orange
      return {
        bg: 'var(--color-label-red, #eb5a46)',
        text: 'white'
      }
    } else if (scheduledDate === tomorrow) {
      // Tomorrow - yellow
      return {
        bg: 'var(--color-label-yellow, #f2d600)',
        text: 'black'
      }
    } else if (scheduledDate <= nextWeek) {
      // This week - blue
      return {
        bg: 'var(--color-label-blue, #0079bf)',
        text: 'white'
      }
    } else {
      // Future - green
      return {
        bg: 'var(--color-label-green, #61bd4f)',
        text: 'white'
      }
    }
  }

  /**
   * Render a task card
   */
  const renderTaskCard = (task) => {
    const isSelected = selectedTaskId === task.id
    const isDragging = draggedTask?.id === task.id
    const dateColor = getScheduledDateColor(task.scheduled_date)

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
        onClick={() => onTaskSelect(task.id)}
        onDoubleClick={() => onTaskDoubleClick?.(task)}
        style={{
          backgroundColor: 'var(--color-card-bg, white)',
          color: 'var(--color-card-text, #172b4d)'
        }}
        className={`
          group px-2.5 py-4 mb-2 rounded cursor-pointer transition-all
          ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'}
          ${isSelected
            ? 'shadow-lg ring-2 ring-accent-primary'
            : 'shadow-sm hover:shadow-md'
          }
        `}
      >
        {/* Task text */}
        <div className="text-sm font-medium mb-2 break-words leading-snug" style={{ color: 'var(--color-card-text, #172b4d)' }}>
          {task.text}
        </div>

        {/* Scheduled date badge - hide for DONE tasks */}
        {task.scheduled_date && dateColor && task.status !== 'DONE' && (
          <div className="flex items-center">
            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{
              backgroundColor: dateColor.bg,
              color: dateColor.text
            }}>
              {formatDateNatural(task.scheduled_date)}
            </span>
          </div>
        )}

        {/* Completed date badge - only for DONE tasks */}
        {task.status === 'DONE' && task.updated_at && (() => {
          // Get local date from UTC timestamp
          const completedDate = new Date(task.updated_at)
          const year = completedDate.getFullYear()
          const month = String(completedDate.getMonth() + 1).padStart(2, '0')
          const day = String(completedDate.getDate()).padStart(2, '0')
          const dateString = `${year}-${month}-${day}`

          return (
            <div className="flex items-center">
              <span className="px-2 py-0.5 rounded text-xs font-medium" style={{
                backgroundColor: 'var(--color-label-green, #61bd4f)',
                color: 'white'
              }}>
                ✓ {formatDateNatural(dateString)}
              </span>
            </div>
          )
        })()}
      </div>
    )
  }

  // Filter columns to show only those with tasks (or alwaysShow = true)
  const visibleColumns = allColumns.filter(column => {
    if (column.alwaysShow) return true
    const columnTasks = getTasksForColumn(column)
    return columnTasks.length > 0
  })

  return (
    <div className="h-full flex gap-6 p-6 overflow-x-auto" style={{ background: 'var(--color-bg-primary)' }}>
      {visibleColumns.map((column) => {
        const columnTasks = getTasksForColumn(column)
        const isDragOver = dragOverColumn === column.id

        return (
          <div
            key={column.id}
            style={{ backgroundColor: 'var(--color-list-bg, var(--color-bg-secondary))' }}
            className="flex-shrink-0 w-96 flex flex-col rounded-xl p-5 backdrop-blur-sm"
          >
            {/* Column header */}
            <div className="mb-4 px-2 flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: 'var(--color-card-text, var(--color-fg-primary))' }}>
                {column.title}
              </h3>
              <span className="text-sm font-bold px-2.5 py-1 rounded-full min-w-[28px] text-center" style={{
                backgroundColor: '#172b4d',
                color: '#ffffff'
              }}>
                {columnTasks.length}
              </span>
            </div>

            {/* Column content - drop zone */}
            <div
              className={`
                kanban-column flex-1 rounded-lg p-2 overflow-y-auto transition-all
                ${isDragOver ? 'bg-accent-primary/10 ring-2 ring-accent-primary ring-inset' : ''}
              `}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column)}
              style={{ minHeight: '200px' }}
            >
              {columnTasks.length > 0 ? (
                columnTasks.map(task => renderTaskCard(task))
              ) : (
                <div className="flex items-center justify-center h-full text-sm py-8" style={{ color: 'var(--color-card-text-secondary, #5e6c84)' }}>
                  {isDragOver ? (
                    <span className="text-accent-primary font-medium">Drop task here</span>
                  ) : (
                    <span className="opacity-50">No tasks</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

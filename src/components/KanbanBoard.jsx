/**
 * KanbanBoard Component
 *
 * Displays tasks in a Kanban board layout with columns for different task statuses.
 * Supports drag-and-drop to move tasks between columns.
 *
 * Features:
 * - 5 columns: Backlog, Planned, Waiting, Doing, Done
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
import { Circle, Star, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
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

  // Define columns with their properties
  const columns = [
    {
      id: 'BACKLOG',
      title: 'Backlog',
      status: 'BACKLOG',
      color: 'bg-bg-secondary',
      borderColor: 'border-border-primary',
      headerColor: 'text-fg-secondary',
      taskTypeFilter: null
    },
    {
      id: 'PLANNED',
      title: 'Planned',
      status: 'PLANNED',
      color: 'bg-syntax-blue/5',
      borderColor: 'border-syntax-blue/20',
      headerColor: 'text-syntax-blue',
      taskTypeFilter: null
    },
    {
      id: 'WAITING',
      title: 'Waiting',
      status: null, // Waiting is a task_type, not status
      color: 'bg-syntax-yellow/5',
      borderColor: 'border-syntax-yellow/20',
      headerColor: 'text-syntax-yellow',
      taskTypeFilter: 'waiting'
    },
    {
      id: 'DOING',
      title: 'Doing',
      status: 'DOING',
      color: 'bg-syntax-purple/5',
      borderColor: 'border-syntax-purple/20',
      headerColor: 'text-syntax-purple',
      taskTypeFilter: null
    },
    {
      id: 'DONE',
      title: 'Done',
      status: 'DONE',
      color: 'bg-syntax-green/5',
      borderColor: 'border-syntax-green/20',
      headerColor: 'text-syntax-green',
      taskTypeFilter: null
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
    } else {
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
   * Get priority badge color
   */
  const getPriorityBadge = (priority) => {
    if (priority === 0) return { label: 'P1', color: 'bg-semantic-error text-white' }
    if (priority === 1) return { label: 'P2', color: 'bg-syntax-yellow text-black' }
    if (priority === 2) return { label: 'P3', color: 'bg-syntax-green text-white' }
    return null
  }

  /**
   * Render a task card
   */
  const renderTaskCard = (task) => {
    const isSelected = selectedTaskId === task.id
    const isDragging = draggedTask?.id === task.id
    const priorityBadge = getPriorityBadge(task.priority)

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
          group p-4 mb-3 rounded-lg cursor-pointer transition-all
          ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'}
          ${isSelected
            ? 'shadow-lg ring-2 ring-accent-primary'
            : 'shadow hover:shadow-md'
          }
        `}
      >
        {/* Top row: badges */}
        {(priorityBadge || task.task_type || task.context) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {/* Priority badge */}
            {priorityBadge && (
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${priorityBadge.color}`}>
                {priorityBadge.label}
              </span>
            )}

            {/* Task type badge */}
            {task.task_type && (
              <span className="px-2.5 py-1 rounded text-xs font-medium" style={{
                backgroundColor: 'var(--color-label-blue, #0079bf)',
                color: 'white'
              }}>
                {task.task_type}
              </span>
            )}

            {/* Context indicator */}
            {task.context && (
              <span className="px-2.5 py-1 rounded text-xs font-medium" style={{
                backgroundColor: 'var(--color-label-purple, #c377e0)',
                color: 'white'
              }}>
                context
              </span>
            )}
          </div>
        )}

        {/* Task text */}
        <div className="text-base font-medium mb-4 break-words leading-relaxed" style={{ color: 'var(--color-card-text, #172b4d)' }}>
          {task.text}
        </div>

        {/* Bottom row: metadata */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scheduled date badge */}
          {task.scheduled_date && (
            <span className="px-2 py-1 rounded text-xs font-medium" style={{
              backgroundColor: 'var(--color-label-red, #eb5a46)',
              color: 'white'
            }}>
              {formatDateNatural(task.scheduled_date)}
            </span>
          )}

          {/* Star icon */}
          {task.is_starred && (
            <Star size={14} className="flex-shrink-0" style={{ fill: 'var(--color-label-yellow, #f2d600)', color: 'var(--color-label-yellow, #f2d600)' }} />
          )}

          {/* Project name badge */}
          {task.project_id && allNotes && (
            <span className="px-2 py-0.5 rounded text-xs" style={{
              backgroundColor: 'var(--color-list-bg, #ebecf0)',
              color: 'var(--color-card-text-secondary, #5e6c84)'
            }}>
              {allNotes.find(n => n.id === task.project_id)?.title || 'Project'}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex gap-6 p-6 overflow-x-auto" style={{ background: 'var(--color-bg-primary)' }}>
      {columns.map((column) => {
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

/**
 * TaskList Component
 * 
 * Displays a list of tasks with interactive controls.
 * Supports completion checkboxes, starring, drag-and-drop reordering,
 * and displays linked project information.
 * 
 * Features:
 * - Checkbox to toggle task completion (with visual feedback)
 * - Star button to add/remove tasks from Today list
 * - Drag-and-drop to reorder tasks
 * - Display of linked project name (in grey)
 * - Task metadata (order number, creation date)
 * - Empty state with helpful message
 * 
 * Task Data Structure:
 * {
 *   id: string,           // Unique task ID
 *   text: string,         // Task description
 *   completed: boolean,   // Completion status
 *   starred: boolean,     // In Today list?
 *   project_id: string,   // ID of linked project note (or null)
 *   order: number,        // Global sort order
 *   created_at: string    // ISO timestamp
 * }
 * 
 * @param {Array} tasks - Array of task objects to display
 * @param {Array} allNotes - All notes (for resolving project names)
 * @param {function} onToggleComplete - Callback when checkbox clicked (taskId)
 * @param {function} onToggleStar - Callback when star clicked (taskId)
 * @param {function} onReorder - Callback when drag-drop completes (fromIndex, toIndex)
 */

import { Check, Star, Circle } from 'lucide-react'

export default function TaskList({ 
  tasks, 
  allNotes,
  onToggleComplete, 
  onToggleStar,
  onReorder 
}) {
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
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-move"
        >
          {/* Checkbox */}
          <button
            onClick={() => onToggleComplete(task.id)}
            className="mt-0.5 flex-shrink-0"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              task.completed 
                ? 'bg-green-500 border-green-500' 
                : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
            }`}>
              {task.completed && <Check size={14} className="text-white" />}
            </div>
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm ${
                task.completed 
                  ? 'line-through text-gray-400 dark:text-gray-600' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {task.text}
              </span>
              
              {/* Project tag */}
              {task.project_id && (
                <span className="text-xs text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {getProjectName(task.project_id)}
                </span>
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 dark:text-gray-600">
              <span>#{task.order}</span>
              <span>•</span>
              <span>{new Date(task.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Star button */}
          <button
            onClick={() => onToggleStar(task.id)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title={task.starred ? 'Remove from today' : 'Add to today'}
          >
            <Star
              size={16}
              className={task.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 dark:text-gray-600'}
            />
          </button>
        </div>
      ))}
    </div>
  )
}
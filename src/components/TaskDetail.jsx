/**
 * TaskDetail Component - Side Panel for Task Information
 *
 * Displays detailed information about a task including:
 * - Task title/text
 * - Status (BACKLOG, TODO, IN PROGRESS, DONE, CANCELLED)
 * - Context/description
 * - Work notes
 * - Reference ID
 *
 * Opens when:
 * - Double-clicking a task in Tasks/Today/Week lists
 * - Shift+clicking a task reference badge
 */

import { X, Circle, Clock, CheckCircle2, XCircle, AlertCircle, Calendar, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import DatePicker from './DatePicker'
import { formatDateNatural } from '../utils/dateUtils'

export default function TaskDetail({ task, taskNumber, onClose, onSave, showPriorityFormula = true }) {
  const [editedTask, setEditedTask] = useState(task)
  const [isEditingRefId, setIsEditingRefId] = useState(false)
  const [isEditingDates, setIsEditingDates] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showPriorityPanel, setShowPriorityPanel] = useState(false)

  useEffect(() => {
    setEditedTask(task)
  }, [task])

  if (!task) return null

  const handleSave = async () => {
    if (onSave) {
      await onSave(editedTask)
    }
  }

  /**
   * Handle input in textarea to convert "- " to "• " bullet points
   */
  const handleTextareaInput = (e, field) => {
    const textarea = e.target
    const value = textarea.value
    const cursorPosition = textarea.selectionStart

    // Get the current line
    const beforeCursor = value.substring(0, cursorPosition)
    const currentLineStart = beforeCursor.lastIndexOf('\n') + 1
    const currentLine = beforeCursor.substring(currentLineStart)

    // Check if user just typed "- " at the start of a line (with optional indentation)
    const dashMatch = currentLine.match(/^(\s*)- $/)

    if (dashMatch) {
      const indent = dashMatch[1]
      const newValue = value.substring(0, currentLineStart) + indent + '• ' + value.substring(cursorPosition)
      setEditedTask({ ...editedTask, [field]: newValue })

      // Set cursor position after the bullet
      setTimeout(() => {
        textarea.value = newValue
        textarea.selectionStart = textarea.selectionEnd = currentLineStart + indent.length + 2
      }, 0)
    }
  }

  /**
   * Handle key press in textarea to support automatic bullet points and indentation
   * - Enter: Continue bullet list on new line
   * - Tab: Indent current line (add 2 spaces)
   * - Shift+Tab: Outdent current line (remove 2 spaces)
   */
  const handleTextareaKeyDown = (e, field) => {
    const textarea = e.target
    const value = textarea.value
    const cursorPosition = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd

    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault()

      // Get the current line
      const beforeCursor = value.substring(0, cursorPosition)
      const currentLineStart = beforeCursor.lastIndexOf('\n') + 1
      const afterCursor = value.substring(cursorPosition)

      if (e.shiftKey) {
        // Shift+Tab: Outdent (remove up to 2 spaces from start of line)
        const currentLine = value.substring(currentLineStart, cursorPosition)
        const spacesToRemove = currentLine.match(/^( {1,2})/)

        if (spacesToRemove) {
          const removed = spacesToRemove[1].length
          const newValue = value.substring(0, currentLineStart) + value.substring(currentLineStart + removed)
          setEditedTask({ ...editedTask, [field]: newValue })

          setTimeout(() => {
            textarea.value = newValue
            textarea.selectionStart = textarea.selectionEnd = cursorPosition - removed
          }, 0)
        }
      } else {
        // Tab: Indent (add 2 spaces at start of line)
        const newValue = value.substring(0, currentLineStart) + '  ' + value.substring(currentLineStart)
        setEditedTask({ ...editedTask, [field]: newValue })

        setTimeout(() => {
          textarea.value = newValue
          textarea.selectionStart = textarea.selectionEnd = cursorPosition + 2
        }, 0)
      }
      return
    }

    // Handle Enter for bullet continuation
    if (e.key === 'Enter') {
      // Get the current line
      const beforeCursor = value.substring(0, cursorPosition)
      const currentLineStart = beforeCursor.lastIndexOf('\n') + 1
      const currentLine = beforeCursor.substring(currentLineStart)

      // Check if current line starts with a bullet
      const bulletMatch = currentLine.match(/^(\s*[-•]\s+)/)

      if (bulletMatch) {
        const bullet = bulletMatch[1]
        const lineContent = currentLine.substring(bullet.length).trim()

        // If the line only has a bullet (no content), remove the bullet instead of adding a new one
        if (!lineContent) {
          e.preventDefault()
          const newValue = value.substring(0, currentLineStart) + value.substring(cursorPosition)
          setEditedTask({ ...editedTask, [field]: newValue })

          // Set cursor position after the operation
          setTimeout(() => {
            textarea.value = newValue
            textarea.selectionStart = textarea.selectionEnd = currentLineStart
          }, 0)
        } else {
          // Add bullet to the next line
          e.preventDefault()
          const newValue = value.substring(0, cursorPosition) + '\n' + bullet + value.substring(cursorPosition)
          setEditedTask({ ...editedTask, [field]: newValue })

          // Set cursor position after the bullet
          setTimeout(() => {
            textarea.value = newValue
            textarea.selectionStart = textarea.selectionEnd = cursorPosition + 1 + bullet.length
          }, 0)
        }
      }
    }
  }

  const statusOptions = [
    { value: 'BACKLOG', label: 'Backlog', icon: Circle, color: 'text-fg-tertiary' },
    { value: 'PLANNED', label: 'Planned', icon: Circle, color: 'text-syntax-purple' },
    { value: 'DOING', label: 'Doing', icon: Clock, color: 'text-syntax-blue' },
    { value: 'BLOCKED', label: 'Blocked', icon: AlertCircle, color: 'text-syntax-yellow' },
    { value: 'DONE', label: 'Done', icon: CheckCircle2, color: 'text-syntax-green' },
    { value: 'CANCELLED', label: 'Cancelled', icon: XCircle, color: 'text-syntax-red' }
  ]

  const taskTypeOptions = [
    { value: 'DEEP_WORK', label: 'Deep Work', description: 'the real building' },
    { value: 'QUICK_WINS', label: 'Quick Wins', description: 'momentum makers' },
    { value: 'GRUNT_WORK', label: 'Grunt Work', description: 'has to get done' },
    { value: 'PEOPLE_TIME', label: 'People Time', description: 'meetings, comms' },
    { value: 'PLANNING', label: 'Planning', description: 'planning, thinking' }
  ]

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)

    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    const weeks = Math.floor(days / 7)
    if (weeks < 4) return `${weeks}w ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months}mo ago`
    const years = Math.floor(days / 365)
    return `${years}y ago`
  }

  const formatFullDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="w-full h-full bg-bg-primary border border-border-primary rounded shadow-lg flex flex-col">
      {/* Header - Task Title */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Task Number Badge */}
          {taskNumber && (
            <span className="flex-shrink-0 flex items-center justify-center min-w-[1.75rem] h-7 px-2 bg-bg-tertiary text-fg-primary text-xs font-bold rounded">
              #{taskNumber}
            </span>
          )}

          <input
            type="text"
            value={editedTask.text || ''}
            onChange={(e) => setEditedTask({ ...editedTask, text: e.target.value })}
            onBlur={handleSave}
            className="flex-1 min-w-0 text-base font-medium text-fg-primary bg-transparent border-none focus:outline-none"
            placeholder="Task description..."
          />
          {task.ref_id && (
            <span className="font-mono text-xs text-fg-tertiary bg-bg-secondary px-2 py-1 rounded flex-shrink-0">
              {task.ref_id}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-bg-tertiary transition-colors ml-2 flex-shrink-0"
          title="Close"
        >
          <X size={16} className="text-fg-secondary" />
        </button>
      </div>

      {/* Content - No scrollbar, fits in viewport */}
      <div className="flex-1 px-4 py-3 space-y-3 overflow-hidden flex flex-col min-h-0">
        {/* Status and Scheduled Date - Side by Side */}
        <div className="flex-shrink-0 flex gap-4">
          {/* Status Icons */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-fg-secondary mb-1.5">
              Status
            </label>
            <div className="flex items-center gap-3">
              {statusOptions.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={async () => {
                    const updatedTask = { ...editedTask, status: value }
                    setEditedTask(updatedTask)
                    if (onSave) {
                      await onSave(updatedTask)
                    }
                  }}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    editedTask.status === value
                      ? `${color} opacity-100`
                      : 'text-fg-tertiary opacity-40 hover:opacity-80'
                  }`}
                  title={label}
                >
                  <Icon size={20} strokeWidth={editedTask.status === value ? 2.5 : 2} />
                  <span className="text-[9px] font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Date */}
          <div className="flex-1 relative">
            <label className="block text-xs font-medium text-fg-secondary mb-1.5">
              Scheduled Date
            </label>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full flex items-center justify-between px-3 py-2 bg-bg-secondary border border-border-primary rounded text-sm text-fg-primary hover:border-border-focus transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-fg-tertiary" />
                <span className="text-xs">
                  {editedTask.scheduled_date ? formatDateNatural(editedTask.scheduled_date) : 'Not scheduled'}
                </span>
              </div>
              {editedTask.scheduled_date && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const updatedTask = { ...editedTask, scheduled_date: null }
                    setEditedTask(updatedTask)
                    if (onSave) {
                      onSave(updatedTask)
                    }
                  }}
                  className="text-xs text-fg-tertiary hover:text-semantic-error transition-colors"
                  title="Clear date"
                >
                  ×
                </button>
              )}
            </button>

            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-1 z-50">
                <DatePicker
                  value={editedTask.scheduled_date}
                  onChange={async (date) => {
                    const updatedTask = { ...editedTask, scheduled_date: date }
                    // Auto-set status to PLANNED if scheduling a BACKLOG task
                    if (date && editedTask.status === 'BACKLOG') {
                      updatedTask.status = 'PLANNED'
                    }
                    setEditedTask(updatedTask)
                    if (onSave) {
                      await onSave(updatedTask)
                    }
                    setShowDatePicker(false)
                  }}
                  onClose={() => setShowDatePicker(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Work Type Selector - Reactive vs Planning */}
        <div className="flex-shrink-0">
          <label className="block text-xs font-medium text-fg-secondary mb-1.5">
            Work Type
          </label>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const updatedTask = { ...editedTask, work_type: 'reactive' }
                setEditedTask(updatedTask)
                if (onSave) {
                  await onSave(updatedTask)
                }
              }}
              className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-all ${
                editedTask.work_type === 'reactive'
                  ? 'bg-syntax-orange text-fg-inverse'
                  : 'bg-bg-tertiary text-fg-secondary hover:bg-bg-secondary'
              }`}
              title="Responding to external demands, urgent items, firefighting"
            >
              Reactive
            </button>
            <button
              onClick={async () => {
                const updatedTask = { ...editedTask, work_type: 'strategic' }
                setEditedTask(updatedTask)
                if (onSave) {
                  await onSave(updatedTask)
                }
              }}
              className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-all ${
                editedTask.work_type === 'strategic'
                  ? 'bg-syntax-purple text-fg-inverse'
                  : 'bg-bg-tertiary text-fg-secondary hover:bg-bg-secondary'
              }`}
              title="Proactive, goal-oriented work, long-term planning"
            >
              Planning
            </button>
            {editedTask.work_type && (
              <button
                onClick={async () => {
                  const updatedTask = { ...editedTask, work_type: null }
                  setEditedTask(updatedTask)
                  if (onSave) {
                    await onSave(updatedTask)
                  }
                }}
                className="px-3 py-2 rounded text-xs font-medium bg-bg-tertiary text-fg-tertiary hover:text-semantic-error transition-colors"
                title="Clear work type"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Task Type Selector */}
        <div className="flex-shrink-0">
          <label className="block text-xs font-medium text-fg-secondary mb-1.5">
            Task Type
          </label>
          <div className="flex flex-wrap gap-2">
            {taskTypeOptions.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={async () => {
                  const updatedTask = { ...editedTask, task_type: value }
                  setEditedTask(updatedTask)
                  if (onSave) {
                    await onSave(updatedTask)
                  }
                }}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  editedTask.task_type === value
                    ? 'bg-accent-primary text-fg-inverse'
                    : 'bg-bg-tertiary text-fg-secondary hover:bg-bg-secondary'
                }`}
                title={description}
              >
                {label}
              </button>
            ))}
            {editedTask.task_type && (
              <button
                onClick={async () => {
                  const updatedTask = { ...editedTask, task_type: null }
                  setEditedTask(updatedTask)
                  if (onSave) {
                    await onSave(updatedTask)
                  }
                }}
                className="px-3 py-1.5 rounded text-xs font-medium bg-bg-tertiary text-fg-tertiary hover:text-semantic-error transition-colors"
                title="Clear task type"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Task Score Panel */}
        {showPriorityFormula && (
        <div className="flex-shrink-0">
          {/* Global Position Label */}
          {task.priority !== null && task.priority !== undefined && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-medium text-fg-secondary">Global Position:</span>
              <span className="text-sm font-semibold text-fg-primary">
                {task.priority}
              </span>
            </div>
          )}

          <button
            onClick={() => setShowPriorityPanel(!showPriorityPanel)}
            className="w-full flex items-center justify-between px-3 py-2 bg-bg-secondary border border-border-primary rounded hover:bg-bg-tertiary transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-fg-secondary">Task Score</span>
              <span className="text-sm font-semibold text-accent-primary">
                {(() => {
                  const value = editedTask.value || 0
                  const pressure = editedTask.urgency || 0
                  const confidence = editedTask.momentum || 0
                  const timeCost = editedTask.effort || 1
                  const score = timeCost > 0 ? (((value * 1.2) * (pressure * 1.6) * (confidence * 0.8)) / Math.sqrt(timeCost)).toFixed(1) : 0
                  return score
                })()}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-fg-tertiary transition-transform ${showPriorityPanel ? 'rotate-180' : ''}`}
            />
          </button>

          {showPriorityPanel && (
            <div className="mt-2 space-y-3">
              {/* Formula Visualization */}
              <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
            {/* Top Row: Numerator */}
            <div className="flex items-center justify-center gap-2 mb-3">
              {/* Value */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-fg-secondary">Value</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={async () => {
                        const updatedTask = { ...editedTask, value: level }
                        setEditedTask(updatedTask)
                        if (onSave) {
                          await onSave(updatedTask)
                        }
                      }}
                      className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
                        (editedTask.value || 0) >= level
                          ? 'bg-syntax-green border-syntax-green'
                          : 'border-border-primary hover:border-syntax-green'
                      }`}
                      title={`Value: ${level}/5`}
                    />
                  ))}
                </div>
              </div>

              <span className="text-fg-tertiary text-lg mb-4">×</span>

              {/* Pressure */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-fg-secondary">Pressure</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={async () => {
                        const updatedTask = { ...editedTask, urgency: level }
                        setEditedTask(updatedTask)
                        if (onSave) {
                          await onSave(updatedTask)
                        }
                      }}
                      className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
                        (editedTask.urgency || 0) >= level
                          ? 'bg-syntax-red border-syntax-red'
                          : 'border-border-primary hover:border-syntax-red'
                      }`}
                      title={`Pressure: ${level}/5`}
                    />
                  ))}
                </div>
              </div>

              <span className="text-fg-tertiary text-lg mb-4">×</span>

              {/* Confidence */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-fg-secondary">Confidence</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={async () => {
                        const updatedTask = { ...editedTask, momentum: level }
                        setEditedTask(updatedTask)
                        if (onSave) {
                          await onSave(updatedTask)
                        }
                      }}
                      className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
                        (editedTask.momentum || 0) >= level
                          ? 'bg-syntax-purple border-syntax-purple'
                          : 'border-border-primary hover:border-syntax-purple'
                      }`}
                      title={`Confidence: ${level}/5`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Division Line */}
            <div className="border-t-2 border-border-primary mb-3"></div>

            {/* Bottom Row: Denominator */}
            <div className="flex items-center justify-center gap-2 mb-3">
              {/* Time Cost with Square Root Symbol */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-lg text-fg-tertiary">√</span>
                  <span className="text-xs font-medium text-fg-secondary">Time Cost</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={async () => {
                        const updatedTask = { ...editedTask, effort: level }
                        setEditedTask(updatedTask)
                        if (onSave) {
                          await onSave(updatedTask)
                        }
                      }}
                      className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
                        (editedTask.effort || 0) >= level
                          ? 'bg-syntax-blue border-syntax-blue'
                          : 'border-border-primary hover:border-syntax-blue'
                      }`}
                      title={`Time Cost: ${level}/5`}
                    />
                  ))}
                </div>
              </div>

              <span className="text-fg-tertiary text-lg mb-4">=</span>

              {/* Score Display */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-fg-secondary">Score</span>
                <div className="text-2xl font-bold text-accent-primary">
                  {(() => {
                    const value = editedTask.value || 0
                    const pressure = editedTask.urgency || 0
                    const confidence = editedTask.momentum || 0
                    const timeCost = editedTask.effort || 1
                    // Formula: (Value × 1.2) × (Pressure × 1.6) × (Confidence × 0.8) / √Time Cost
                    const score = timeCost > 0 ? (((value * 1.2) * (pressure * 1.6) * (confidence * 0.8)) / Math.sqrt(timeCost)).toFixed(1) : 0
                    return score
                  })()}
                </div>
              </div>
            </div>
          </div>
            </div>
          )}
        </div>
        )}

        {/* Notes */}
        <div className="flex-1 min-h-0 flex flex-col">
          <label className="block text-xs font-medium text-fg-secondary mb-1 flex-shrink-0">
            Notes
          </label>
          <textarea
            value={editedTask.context || ''}
            onChange={(e) => setEditedTask({ ...editedTask, context: e.target.value })}
            onInput={(e) => handleTextareaInput(e, 'context')}
            onKeyDown={(e) => handleTextareaKeyDown(e, 'context')}
            onBlur={handleSave}
            className="flex-1 min-h-0 w-full bg-bg-secondary border border-border-primary rounded px-3 py-2 text-sm text-fg-primary focus:outline-none focus:border-border-focus focus:bg-bg-primary resize-none font-mono leading-relaxed"
            placeholder="What's this task about?
- Type - for bullets (auto-converts to •)
- Tab to indent, Shift+Tab to outdent"
          />
        </div>

        {/* Work Notes */}
        <div className="flex-1 min-h-0 flex flex-col">
          <label className="block text-xs font-medium text-fg-secondary mb-1 flex-shrink-0">
            Work Notes
          </label>
          <textarea
            value={editedTask.work_notes || ''}
            onChange={(e) => setEditedTask({ ...editedTask, work_notes: e.target.value })}
            onInput={(e) => handleTextareaInput(e, 'work_notes')}
            onKeyDown={(e) => handleTextareaKeyDown(e, 'work_notes')}
            onBlur={handleSave}
            className="flex-1 min-h-0 w-full bg-bg-secondary border border-border-primary rounded px-3 py-2 text-sm text-fg-primary focus:outline-none focus:border-border-focus focus:bg-bg-primary resize-none font-mono leading-relaxed"
            placeholder="How's it going? Any blockers?
- Type - for bullets (auto-converts to •)
- Tab to indent, Shift+Tab to outdent"
          />
        </div>

        {/* Metadata */}
        <div className="flex-shrink-0 pt-2 border-t border-border-primary space-y-1.5">
          {task.created_at && (
            <div className="flex justify-between text-xs">
              <span className="text-fg-secondary">Created</span>
              <span
                className="text-fg-primary cursor-help"
                title={formatFullDate(task.created_at)}
              >
                {getRelativeTime(task.created_at)}
              </span>
            </div>
          )}
          {task.updated_at && (
            <div className="flex justify-between text-xs">
              <span className="text-fg-secondary">Updated</span>
              <span
                className="text-fg-primary cursor-help"
                title={formatFullDate(task.updated_at)}
              >
                {getRelativeTime(task.updated_at)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

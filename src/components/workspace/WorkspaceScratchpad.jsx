/**
 * WorkspaceScratchpad Component
 * Task details and scratchpad editor for workspace sessions
 */

import { useState, useEffect } from 'react'
import {
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Save,
  CheckCheck,
  Edit2,
  X
} from 'lucide-react'
import { formatDateNatural } from '../../utils/dateUtils'

export default function WorkspaceScratchpad({
  task,
  project,
  scratchpadContent,
  onScratchpadChange,
  onSaveToWorkNotes,
  onTaskUpdate
}) {
  const [showContext, setShowContext] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isEditingContext, setIsEditingContext] = useState(false)
  const [contextValue, setContextValue] = useState(task.context || '')
  const [isSavingContext, setIsSavingContext] = useState(false)

  // Update contextValue when task changes
  useEffect(() => {
    setContextValue(task.context || '')
  }, [task.context])

  // Handle saving context changes
  const handleSaveContext = async () => {
    setIsSavingContext(true)
    try {
      await onTaskUpdate({ context: contextValue })
      setIsEditingContext(false)
    } catch (error) {
      console.error('Error saving context:', error)
      alert('Failed to save context. Please try again.')
    } finally {
      setIsSavingContext(false)
    }
  }

  // Handle canceling context edit
  const handleCancelContextEdit = () => {
    setContextValue(task.context || '')
    setIsEditingContext(false)
  }

  // Auto-convert "- " to "• " for bullet points
  const handleTextareaInput = (e) => {
    const textarea = e.target
    const value = textarea.value
    const cursorPosition = textarea.selectionStart

    // Get the current line
    const beforeCursor = value.substring(0, cursorPosition)
    const currentLineStart = beforeCursor.lastIndexOf('\n') + 1
    const currentLine = beforeCursor.substring(currentLineStart)

    // Check if user just typed "- " at the start of a line
    const dashMatch = currentLine.match(/^(\s*)- $/)

    if (dashMatch) {
      const indent = dashMatch[1]
      const newValue = value.substring(0, currentLineStart) + indent + '• ' + value.substring(cursorPosition)
      onScratchpadChange(newValue)

      // Set cursor position after the bullet
      setTimeout(() => {
        textarea.value = newValue
        textarea.selectionStart = textarea.selectionEnd = currentLineStart + indent.length + 2
      }, 0)
    }
  }

  // Handle Tab for indentation, Enter for bullet continuation
  const handleTextareaKeyDown = (e) => {
    const textarea = e.target
    const value = textarea.value
    const cursorPosition = textarea.selectionStart

    // Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault()

      const beforeCursor = value.substring(0, cursorPosition)
      const currentLineStart = beforeCursor.lastIndexOf('\n') + 1

      if (e.shiftKey) {
        // Shift+Tab: Outdent
        const currentLine = value.substring(currentLineStart, cursorPosition)
        const spacesToRemove = currentLine.match(/^( {1,2})/)

        if (spacesToRemove) {
          const removed = spacesToRemove[1].length
          const newValue = value.substring(0, currentLineStart) + value.substring(currentLineStart + removed)
          onScratchpadChange(newValue)

          setTimeout(() => {
            textarea.value = newValue
            textarea.selectionStart = textarea.selectionEnd = cursorPosition - removed
          }, 0)
        }
      } else {
        // Tab: Indent
        const newValue = value.substring(0, currentLineStart) + '  ' + value.substring(currentLineStart)
        onScratchpadChange(newValue)

        setTimeout(() => {
          textarea.value = newValue
          textarea.selectionStart = textarea.selectionEnd = cursorPosition + 2
        }, 0)
      }
      return
    }

    // Enter for bullet continuation
    if (e.key === 'Enter') {
      const beforeCursor = value.substring(0, cursorPosition)
      const currentLineStart = beforeCursor.lastIndexOf('\n') + 1
      const currentLine = beforeCursor.substring(currentLineStart)

      const bulletMatch = currentLine.match(/^(\s*[-•]\s+)/)

      if (bulletMatch) {
        const bullet = bulletMatch[1]
        const lineContent = currentLine.substring(bullet.length).trim()

        if (!lineContent) {
          // Empty bullet line - remove it
          e.preventDefault()
          const newValue = value.substring(0, currentLineStart) + value.substring(cursorPosition)
          onScratchpadChange(newValue)

          setTimeout(() => {
            textarea.value = newValue
            textarea.selectionStart = textarea.selectionEnd = currentLineStart
          }, 0)
        } else {
          // Add bullet to next line
          e.preventDefault()
          const newValue = value.substring(0, cursorPosition) + '\n' + bullet + value.substring(cursorPosition)
          onScratchpadChange(newValue)

          setTimeout(() => {
            textarea.value = newValue
            textarea.selectionStart = textarea.selectionEnd = cursorPosition + 1 + bullet.length
          }, 0)
        }
      }
    }
  }

  const handleSaveToWorkNotes = async () => {
    if (!scratchpadContent.trim()) {
      alert('Scratchpad is empty. Nothing to save.')
      return
    }

    const confirmed = window.confirm(
      'Save scratchpad content to Work Notes?\n\nThis will replace the current work notes for this task.'
    )

    if (!confirmed) return

    setIsSaving(true)
    try {
      await onSaveToWorkNotes(scratchpadContent)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error('Error saving to work notes:', error)
      alert('Failed to save to work notes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const statusIcons = {
    BACKLOG: { Icon: Circle, color: 'text-fg-tertiary', label: 'Backlog' },
    PLANNED: { Icon: Circle, color: 'text-syntax-purple', label: 'Planned' },
    DOING: { Icon: Clock, color: 'text-syntax-blue', label: 'Doing' },
    BLOCKED: { Icon: AlertCircle, color: 'text-syntax-yellow', label: 'Blocked' },
    DONE: { Icon: CheckCircle2, color: 'text-syntax-green', label: 'Done' },
    CANCELLED: { Icon: XCircle, color: 'text-syntax-red', label: 'Cancelled' }
  }

  const statusInfo = statusIcons[task.status] || statusIcons.BACKLOG
  const StatusIcon = statusInfo.Icon

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Task Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border-primary">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-fg-primary mb-1 truncate">
              {task.text}
            </h2>
            <div className="flex items-center gap-2 text-xs">
              {task.ref_id && (
                <span className="font-mono text-fg-tertiary bg-bg-secondary px-2 py-0.5 rounded">
                  {task.ref_id}
                </span>
              )}
              {project && (
                <span className="text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded">
                  {project.title}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status and Scheduled */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <StatusIcon size={16} className={statusInfo.color} />
            <span className="text-xs text-fg-secondary">{statusInfo.label}</span>
          </div>
          {task.scheduled_date && (
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-fg-tertiary" />
              <span className="text-xs text-fg-secondary">
                {formatDateNatural(task.scheduled_date)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Task Context (Collapsible & Editable) */}
      <div className="flex-shrink-0 border-b border-border-primary">
        <button
          onClick={() => setShowContext(!showContext)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-bg-secondary transition-colors"
        >
          <span className="text-xs font-semibold text-fg-secondary">Task Context</span>
          <div className="flex items-center gap-2">
            {!isEditingContext && showContext && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingContext(true)
                }}
                className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                title="Edit context"
              >
                <Edit2 size={12} className="text-fg-tertiary" />
              </button>
            )}
            {showContext ? (
              <ChevronUp size={14} className="text-fg-tertiary" />
            ) : (
              <ChevronDown size={14} className="text-fg-tertiary" />
            )}
          </div>
        </button>
        {showContext && (
          <div className="px-4 pb-3">
            {isEditingContext ? (
              <div className="space-y-2">
                <textarea
                  value={contextValue}
                  onChange={(e) => setContextValue(e.target.value)}
                  placeholder="Add context for this task (why it matters, background info, etc.)"
                  className="w-full min-h-[100px] bg-bg-secondary border border-border-primary rounded px-3 py-2 text-xs text-fg-primary placeholder-fg-tertiary focus:outline-none focus:border-border-focus resize-y font-mono leading-relaxed"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveContext}
                    disabled={isSavingContext}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-accent-primary hover:bg-accent-secondary disabled:bg-bg-tertiary disabled:cursor-not-allowed text-white rounded transition-colors"
                  >
                    <Save size={12} />
                    {isSavingContext ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelContextEdit}
                    disabled={isSavingContext}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-bg-tertiary hover:bg-bg-secondary text-fg-primary border border-border-primary rounded transition-colors"
                  >
                    <X size={12} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-fg-primary bg-bg-secondary border border-border-primary rounded p-3 whitespace-pre-wrap font-mono leading-relaxed">
                {task.context || (
                  <span className="text-fg-tertiary italic">No context yet. Click edit to add.</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scratchpad Editor */}
      <div className="flex-1 flex flex-col min-h-0 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-fg-primary">Scratchpad</label>
          <button
            onClick={handleSaveToWorkNotes}
            disabled={isSaving || !scratchpadContent.trim()}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-accent-primary hover:bg-accent-secondary disabled:bg-bg-tertiary disabled:cursor-not-allowed text-white rounded transition-colors"
            title="Save scratchpad content to task work notes"
          >
            {saveSuccess ? (
              <>
                <CheckCheck size={14} />
                Saved!
              </>
            ) : (
              <>
                <Save size={14} />
                {isSaving ? 'Saving...' : 'Save to Work Notes'}
              </>
            )}
          </button>
        </div>

        <textarea
          value={scratchpadContent}
          onChange={(e) => onScratchpadChange(e.target.value)}
          onInput={handleTextareaInput}
          onKeyDown={handleTextareaKeyDown}
          placeholder="Start working here...
• Type - for bullets (auto-converts to •)
• Tab to indent, Shift+Tab to outdent
• Enter continues bullets

This is your scratch space - won't affect the task until you save."
          className="flex-1 w-full bg-bg-secondary border border-border-primary rounded px-3 py-2 text-sm text-fg-primary placeholder-fg-tertiary focus:outline-none focus:border-border-focus resize-none font-mono leading-relaxed"
        />

        <p className="text-xs text-fg-tertiary mt-2">
          Your work here is auto-saved. Click "Save to Work Notes" to copy to the task.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border-primary flex gap-2">
        {task.status !== 'DONE' && (
          <button
            onClick={() => onTaskUpdate({ status: 'DONE' })}
            className="flex-1 px-3 py-2 text-xs font-medium bg-syntax-green hover:bg-syntax-green/80 text-white rounded transition-colors"
          >
            Mark Complete
          </button>
        )}
        {task.status === 'DOING' && (
          <button
            onClick={() => onTaskUpdate({ status: 'PLANNED' })}
            className="flex-1 px-3 py-2 text-xs font-medium bg-bg-tertiary hover:bg-bg-secondary text-fg-primary border border-border-primary rounded transition-colors"
          >
            Pause
          </button>
        )}
        {task.status !== 'DOING' && task.status !== 'DONE' && (
          <button
            onClick={() => onTaskUpdate({ status: 'DOING' })}
            className="flex-1 px-3 py-2 text-xs font-medium bg-syntax-blue hover:bg-syntax-blue/80 text-white rounded transition-colors"
          >
            Start Working
          </button>
        )}
      </div>
    </div>
  )
}

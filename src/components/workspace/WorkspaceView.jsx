/**
 * WorkspaceView Component
 * Full-screen workspace for focused task work with AI assistant
 */

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import WorkspaceScratchpad from './WorkspaceScratchpad'
import WorkspaceChat from './WorkspaceChat'
import Terminal from '../Terminal'
import {
  loadScratchpad,
  saveScratchpad,
  loadChatHistory,
  saveChatHistory,
  getSessionDuration,
  getCurrentSessionDuration,
  getAccumulatedDuration,
  hasExistingSession,
  clearWorkspaceSession,
  startActiveSession,
  pauseActiveSession
} from '../../utils/workspaceStorage'
import { getInitialGreeting } from '../../services/workspaceChatService'
import * as activityLogService from '../../services/activityLogService'

export default function WorkspaceView({ task, project, onExit, onSaveTask, allNotes, onCommand }) {
  const [scratchpadContent, setScratchpadContent] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [sessionDuration, setSessionDuration] = useState(0)
  const [currentSessionDuration, setCurrentSessionDuration] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [hasUnsavedWork, setHasUnsavedWork] = useState(false)

  const terminalRef = useRef(null)

  // Load existing session or start new one
  useEffect(() => {
    if (!task) return

    // Start tracking active session time
    startActiveSession(task.id)

    // Load workspace data: prioritize database over localStorage
    let scratchpad = ''
    let chatHistory = []

    if (task.workspace_data) {
      // Load from database (saved from previous session > 2 mins)
      scratchpad = task.workspace_data.scratchpad || ''
      chatHistory = task.workspace_data.chat_history || []
    } else {
      // Fall back to localStorage
      scratchpad = loadScratchpad(task.id)
      chatHistory = loadChatHistory(task.id)
    }

    setScratchpadContent(scratchpad)

    // Set chat history or add initial greeting
    if (chatHistory.length > 0) {
      setChatHistory(chatHistory)
    } else {
      // Start with AI greeting
      const greeting = getInitialGreeting(task, project)
      setChatHistory([greeting])
      saveChatHistory(task.id, [greeting])
    }

    // Update session durations
    const totalDur = getSessionDuration(task.id)
    const currentDur = getCurrentSessionDuration(task.id)
    const accumulatedDur = getAccumulatedDuration(task.id)

    setSessionDuration(totalDur)
    setCurrentSessionDuration(currentDur)
    setTotalDuration(accumulatedDur)

    // Update durations every second for smooth timer
    const interval = setInterval(() => {
      setSessionDuration(getSessionDuration(task.id))
      setCurrentSessionDuration(getCurrentSessionDuration(task.id))
      setTotalDuration(getAccumulatedDuration(task.id))
    }, 1000)

    return () => {
      clearInterval(interval)
      // Pause session tracking when leaving workspace
      pauseActiveSession(task.id)
    }
  }, [task, project])

  // Track unsaved work
  useEffect(() => {
    setHasUnsavedWork(scratchpadContent.trim().length > 0 || chatHistory.length > 1)
  }, [scratchpadContent, chatHistory])

  // Handle chat updates
  const handleChatUpdate = (updatedHistory) => {
    setChatHistory(updatedHistory)
    saveChatHistory(task.id, updatedHistory)
  }

  // Handle scratchpad changes
  const handleScratchpadChange = (content) => {
    setScratchpadContent(content)
  }

  // Save scratchpad to task work_notes
  const handleSaveToWorkNotes = async (content) => {
    try {
      await onSaveTask({
        ...task,
        work_notes: content
      })
    } catch (error) {
      console.error('Error saving to work notes:', error)
      throw error
    }
  }

  // Handle task updates (status changes, etc.)
  const handleTaskUpdate = async (updates) => {
    try {
      await onSaveTask({
        ...task,
        ...updates
      })
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  // Handle exit with unsaved work check
  const handleExit = async () => {
    // Pause session to get final accurate duration
    pauseActiveSession(task.id)
    const duration = getSessionDuration(task.id)

    // Save workspace data to database and log session if it was > 2 minutes
    if (duration > 2) {
      try {
        // Save workspace data to task
        await onSaveTask({
          ...task,
          workspace_data: {
            scratchpad: scratchpadContent,
            chat_history: chatHistory,
            last_session_duration: duration,
            last_updated: new Date().toISOString()
          }
        })

        // Log session
        await activityLogService.create({
          action_type: 'workspace_session_ended',
          entity_type: 'task',
          entity_id: task.id,
          entity_ref_id: task.ref_id,
          entity_title: task.text,
          details: {
            duration_minutes: duration,
            scratchpad_length: scratchpadContent.length,
            chat_message_count: chatHistory.length,
            project_title: project?.title || null
          }
        })
      } catch (error) {
        console.error('Error saving workspace data:', error)
        // Don't block exit if saving fails
      }
    }

    if (hasUnsavedWork && scratchpadContent.trim().length > 0) {
      const shouldSave = window.confirm(
        'You have unsaved work in the scratchpad.\n\n' +
        'Would you like to save it to Work Notes before exiting?\n\n' +
        '• Yes: Save and exit\n' +
        '• No: Keep in scratchpad, exit workspace\n' +
        '• Cancel: Stay in workspace'
      )

      if (shouldSave === null) {
        // User clicked Cancel
        return
      }

      if (shouldSave) {
        // Save to work notes before exiting
        handleSaveToWorkNotes(scratchpadContent)
          .then(() => {
            onExit()
          })
          .catch((error) => {
            console.error('Error saving before exit:', error)
            alert('Failed to save. Please try again.')
          })
        return
      }
    }

    // Exit without saving
    onExit()
  }

  // Handle clear session
  const handleClearSession = () => {
    const confirmed = window.confirm(
      'Clear this workspace session?\n\n' +
      'This will delete:\n' +
      '• Scratchpad content\n' +
      '• Chat history\n\n' +
      'Task work notes will NOT be affected.\n\n' +
      'Continue?'
    )

    if (confirmed) {
      clearWorkspaceSession(task.id)
      setScratchpadContent('')
      setChatHistory([getInitialGreeting(task, project)])
      saveChatHistory(task.id, [getInitialGreeting(task, project)])
    }
  }

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (!task) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary">
        <p className="text-fg-secondary">No task selected</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-border-primary bg-bg-elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleExit}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-fg-primary hover:bg-bg-tertiary rounded transition-colors"
            >
              <ArrowLeft size={16} />
              Exit Workspace
            </button>

            <div className="h-6 w-px bg-border-primary" />

            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-fg-primary">
                Working on: <span className="text-accent-primary">{task.text}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Session Duration - Combined Format */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-fg-primary font-medium">
                This Session: <span className="text-fg-secondary">{formatDuration(currentSessionDuration)}</span>
                {totalDuration > 0 && <span className="text-fg-secondary"> (Total: {formatDuration(sessionDuration)})</span>}
              </span>
            </div>

            {/* Clear Session Button */}
            <button
              onClick={handleClearSession}
              className="px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-semantic-error hover:bg-bg-tertiary rounded transition-colors"
            >
              Clear Session
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Scratchpad */}
          <div className="w-1/2 overflow-y-auto border-r border-border-primary">
            <WorkspaceScratchpad
              task={task}
              project={project}
              scratchpadContent={scratchpadContent}
              onScratchpadChange={handleScratchpadChange}
              onSaveToWorkNotes={handleSaveToWorkNotes}
              onTaskUpdate={handleTaskUpdate}
            />
          </div>

          {/* Right: Chat */}
          <div className="w-1/2 overflow-hidden">
            <WorkspaceChat
              task={task}
              project={project}
              chatHistory={chatHistory}
              onChatUpdate={handleChatUpdate}
            />
          </div>
        </div>

        {/* Terminal - Collapsible at bottom */}
        {onCommand && (
          <div className="flex-shrink-0">
            <Terminal ref={terminalRef} onCommand={onCommand} />
          </div>
        )}
      </div>
    </div>
  )
}

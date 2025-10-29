/**
 * Workspace Storage Utilities
 * Manages localStorage for workspace sessions (scratchpad + chat history)
 */

const STORAGE_PREFIX = 'workspace_'
const SCRATCHPAD_SUFFIX = '_scratchpad'
const CHAT_SUFFIX = '_chat'
const SESSION_SUFFIX = '_session'

/**
 * Get storage key for a task's workspace data
 */
function getStorageKey(taskId, type) {
  return `${STORAGE_PREFIX}${taskId}${type}`
}

/**
 * Load scratchpad content for a task
 * @param {string} taskId - Task UUID
 * @returns {string} - Scratchpad content or empty string
 */
export function loadScratchpad(taskId) {
  try {
    const key = getStorageKey(taskId, SCRATCHPAD_SUFFIX)
    const content = localStorage.getItem(key)
    return content || ''
  } catch (error) {
    console.error('Error loading scratchpad:', error)
    return ''
  }
}

/**
 * Save scratchpad content for a task
 * @param {string} taskId - Task UUID
 * @param {string} content - Scratchpad content
 */
export function saveScratchpad(taskId, content) {
  try {
    const key = getStorageKey(taskId, SCRATCHPAD_SUFFIX)
    localStorage.setItem(key, content)

    // Update session timestamp
    updateSessionTimestamp(taskId)
  } catch (error) {
    console.error('Error saving scratchpad:', error)
  }
}

/**
 * Load chat history for a task
 * @param {string} taskId - Task UUID
 * @returns {Array} - Array of message objects [{role, content, timestamp}]
 */
export function loadChatHistory(taskId) {
  try {
    const key = getStorageKey(taskId, CHAT_SUFFIX)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error loading chat history:', error)
    return []
  }
}

/**
 * Save chat history for a task
 * @param {string} taskId - Task UUID
 * @param {Array} chatHistory - Array of message objects
 */
export function saveChatHistory(taskId, chatHistory) {
  try {
    const key = getStorageKey(taskId, CHAT_SUFFIX)
    localStorage.setItem(key, JSON.stringify(chatHistory))

    // Update session timestamp
    updateSessionTimestamp(taskId)
  } catch (error) {
    console.error('Error saving chat history:', error)
  }
}

/**
 * Load session metadata (start time, last activity, active minutes)
 * @param {string} taskId - Task UUID
 * @returns {Object} - Session metadata {startedAt, lastActivity, activeMinutes, currentSessionStart}
 */
export function loadSessionMetadata(taskId) {
  try {
    const key = getStorageKey(taskId, SESSION_SUFFIX)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error loading session metadata:', error)
    return null
  }
}

/**
 * Update session timestamp
 * @param {string} taskId - Task UUID
 */
function updateSessionTimestamp(taskId) {
  try {
    const key = getStorageKey(taskId, SESSION_SUFFIX)
    const existing = loadSessionMetadata(taskId) || {}

    const metadata = {
      startedAt: existing.startedAt || new Date().toISOString(),
      lastActivity: new Date().toISOString()
    }

    localStorage.setItem(key, JSON.stringify(metadata))
  } catch (error) {
    console.error('Error updating session timestamp:', error)
  }
}

/**
 * Clear all workspace data for a task
 * @param {string} taskId - Task UUID
 */
export function clearWorkspaceSession(taskId) {
  try {
    localStorage.removeItem(getStorageKey(taskId, SCRATCHPAD_SUFFIX))
    localStorage.removeItem(getStorageKey(taskId, CHAT_SUFFIX))
    localStorage.removeItem(getStorageKey(taskId, SESSION_SUFFIX))
  } catch (error) {
    console.error('Error clearing workspace session:', error)
  }
}

/**
 * Check if a workspace session exists for a task
 * @param {string} taskId - Task UUID
 * @returns {boolean} - True if session exists
 */
export function hasExistingSession(taskId) {
  const scratchpad = loadScratchpad(taskId)
  const chatHistory = loadChatHistory(taskId)

  return scratchpad.trim().length > 0 || chatHistory.length > 0
}

/**
 * Start an active workspace session
 * Records the current timestamp as session start
 * @param {string} taskId - Task UUID
 */
export function startActiveSession(taskId) {
  try {
    const key = getStorageKey(taskId, SESSION_SUFFIX)
    const existing = loadSessionMetadata(taskId) || {}

    const metadata = {
      startedAt: existing.startedAt || new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      activeMinutes: existing.activeMinutes || 0,
      currentSessionStart: new Date().toISOString()
    }

    localStorage.setItem(key, JSON.stringify(metadata))
  } catch (error) {
    console.error('Error starting active session:', error)
  }
}

/**
 * Pause an active workspace session
 * Calculates elapsed time and adds to accumulated active minutes
 * @param {string} taskId - Task UUID
 * @returns {number} - Total active minutes after pausing
 */
export function pauseActiveSession(taskId) {
  try {
    const key = getStorageKey(taskId, SESSION_SUFFIX)
    const existing = loadSessionMetadata(taskId)

    if (!existing || !existing.currentSessionStart) {
      return existing?.activeMinutes || 0
    }

    const sessionStart = new Date(existing.currentSessionStart)
    const now = new Date()
    const sessionMinutes = Math.floor((now - sessionStart) / 1000 / 60)

    const metadata = {
      startedAt: existing.startedAt || new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      activeMinutes: (existing.activeMinutes || 0) + sessionMinutes,
      currentSessionStart: null
    }

    localStorage.setItem(key, JSON.stringify(metadata))
    return metadata.activeMinutes
  } catch (error) {
    console.error('Error pausing active session:', error)
    return 0
  }
}

/**
 * Get active session duration in minutes
 * Returns accumulated active time + current session time (if active)
 * @param {string} taskId - Task UUID
 * @returns {number} - Active duration in minutes or 0
 */
export function getSessionDuration(taskId) {
  const metadata = loadSessionMetadata(taskId)
  if (!metadata) return 0

  let duration = metadata.activeMinutes || 0

  // Add current session time if session is active
  if (metadata.currentSessionStart) {
    const sessionStart = new Date(metadata.currentSessionStart)
    const now = new Date()
    const currentMinutes = Math.floor((now - sessionStart) / 1000 / 60)
    duration += currentMinutes
  }

  return duration
}

/**
 * Get current session duration (time in current active session)
 * @param {string} taskId - Task UUID
 * @returns {number} - Current session duration in minutes or 0
 */
export function getCurrentSessionDuration(taskId) {
  const metadata = loadSessionMetadata(taskId)
  if (!metadata || !metadata.currentSessionStart) return 0

  const sessionStart = new Date(metadata.currentSessionStart)
  const now = new Date()
  return Math.floor((now - sessionStart) / 1000 / 60)
}

/**
 * Get accumulated duration (total time from previous sessions)
 * @param {string} taskId - Task UUID
 * @returns {number} - Accumulated duration in minutes or 0
 */
export function getAccumulatedDuration(taskId) {
  const metadata = loadSessionMetadata(taskId)
  return metadata?.activeMinutes || 0
}

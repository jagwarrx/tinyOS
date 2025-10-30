/**
 * Navigation History Manager
 *
 * Manages browser-like back/forward navigation history
 * Stores the last 20 pages in localStorage
 */

const HISTORY_KEY = 'navigation_history'
const MAX_HISTORY_SIZE = 20

/**
 * Get navigation history from localStorage
 * @returns {{ history: string[], currentIndex: number }}
 */
export const getHistory = () => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error reading navigation history:', error)
  }
  return { history: [], currentIndex: -1 }
}

/**
 * Save navigation history to localStorage
 * @param {{ history: string[], currentIndex: number }} data
 */
const saveHistory = (data) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving navigation history:', error)
  }
}

/**
 * Add a page to navigation history
 * @param {string} noteId - The note ID to add to history
 */
export const addToHistory = (noteId) => {
  if (!noteId) return

  const { history, currentIndex } = getHistory()

  // If we're not at the end of history, remove everything after current position
  // (like a browser when you navigate back then go to a new page)
  const newHistory = history.slice(0, currentIndex + 1)

  // Don't add if it's the same as the current page
  if (newHistory[newHistory.length - 1] === noteId) {
    return
  }

  // Add new page
  newHistory.push(noteId)

  // Limit to MAX_HISTORY_SIZE
  if (newHistory.length > MAX_HISTORY_SIZE) {
    newHistory.shift() // Remove oldest
  }

  saveHistory({
    history: newHistory,
    currentIndex: newHistory.length - 1
  })
}

/**
 * Navigate back in history
 * @returns {string|null} - The note ID to navigate to, or null if can't go back
 */
export const navigateBack = () => {
  const { history, currentIndex } = getHistory()

  if (currentIndex <= 0) {
    return null // Can't go back
  }

  const newIndex = currentIndex - 1
  saveHistory({ history, currentIndex: newIndex })

  return history[newIndex]
}

/**
 * Navigate forward in history
 * @returns {string|null} - The note ID to navigate to, or null if can't go forward
 */
export const navigateForward = () => {
  const { history, currentIndex } = getHistory()

  if (currentIndex >= history.length - 1) {
    return null // Can't go forward
  }

  const newIndex = currentIndex + 1
  saveHistory({ history, currentIndex: newIndex })

  return history[newIndex]
}

/**
 * Check if we can navigate back
 * @returns {boolean}
 */
export const canGoBack = () => {
  const { currentIndex } = getHistory()
  return currentIndex > 0
}

/**
 * Check if we can navigate forward
 * @returns {boolean}
 */
export const canGoForward = () => {
  const { history, currentIndex } = getHistory()
  return currentIndex < history.length - 1
}

/**
 * Clear navigation history
 */
export const clearHistory = () => {
  saveHistory({ history: [], currentIndex: -1 })
}

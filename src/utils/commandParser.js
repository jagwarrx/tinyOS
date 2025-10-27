/**
 * Command Parser Utilities
 * 
 * Parses terminal commands into structured command objects.
 * Also provides utilities for task management.
 * 
 * Supported Commands:
 * - help, /help               → Shows help text
 * - add task "text" to target → Adds a task
 * - complete task N           → Marks task N as complete
 * - star task N               → Stars task N
 * - goto target               → Navigates to target note
 * - start timer N             → Starts a timer for N minutes with 30-second intervals
 * 
 * Command Object Structure:
 * {
 *   type: string,    // Command type (HELP, ADD_TASK, GOTO, etc.)
 *   payload: object  // Command-specific data
 * }
 */

/**
 * Parse a terminal command string into a command object
 * 
 * @param {string} input - Raw command string from terminal
 * @returns {object} - Parsed command with type and payload
 * 
 * @example
 * parseCommand('add task "Buy milk" to today')
 * // Returns: { type: 'ADD_TASK', payload: { text: 'Buy milk', target: 'today' } }
 */
export function parseCommand(input) {
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase()
  
  // Help command: /help or help
  if (lower === 'help' || lower === '/help') {
    return {
      type: 'HELP',
      payload: {}
    }
  }

  // Add task command: add task "text" to [today|week|tasks]
  const addTaskPattern = /^add\s+task\s+"([^"]*)"\s+to\s+(today|week|tasks)$/i
  const addTaskMatch = trimmed.match(addTaskPattern)
  
  if (addTaskMatch) {
    return {
      type: 'ADD_TASK',
      payload: {
        text: addTaskMatch[1],
        target: addTaskMatch[2].toLowerCase()
      }
    }
  }

  // Complete task command: complete task <number>
  const completePattern = /^complete\s+task\s+(\d+)$/i
  const completeMatch = trimmed.match(completePattern)
  
  if (completeMatch) {
    return {
      type: 'COMPLETE_TASK',
      payload: {
        taskId: completeMatch[1]
      }
    }
  }

  // Star task command: star task <number>
  const starPattern = /^star\s+task\s+(\d+)$/i
  const starMatch = trimmed.match(starPattern)

  if (starMatch) {
    return {
      type: 'STAR_TASK',
      payload: {
        taskId: starMatch[1]
      }
    }
  }

  // Start timer command: start timer <minutes>
  // Must check BEFORE goto to avoid being caught by goto's greedy pattern
  const startTimerPattern = /^start\s+timer\s+(\d+)$/i
  const startTimerMatch = trimmed.match(startTimerPattern)

  if (startTimerMatch) {
    return {
      type: 'START_TIMER',
      payload: {
        minutes: parseInt(startTimerMatch[1], 10)
      }
    }
  }

  // Goto command: goto <target>
  const gotoPattern = /^goto\s+(.+)$/i
  const gotoMatch = trimmed.match(gotoPattern)

  if (gotoMatch) {
    return {
      type: 'GOTO',
      payload: {
        target: gotoMatch[1]
      }
    }
  }

  // Prevent single words from being treated as goto (except goto itself)
  if (!trimmed.includes(' ')) {
    return {
      type: 'UNKNOWN',
      payload: {
        input: trimmed
      }
    }
  }

  // Unknown command - nothing matched
  return {
    type: 'UNKNOWN',
    payload: {
      input: trimmed
    }
  }
}

/**
 * Generate a unique ID for a new task
 * Format: task_<timestamp>_<random>
 * 
 * @returns {string} - Unique task ID
 * 
 * @example
 * generateTaskId() // 'task_1730000000000_abc123def'
 */
export function generateTaskId() {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create task list content JSON structure
 * 
 * @param {Array} items - Array of task objects
 * @returns {string} - JSON string for storing in note content
 * 
 * @example
 * createTaskListContent([{ id: '1', text: 'Buy milk', completed: false }])
 * // Returns: '{"type":"task_list","items":[...]}'
 */
export function createTaskListContent(items = []) {
  return JSON.stringify({
    type: 'task_list',
    items: items
  })
}

/**
 * Parse task list content from JSON
 * 
 * @param {string} content - JSON string from note content
 * @returns {Array} - Array of task objects, or empty array if parsing fails
 * 
 * @example
 * parseTaskListContent('{"type":"task_list","items":[...]}')
 * // Returns: [{ id: '1', text: 'Buy milk', completed: false }, ...]
 */
export function parseTaskListContent(content) {
  try {
    const parsed = JSON.parse(content)
    if (parsed.type === 'task_list' && Array.isArray(parsed.items)) {
      return parsed.items
    }
    return []
  } catch {
    return []
  }
}

/**
 * Get the next order number for a new task
 * Finds the highest existing order and adds 1
 * 
 * @param {Array} allTasks - Array of all existing tasks
 * @returns {number} - Next order number (0 if no tasks exist)
 * 
 * @example
 * getNextTaskOrder([{ order: 0 }, { order: 1 }, { order: 2 }])
 * // Returns: 3
 */
export function getNextTaskOrder(allTasks) {
  if (allTasks.length === 0) return 0
  return Math.max(...allTasks.map(t => t.order || 0)) + 1
}
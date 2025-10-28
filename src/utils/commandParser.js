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

  // AI Commands
  // /joke - Get a programming joke
  if (lower === '/joke') {
    return {
      type: 'AI_JOKE',
      payload: {}
    }
  }

  // /tip - Get a productivity tip
  if (lower === '/tip') {
    return {
      type: 'AI_TIP',
      payload: {}
    }
  }

  // /quote - Get an inspiring quote
  if (lower === '/quote') {
    return {
      type: 'AI_QUOTE',
      payload: {}
    }
  }

  // /fact - Get an interesting tech fact
  if (lower === '/fact') {
    return {
      type: 'AI_FACT',
      payload: {}
    }
  }

  // /ask <question> - Ask Claude a question
  const askPattern = /^\/ask\s+(.+)$/i
  const askMatch = trimmed.match(askPattern)
  if (askMatch) {
    return {
      type: 'AI_ASK',
      payload: {
        question: askMatch[1]
      }
    }
  }

  // /explain <concept> - Get an explanation
  const explainPattern = /^\/explain\s+(.+)$/i
  const explainMatch = trimmed.match(explainPattern)
  if (explainMatch) {
    return {
      type: 'AI_EXPLAIN',
      payload: {
        concept: explainMatch[1]
      }
    }
  }

  // /brainstorm <topic> - Get brainstorming ideas
  const brainstormPattern = /^\/brainstorm\s+(.+)$/i
  const brainstormMatch = trimmed.match(brainstormPattern)
  if (brainstormMatch) {
    return {
      type: 'AI_BRAINSTORM',
      payload: {
        topic: brainstormMatch[1]
      }
    }
  }

  // Quick task command: /task text [:today] [:note "text"] [:project] - adds to Tasks page (quotes optional)
  // Inbox command: /inbox "title" :note "text" - adds to Inbox page
  // First, extract any :note "text" suffix (including multi-line content)
  const notePattern = /:note\s+"([^"]*)"/i
  const noteMatch = trimmed.match(notePattern)
  const noteText = noteMatch ? noteMatch[1] : null

  // Remove :note suffix from command for further parsing
  const withoutNote = noteText ? trimmed.replace(notePattern, '').trim() : trimmed

  const quickTaskPattern = /^\/task\s+(.+?)(?:\s+:today)?(?:\s+:project)?$/i
  const quickTaskMatch = withoutNote.match(quickTaskPattern)

  if (quickTaskMatch) {
    let taskText = quickTaskMatch[1].trim()
    // Strip surrounding quotes if present
    if (taskText.startsWith('"') && taskText.endsWith('"')) {
      taskText = taskText.slice(1, -1)
    }

    // Check if :today suffix was present
    const scheduleToday = withoutNote.toLowerCase().includes(':today')

    // Check if :project suffix was present
    const addToProject = withoutNote.toLowerCase().includes(':project')

    return {
      type: 'ADD_TASK',
      payload: {
        text: taskText,
        target: addToProject ? 'project' : 'tasks',
        scheduleToday,
        note: noteText,
        addToProject
      }
    }
  }

  // Inbox command: /inbox "title" :note "multi-line text"
  const inboxPattern = /^\/inbox\s+(.+?)(?:\s+:note)?$/i
  const inboxMatch = withoutNote.match(inboxPattern)

  if (inboxMatch) {
    let itemTitle = inboxMatch[1].trim()
    // Strip surrounding quotes if present
    if (itemTitle.startsWith('"') && itemTitle.endsWith('"')) {
      itemTitle = itemTitle.slice(1, -1)
    }

    return {
      type: 'INBOX',
      payload: {
        title: itemTitle,
        note: noteText
      }
    }
  }

  // Project command: /project "Project Name" or /project ProjectName
  const projectPattern = /^\/project\s+(.+)$/i
  const projectMatch = trimmed.match(projectPattern)

  if (projectMatch) {
    let projectName = projectMatch[1].trim()
    // Strip surrounding quotes if present
    if (projectName.startsWith('"') && projectName.endsWith('"')) {
      projectName = projectName.slice(1, -1)
    }

    return {
      type: 'PROJECT',
      payload: {
        name: projectName
      }
    }
  }

  // Add task command: add task "text" to|in [today|week|tasks] [:today] [:note "text"]
  // Note pattern already extracted above, use same withoutNote
  const addTaskPattern = /^add\s+task\s+"([^"]*)"\s+(?:to|in)\s+(today|week|tasks)(?:\s+:today)?$/i
  const addTaskMatch = withoutNote.match(addTaskPattern)

  if (addTaskMatch) {
    const scheduleToday = withoutNote.toLowerCase().includes(':today')

    return {
      type: 'ADD_TASK',
      payload: {
        text: addTaskMatch[1],
        target: addTaskMatch[2].toLowerCase(),
        scheduleToday,
        note: noteText
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
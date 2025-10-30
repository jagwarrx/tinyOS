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

  // /log energy <0-5> - Log energy level (check this first before general log)
  const logEnergyPattern = /^\/log\s+energy\s+([0-5])$/i
  const logEnergyMatch = trimmed.match(logEnergyPattern)
  if (logEnergyMatch) {
    return {
      type: 'LOG_ENERGY',
      payload: {
        level: parseInt(logEnergyMatch[1], 10)
      }
    }
  }

  // /log water - Log water intake
  if (lower === '/log water') {
    return {
      type: 'LOG_WATER',
      payload: {}
    }
  }

  // /remind <time> <text> - Create reminder
  const remindPattern = /^\/remind\s+(.+)$/i
  const remindMatch = trimmed.match(remindPattern)
  if (remindMatch) {
    // We'll parse the time and text in the handler
    return {
      type: 'REMINDER',
      payload: {
        input: remindMatch[1]
      }
    }
  }

  // /log <text> - Log general entry
  const logPattern = /^\/log\s+(.+)$/i
  const logMatch = trimmed.match(logPattern)
  if (logMatch) {
    let logText = logMatch[1].trim()

    // Extract hashtag from log text (format: #tag or #tag/path/subpath)
    const hashtagPattern = /#([a-zA-Z0-9_/]+)(?:\s|$)/
    const hashtagMatch = logText.match(hashtagPattern)
    let tagPath = null
    if (hashtagMatch) {
      tagPath = hashtagMatch[1]
      // Remove hashtag from log text
      logText = logText.replace(hashtagPattern, '').trim()
    }

    return {
      type: 'LOG_ENTRY',
      payload: {
        text: logText,
        tag: tagPath
      }
    }
  }

  // Quick task command: /task text [:today] [:note "text"] [:project] [:tag "tag/path"] - adds to Tasks page (quotes optional)
  // Inbox command: /inbox "title" :note "text" - adds to Inbox page
  // First, extract any :note "text" suffix (including multi-line content)
  const notePattern = /:note\s+"([^"]*)"/i
  const noteMatch = trimmed.match(notePattern)
  const noteText = noteMatch ? noteMatch[1] : null

  // Extract any :tag "tag/path" suffix
  const tagPattern = /:tag\s+"([^"]*)"/i
  const tagMatch = trimmed.match(tagPattern)
  let tagPath = tagMatch ? tagMatch[1] : null

  // Remove :note and :tag suffixes from command for further parsing
  let withoutOptions = trimmed
  if (noteText) withoutOptions = withoutOptions.replace(notePattern, '').trim()
  if (tagPath) withoutOptions = withoutOptions.replace(tagPattern, '').trim()

  const quickTaskPattern = /^\/task\s+(.+?)(?:\s+:today)?(?:\s+:project)?(?:\s+:tag)?$/i
  const quickTaskMatch = withoutOptions.match(quickTaskPattern)

  if (quickTaskMatch) {
    let taskText = quickTaskMatch[1].trim()
    // Strip surrounding quotes if present
    if (taskText.startsWith('"') && taskText.endsWith('"')) {
      taskText = taskText.slice(1, -1)
    }

    // Extract hashtag from task text (format: #tag or #tag/path/subpath)
    // Match hashtag at the end of the text or followed by whitespace
    const hashtagPattern = /#([a-zA-Z0-9_/]+)(?:\s|$)/
    const hashtagMatch = taskText.match(hashtagPattern)
    if (hashtagMatch && !tagPath) {
      tagPath = hashtagMatch[1]
      // Remove hashtag from task text
      taskText = taskText.replace(hashtagPattern, '').trim()
    }

    // Check if :today suffix was present
    const scheduleToday = withoutOptions.toLowerCase().includes(':today')

    // Check if :project suffix was present
    const addToProject = withoutOptions.toLowerCase().includes(':project')

    return {
      type: 'ADD_TASK',
      payload: {
        text: taskText,
        target: addToProject ? 'project' : 'tasks',
        scheduleToday,
        note: noteText,
        tag: tagPath,
        addToProject
      }
    }
  }

  // Inbox command: /inbox "title" :note "multi-line text"
  const inboxPattern = /^\/inbox\s+(.+?)(?:\s+:note)?$/i
  const inboxMatch = withoutOptions.match(inboxPattern)

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

  // Item command: /item "title" :note "multi-line text" (alias for inbox)
  const itemPattern = /^\/item\s+(.+?)(?:\s+:note)?$/i
  const itemMatch = withoutOptions.match(itemPattern)

  if (itemMatch) {
    let itemTitle = itemMatch[1].trim()
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

  // Category command: /category <admin|work|personal> (sets category for current project)
  const categoryPattern = /^\/category\s+(admin|work|personal)$/i
  const categoryMatch = trimmed.match(categoryPattern)

  if (categoryMatch) {
    const category = categoryMatch[1].toLowerCase()

    return {
      type: 'CATEGORY',
      payload: {
        category
      }
    }
  }

  // Diagram command: /diagram "Diagram Name" or /diagram DiagramName
  const diagramPattern = /^\/diagram\s+(.+)$/i
  const diagramMatch = trimmed.match(diagramPattern)

  if (diagramMatch) {
    let diagramName = diagramMatch[1].trim()
    // Strip surrounding quotes if present
    if (diagramName.startsWith('"') && diagramName.endsWith('"')) {
      diagramName = diagramName.slice(1, -1)
    }

    return {
      type: 'DIAGRAM',
      payload: {
        name: diagramName
      }
    }
  }

  // Mindmap command: /mindmap "Mindmap Name" or /mindmap MindmapName
  const mindmapPattern = /^\/mindmap\s+(.+)$/i
  const mindmapMatch = trimmed.match(mindmapPattern)

  if (mindmapMatch) {
    let mindmapName = mindmapMatch[1].trim()
    // Strip surrounding quotes if present
    if (mindmapName.startsWith('"') && mindmapName.endsWith('"')) {
      mindmapName = mindmapName.slice(1, -1)
    }

    return {
      type: 'MINDMAP',
      payload: {
        name: mindmapName
      }
    }
  }

  // Add task command: add task "text" to|in [today|scheduled|tasks] [:today] [:note "text"]
  // Note pattern already extracted above, use same withoutOptions
  const addTaskPattern = /^add\s+task\s+"([^"]*)"\s+(?:to|in)\s+(today|scheduled|tasks)(?:\s+:today)?$/i
  const addTaskMatch = withoutOptions.match(addTaskPattern)

  if (addTaskMatch) {
    const scheduleToday = withoutOptions.toLowerCase().includes(':today')

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
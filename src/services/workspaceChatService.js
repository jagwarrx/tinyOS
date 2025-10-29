/**
 * Workspace Chat Service
 * Handles AI assistant interactions for workspace sessions
 */

import { callClaude } from './claudeService'

/**
 * Build system prompt with task and project context
 * @param {Object} task - Current task object
 * @param {Object} project - Project object (optional)
 * @returns {string} - System prompt for AI
 */
function buildSystemPrompt(task, project) {
  const taskContext = task.context ? `\nTask Context: ${task.context}` : ''
  const workNotes = task.work_notes ? `\nWork Notes: ${task.work_notes}` : ''
  const scheduledDate = task.scheduled_date ? `\nDue: ${task.scheduled_date}` : ''

  let projectSection = ''
  if (project) {
    projectSection = `
PROJECT CONTEXT:
- Project: ${project.title}
- Status: ${project.project_status || 'Not specified'}
- Context: ${project.project_context || 'None'}
`
  }

  return `You are a focused work assistant helping complete a specific task. Your goal is to help the user stay on track, clarify their approach, and make progress.

TASK DETAILS:
- Title: ${task.text}
- Status: ${task.status}${taskContext}${workNotes}${scheduledDate}
${projectSection}
YOUR ROLE:
1. You exist within a larger task and notes management platfrom. 
2. Ask clarifying questions about approach and methodology
2. Break down the task into concrete, actionable steps
3. Help identify blockers and suggest solutions
4. Keep the user focused and on track
5. Provide relevant technical insights when needed

GUIDELINES:
- Be concise and actionable (2-3 sentences max per response)
- Ask one focused question at a time
- Acknowledge progress and celebrate wins
- Suggest next steps proactively
- Reference the task/project context when relevant
- If the user seems stuck, help them break down the problem

Start by understanding what the user's current plan is for this task.`
}

/**
 * Build initial greeting message
 * @param {Object} task - Current task object
 * @returns {string} - Greeting message
 */
function buildGreeting(task) {
  return `I'm here to help you work on "${task.text}". What's your current plan or approach for this task?`
}

/**
 * Send a message to the AI assistant
 * @param {string} userMessage - User's message
 * @param {Array} chatHistory - Previous chat messages [{role, content, timestamp}]
 * @param {Object} task - Current task object
 * @param {Object} project - Project object (optional)
 * @returns {Promise<string>} - AI's response
 */
export async function sendMessage(userMessage, chatHistory, task, project) {
  try {
    // Build conversation context
    const systemPrompt = buildSystemPrompt(task, project)

    // Build conversation history for Claude
    // We'll send the last 10 messages for context (to keep tokens manageable)
    const recentHistory = chatHistory.slice(-10)

    // Format conversation for Claude
    let conversationContext = systemPrompt + '\n\nCONVERSATION HISTORY:\n'

    recentHistory.forEach(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant'
      conversationContext += `${role}: ${msg.content}\n`
    })

    conversationContext += `\nUser: ${userMessage}\n\nAssistant:`

    // Call Claude API
    const response = await callClaude(conversationContext, {
      maxTokens: 500,
      temperature: 0.7 // Slightly lower temperature for more focused responses
    })

    return response
  } catch (error) {
    console.error('Error sending message to AI:', error)
    throw new Error(`Failed to get AI response: ${error.message}`)
  }
}

/**
 * Get initial greeting for a new workspace session
 * @param {Object} task - Current task object
 * @param {Object} project - Project object (optional)
 * @returns {Object} - Initial AI message object
 */
export function getInitialGreeting(task, project) {
  return {
    role: 'assistant',
    content: buildGreeting(task),
    timestamp: new Date().toISOString()
  }
}

/**
 * Suggest next steps based on task status
 * @param {Object} task - Current task object
 * @returns {string} - Suggested prompt for the AI
 */
export function suggestNextSteps(task) {
  switch (task.status) {
    case 'BACKLOG':
      return "What's the first step to get started on this?"
    case 'PLANNED':
      return "I'm ready to start. What should I tackle first?"
    case 'DOING':
      return "I'm working on this. What's the next concrete action?"
    case 'BLOCKED':
      return "I'm stuck. Can you help me identify what's blocking me?"
    default:
      return "How should I approach this task?"
  }
}

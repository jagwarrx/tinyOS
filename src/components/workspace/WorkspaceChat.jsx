/**
 * WorkspaceChat Component
 * AI assistant chat interface for workspace sessions
 */

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Info } from 'lucide-react'
import ChatMessage from './ChatMessage'
import { sendMessage, suggestNextSteps } from '../../services/workspaceChatService'

export default function WorkspaceChat({ task, project, chatHistory, onChatUpdate }) {
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    }

    // Add user message to history
    const updatedHistory = [...chatHistory, userMessage]
    onChatUpdate(updatedHistory)
    setInputValue('')
    setIsLoading(true)

    try {
      // Get AI response
      const aiResponse = await sendMessage(inputValue.trim(), chatHistory, task, project)

      const aiMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }

      // Add AI response to history
      onChatUpdate([...updatedHistory, aiMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)

      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString()
      }
      onChatUpdate([...updatedHistory, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestedPrompt = (prompt) => {
    setInputValue(prompt)
    inputRef.current?.focus()
  }

  const contextInfo = [
    { label: 'Task', value: task.text },
    { label: 'Status', value: task.status },
    project && { label: 'Project', value: project.title },
    task.context && { label: 'Context', value: task.context }
  ].filter(Boolean)

  return (
    <div className="h-full flex flex-col bg-bg-primary border-l border-border-primary">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-syntax-green animate-pulse"></div>
            <h3 className="text-sm font-semibold text-fg-primary">AI Assistant</h3>
          </div>
          <button
            onClick={() => setShowContext(!showContext)}
            className="p-1 rounded hover:bg-bg-tertiary transition-colors"
            title="Show context"
          >
            <Info size={16} className="text-fg-secondary" />
          </button>
        </div>

        {/* Context Panel */}
        {showContext && (
          <div className="mt-3 p-3 bg-bg-secondary border border-border-primary rounded text-xs">
            <div className="font-semibold text-fg-primary mb-2">AI has context on:</div>
            {contextInfo.map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-1">
                <span className="text-fg-secondary min-w-[60px]">{item.label}:</span>
                <span className="text-fg-primary truncate">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {chatHistory.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-fg-tertiary mb-4">
              <p className="text-sm mb-2">Start a conversation with your AI assistant</p>
              <p className="text-xs">Ask questions, get suggestions, or talk through your approach</p>
            </div>

            {/* Suggested Prompts */}
            <div className="space-y-2 w-full max-w-sm">
              <p className="text-xs font-semibold text-fg-secondary mb-2">Quick starts:</p>
              {[
                suggestNextSteps(task),
                "Help me break this down into steps",
                "What should I focus on first?"
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="w-full px-3 py-2 text-xs text-left text-fg-primary bg-bg-secondary hover:bg-bg-tertiary border border-border-primary rounded transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((message, idx) => (
          <ChatMessage key={idx} message={message} />
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-fg-tertiary text-sm">
            <Loader2 size={16} className="animate-spin" />
            <span>AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border-primary">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            className="flex-1 bg-bg-secondary border border-border-primary rounded px-3 py-2 text-sm text-fg-primary placeholder-fg-tertiary focus:outline-none focus:border-border-focus resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded bg-accent-primary hover:bg-accent-secondary disabled:bg-bg-tertiary disabled:cursor-not-allowed flex items-center justify-center transition-colors self-end"
            title="Send message"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-fg-tertiary mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

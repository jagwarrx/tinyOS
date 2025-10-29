/**
 * ChatMessage Component
 * Displays a single message in the workspace chat
 */

import { User, Bot } from 'lucide-react'

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-syntax-blue' : 'bg-syntax-purple'
        }`}
      >
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Bot size={16} className="text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-syntax-blue text-white'
              : 'bg-bg-secondary border border-border-primary text-fg-primary'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        <span className="text-xs text-fg-tertiary mt-1">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  )
}

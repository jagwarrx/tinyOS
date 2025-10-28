/**
 * Terminal Component
 * 
 * A command-line interface for interacting with the notes app.
 * Provides syntax-highlighted input, command history, and output display.
 * 
 * Features:
 * - Real-time syntax highlighting (colors change as you type complete words)
 * - Command history navigation (up/down arrows)
 * - Collapsible interface
 * - Output display with command/result separation
 * 
 * Syntax Highlighting Colors:
 * - Blue: Commands (add, goto, complete, star)
 * - Green: Entity types (task)
 * - Grey: User content (text in quotes)
 * - White: Connectors (to)
 * - Purple: Targets (today, week, tasks)
 * 
 * @param {function} onCommand - Async callback function to execute commands
 *                               Should return a string result or throw an error
 */

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Terminal as TerminalIcon, ChevronDown, ChevronUp } from 'lucide-react'

const Terminal = forwardRef(({ onCommand }, ref) => {
  // Input state for current command being typed
  const [input, setInput] = useState('')
  
  // History of all commands entered (for up/down navigation)
  const [history, setHistory] = useState([])
  
  // Output display - array of {type: 'command'|'output', text: string}
  const [output, setOutput] = useState([])
  
  // Current position in history when navigating with arrows (-1 = not navigating)
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // Whether terminal is collapsed (minimized)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Loading state for async commands
  const [isLoading, setIsLoading] = useState(false)

  // Refs for input focus and output scrolling
  const inputRef = useRef(null)
  const outputRef = useRef(null)

  // Expose focus and setInput methods to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    },
    setInputValue: (value) => {
      setInput(value)
      inputRef.current?.focus()
    }
  }))

  /**
   * Handle form submission (Enter key pressed)
   * Executes the command and displays results
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!input.trim()) return

    // Save to history for up/down arrow navigation
    setHistory([...history, input])
    setHistoryIndex(-1)

    // Display the command immediately in output
    setOutput(prev => [
      ...prev,
      { type: 'command', text: input }
    ])

    // Clear input and save command for async execution
    const command = input
    setInput('')

    // Show loading indicator
    setIsLoading(true)

    // Execute command asynchronously and display result
    try {
      const result = await onCommand(command)
      setIsLoading(false)
      
      // Add result to output if command returned something
      if (result) {
        setOutput(prev => [
          ...prev,
          { type: 'output', text: String(result) }
        ])
      }
    } catch (error) {
      // Display error message if command failed
      setIsLoading(false)
      console.error('Terminal command error:', error)
      setOutput(prev => [
        ...prev,
        { type: 'output', text: `✗ Error: ${error?.message || 'Unknown error'}` }
      ])
    }

    // Auto-scroll to bottom to show latest output
    setTimeout(() => {
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight
      }
    }, 0)
  }

  /**
   * Handle special key presses (arrow keys for history navigation)
   */
  const handleKeyDown = (e) => {
    // Navigate through command history with up/down arrows
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length === 0) return
      
      // Go backwards in history (older commands)
      const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(newIndex)
      setInput(history[newIndex])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex === -1) return
      
      // Go forwards in history (newer commands)
      const newIndex = historyIndex + 1
      if (newIndex >= history.length) {
        // Reached end of history, clear input
        setHistoryIndex(-1)
        setInput('')
      } else {
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
      }
    }
  }

  /**
   * Syntax highlighting function
   * Colors change only after completing each word (pressing space)
   * 
   * Word positions in "add task 'text' to target" command:
   * - wordIndex 0: command (add, goto, etc.) → Blue
   * - wordIndex 1: entity (task) → Green
   * - wordIndex 2: quoted content → Grey
   * - wordIndex 3: connector (to) → White
   * - wordIndex 4: target (today, week, tasks) → Purple
   * 
   * @param {string} text - The input text to highlight
   * @returns {JSX.Element} - Syntax highlighted text as React elements
   */
  const highlightSyntax = (text) => {
    if (!text) return null

    // Special case: /help command - highlight entirely in blue
    if (text.match(/^\/?help$/i)) {
      return <span className="text-syntax-blue">{text}</span>
    }

    const parts = []
    let position = 0

    // Split by spaces while preserving them for proper reconstruction
    const tokens = text.split(/(\s+)/)
    
    // Track which word we're on (0=command, 1=task, 2=content, 3=to, 4=target)
    let wordIndex = 0
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      
      // Spaces don't count as words, just render them as-is
      if (token.match(/^\s+$/)) {
        parts.push(<span key={position++} className="text-fg-primary">{token}</span>)
        continue
      }

      // Check if this is the last token (being actively typed)
      const isLastToken = i === tokens.length - 1

      // Determine color based on word position in command structure
      let colorClass = 'text-fg-primary'

      if (wordIndex === 0) {
        // First word: command verbs (add, complete, star, goto)
        if (token.match(/^(add|complete|star|goto)$/i) && (!isLastToken || token.length >= 3)) {
          colorClass = 'text-syntax-blue'
        }
      } else if (wordIndex === 1) {
        // Second word: entity type (task)
        if (token.match(/^task$/i) && (!isLastToken || token.length === 4)) {
          colorClass = 'text-syntax-green'
        }
      } else if (wordIndex === 2) {
        // Third word: content in quotes (task description)
        if (token.startsWith('"')) {
          colorClass = 'text-fg-secondary'
        }
      } else if (wordIndex === 3) {
        // Fourth word: connector (to)
        if (token.match(/^to$/i) && (!isLastToken || token.length === 2)) {
          colorClass = 'text-fg-primary'
        }
      } else if (wordIndex === 4) {
        // Fifth word: target destination (today, week, tasks)
        if (token.match(/^(today|week|tasks)$/i)) {
          colorClass = 'text-syntax-purple'
        } else if (isLastToken) {
          // Partial match: show lighter purple while typing
          const partial = token.toLowerCase()
          if ('today'.startsWith(partial) || 'week'.startsWith(partial) || 'tasks'.startsWith(partial)) {
            if (partial.length >= 2) {
              colorClass = 'text-accent-primary' // Theme accent for incomplete
            }
          }
        }
      }

      // Special handling for quoted strings (treat entire quote as one word)
      if (token.startsWith('"')) {
        let quotedContent = token
        let j = i

        // Look ahead to find closing quote if not in current token
        if (!token.endsWith('"') || token.length === 1) {
          while (j < tokens.length - 1 && !tokens[j].endsWith('"')) {
            j++
            quotedContent += tokens[j]
          }
          if (j < tokens.length - 1 && tokens[j + 1].endsWith('"')) {
            j++
            quotedContent += tokens[j]
          }
        }

        parts.push(<span key={position++} className="text-fg-secondary">{quotedContent}</span>)
        i = j // Skip ahead past the quoted content
        wordIndex++ // Count entire quoted string as one word
        continue
      }

      // Add the colored token
      parts.push(<span key={position++} className={colorClass}>{token}</span>)
      wordIndex++ // Move to next word position
    }

    return <>{parts}</>
  }

  // Collapsed state: show minimal bar with expand button
  if (isCollapsed) {
    return (
      <div className="h-12 bg-bg-secondary border-t border-border-primary flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-fg-secondary text-sm">
          <TerminalIcon size={16} />
          <span>Terminal</span>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1 hover:bg-bg-tertiary rounded transition-colors"
        >
          <ChevronUp size={16} className="text-fg-secondary" />
        </button>
      </div>
    )
  }

  // Expanded state: full terminal interface
  return (
    <div className="h-48 bg-bg-secondary border-t border-border-primary flex flex-col">
      {/* Header */}
      <div className="h-10 bg-bg-tertiary border-b border-border-primary flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-fg-secondary text-sm">
          <TerminalIcon size={16} />
          <span>Terminal</span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-bg-secondary rounded transition-colors"
        >
          <ChevronDown size={16} className="text-fg-secondary" />
        </button>
      </div>

      {/* Content */}
      <div ref={outputRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {/* Output history */}
        {output.map((item, idx) => (
          <div key={idx} className={item.type === 'command' ? 'mb-1 text-fg-tertiary' : 'mb-3 text-fg-primary'}>
            {item.type === 'command' ? (
              <>
                <span className="text-syntax-green">→</span> {String(item.text)}
              </>
            ) : (
              <div className="ml-4 whitespace-pre-wrap">{String(item.text)}</div>
            )}
          </div>
        ))}

        {/* Loading indicator - Claude-style wave animation */}
        {isLoading && (
          <div className="ml-4 mb-3 flex items-center gap-2">
            <div className="flex gap-1 items-end">
              <span className="w-2 h-2 bg-accent-primary rounded-full animate-loading-wave" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-accent-primary rounded-full animate-loading-wave" style={{ animationDelay: '200ms' }}></span>
              <span className="w-2 h-2 bg-accent-primary rounded-full animate-loading-wave" style={{ animationDelay: '400ms' }}></span>
            </div>
            <span className="text-fg-tertiary text-xs animate-pulse">Thinking...</span>
          </div>
        )}

        {/* Input line */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <span className="text-syntax-green">→</span>
          <div className="flex-1 relative">
            {/* Hidden input for actual typing */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent outline-none text-fg-primary absolute inset-0"
              style={{ color: 'transparent', caretColor: 'var(--color-fg-primary)' }}
              placeholder="Type /help for commands"
              autoFocus
            />
            {/* Syntax highlighted overlay */}
            <div className="pointer-events-none whitespace-pre">
              {input ? highlightSyntax(input) : (
                <span className="text-fg-tertiary">Type /help for commands</span>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
})

Terminal.displayName = 'Terminal'

export default Terminal
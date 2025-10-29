import { X, Command } from 'lucide-react'

/**
 * KeyboardShortcutsHelp Component
 *
 * Displays a modal with all keyboard shortcuts available in the app.
 * Triggered by pressing '?' key.
 */
export default function KeyboardShortcutsHelp({ isOpen, onClose }) {
  if (!isOpen) return null

  const shortcuts = [
    {
      category: 'Global',
      items: [
        { keys: ['?'], description: 'Show keyboard shortcuts help' },
        { keys: ['Cmd/Ctrl', 'K'], description: 'Open search (coming soon)' },
        { keys: ['Esc'], description: 'Close modals / Clear selection' },
      ]
    },
    {
      category: 'Navigation',
      items: [
        { keys: ['Tab'], description: 'Focus terminal' },
        { keys: ['L'], description: 'Navigate to Log page' },
        { keys: ['←', '→', '↑', '↓'], description: 'Navigate between notes' },
      ]
    },
    {
      category: 'Tasks',
      items: [
        { keys: ['Space'], description: 'Quick task entry (on Tasks/Today pages)' },
        { keys: ['↑', '↓'], description: 'Select previous/next task' },
        { keys: ['Shift', '↑/↓'], description: 'Reorder tasks' },
        { keys: ['→'], description: 'Open task detail panel' },
        { keys: ['←'], description: 'Close task panel / Deselect task' },
        { keys: ['Enter'], description: 'Toggle task completion (in panel)' },
      ]
    },
    {
      category: 'Editor',
      items: [
        { keys: ['Cmd/Ctrl', 'B'], description: 'Bold text' },
        { keys: ['Cmd/Ctrl', 'I'], description: 'Italic text' },
        { keys: ['Cmd/Ctrl', 'U'], description: 'Underline text' },
        { keys: ['Cmd/Ctrl', 'Z'], description: 'Undo' },
        { keys: ['Cmd/Ctrl', 'Shift', 'Z'], description: 'Redo' },
        { keys: ['Cmd/Ctrl', 'K'], description: 'Insert link' },
      ]
    },
    {
      category: 'Terminal Commands',
      items: [
        { keys: ['/task "text"'], description: 'Create task' },
        { keys: ['/task "text" :today'], description: 'Create task scheduled for today' },
        { keys: ['/project "name"'], description: 'Create project' },
        { keys: ['goto home'], description: 'Navigate to home' },
        { keys: ['goto tasks'], description: 'Navigate to tasks page' },
        { keys: ['goto today'], description: 'Navigate to today page' },
        { keys: ['complete task N'], description: 'Mark task N as complete' },
        { keys: ['star task N'], description: 'Star task N' },
        { keys: ['start timer 25'], description: 'Start 25-minute timer' },
        { keys: ['/ask "question"'], description: 'Ask Claude AI' },
      ]
    }
  ]

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-bg-elevated rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-border-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <div className="flex items-center gap-3">
            <Command size={24} className="text-accent-primary" />
            <h2 className="text-xl font-semibold text-fg-primary">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded transition-colors"
            title="Close (Esc)"
          >
            <X size={20} className="text-fg-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-bold uppercase tracking-wide text-fg-tertiary mb-4">
                  {section.category}
                </h3>
                <div className="space-y-3">
                  {section.items.map((shortcut, index) => (
                    <div key={index} className="flex items-start justify-between gap-4">
                      <div className="flex-1 text-sm text-fg-primary">
                        {shortcut.description}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-bg-secondary border border-border-primary rounded text-xs font-mono text-fg-primary shadow-sm">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-fg-tertiary text-xs">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-primary bg-bg-secondary">
          <p className="text-xs text-fg-tertiary text-center">
            Press <kbd className="px-2 py-0.5 bg-bg-tertiary border border-border-primary rounded text-[10px] font-mono">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  )
}

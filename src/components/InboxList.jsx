/**
 * InboxList Component
 *
 * Displays a list of inbox items (notes linked to the Inbox page).
 *
 * Features:
 * - Shows all notes that have left_id pointing to Inbox
 * - Click to open individual inbox item
 * - Shows creation date for each item
 * - Shows count of notes in each "island" (connected cluster)
 * - Empty state when no items
 *
 * @param {object} inboxNote - The Inbox page note
 * @param {Array} allNotes - All notes from notes table
 * @param {function} onItemClick - Callback when inbox item is clicked (note)
 */

import { FileText, Calendar, Network } from 'lucide-react'

export default function InboxList({
  inboxNote,
  allNotes,
  onItemClick
}) {
  // Get all notes that link back to Inbox (left_id = inbox.id)
  const inboxItems = allNotes.filter(note => note.left_id === inboxNote?.id)

  // Sort by creation date (most recent first)
  const sortedItems = [...inboxItems].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at)
  })

  /**
   * Count all notes in an "island" (connected cluster) starting from a root note
   * Traverses up/down/right links but NOT left (left goes back to Inbox)
   *
   * @param {string} startNoteId - ID of the note to start from
   * @returns {number} - Total count of notes in the island
   */
  const countNotesInIsland = (startNoteId) => {
    const visited = new Set()
    const queue = [startNoteId]

    while (queue.length > 0) {
      const currentId = queue.shift()

      // Skip if already visited
      if (visited.has(currentId)) continue

      // Mark as visited
      visited.add(currentId)

      // Find the note
      const note = allNotes.find(n => n.id === currentId)
      if (!note) continue

      // Add linked notes to queue (up, down, right - NOT left)
      if (note.up_id && !visited.has(note.up_id)) {
        queue.push(note.up_id)
      }
      if (note.down_id && !visited.has(note.down_id)) {
        queue.push(note.down_id)
      }
      if (note.right_id && !visited.has(note.right_id)) {
        queue.push(note.right_id)
      }
    }

    return visited.size
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return 'Today'
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  // Empty state - only show if there are truly no notes (tasks are shown separately in NoteEditor)
  if (!sortedItems || sortedItems.length === 0) {
    return (
      <div className="p-8 text-center text-fg-tertiary">
        <FileText size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">No inbox notes yet</p>
        <p className="text-xs mt-2">Use /inbox "title" to capture quick notes</p>
      </div>
    )
  }

  return (
    <div className="inbox-list-container p-6">
      {/* Section header for inbox notes */}
      {sortedItems.length > 0 && (
        <h3 className="inbox-header text-sm font-semibold text-fg-secondary mb-4 uppercase tracking-wider">
          Inbox Notes ({sortedItems.length})
        </h3>
      )}

      {/* List of inbox items */}
      <div className="inbox-items-list space-y-2">
        {sortedItems.map((item) => {
          const noteCount = countNotesInIsland(item.id)

          return (
            <div
              key={item.id}
              onClick={() => onItemClick(item)}
              className="inbox-item bg-bg-elevated border border-border-primary rounded-lg p-4 hover:shadow-md hover:border-border-focus transition-all cursor-pointer group"
            >
              {/* Item title with note count */}
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-base font-medium text-fg-primary group-hover:text-accent-primary transition-colors flex-1">
                  {item.title || 'Untitled'}
                </h3>
                {noteCount > 1 && (
                  <span className="inbox-note-count flex items-center gap-1 text-xs text-accent-primary bg-accent-primary/10 border border-accent-primary/30 px-2 py-0.5 rounded font-bold">
                    <Network size={11} />
                    {noteCount}
                  </span>
                )}
              </div>

              {/* Creation date */}
              <div className="inbox-metadata flex items-center gap-2 text-xs text-fg-secondary">
                <Calendar size={12} />
                <span>{formatDate(item.created_at)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

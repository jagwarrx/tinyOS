import { Plus, FileText, Home, Star } from 'lucide-react'

export default function NotesList({ 
  notes,           // from context
  selectedNote,    // from context
  homeNote,        // from context
  onSelectNote,    // callback
  onCreateNote,    // callback
  onGoHome,        // callback
  onToggleStar     // callback
}) {
  const getPreview = (content) => {
    try {
      const parsed = JSON.parse(content)
      const firstParagraph = parsed?.root?.children?.[0]?.children?.[0]?.text || ''
      return firstParagraph.slice(0, 80) + (firstParagraph.length > 80 ? '...' : '')
    } catch {
      return 'Empty note'
    }
  }

  // Filter: show HOME + starred notes only
  const starredNotes = notes.filter(n => !n.is_home && n.is_starred)

  return (
    <div className="w-72 h-screen bg-bg-secondary flex flex-col border-r border-border-primary">
      <div className="p-4 border-b border-border-primary flex justify-between items-center">
        <h2 className="text-lg font-medium text-fg-primary">Notes</h2>
        <button
          onClick={onCreateNote}
          className="p-2 text-fg-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
          title="New Note"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* HOME Note */}
      {homeNote && (
        <div className="border-b border-border-primary">
          <div
            className={`p-3 cursor-pointer transition-colors group ${
              selectedNote?.id === homeNote.id
                ? 'bg-bg-tertiary'
                : 'hover:bg-bg-tertiary/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Home size={14} className="text-fg-tertiary" />
              <button
                onClick={(e) => onSelectNote(homeNote, e.shiftKey)}
                className="font-medium text-sm text-fg-primary flex-1 text-left"
                title="Click to open | Shift+Click for side-by-side"
              >
                {homeNote.title || 'HOME'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleStar(homeNote.id)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title="Unstar (hides from sidebar)"
              >
                <Star
                  size={14}
                  className={homeNote.is_starred ? 'fill-syntax-yellow text-syntax-yellow' : 'text-fg-tertiary'}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {starredNotes.length === 0 ? (
          <div className="p-8 text-center text-fg-tertiary">
            <Star size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No starred notes</p>
            <p className="text-xs mt-2">Star notes to pin them here</p>
          </div>
        ) : (
          starredNotes.map((note) => {
            const isSelected = selectedNote?.id === note.id

            return (
              <div
                key={note.id}
                className={`p-3 border-b border-border-secondary cursor-pointer transition-colors group ${
                  isSelected
                    ? 'bg-bg-tertiary'
                    : 'hover:bg-bg-tertiary/50'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <button
                    onClick={(e) => onSelectNote(note, e.shiftKey)}
                    className="font-medium text-sm flex-1 text-left text-fg-primary"
                    title="Click to open | Shift+Click for side-by-side"
                  >
                    {note.title || 'Untitled'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleStar(note.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    title="Unstar (hides from sidebar)"
                  >
                    <Star
                      size={14}
                      className="fill-syntax-yellow text-syntax-yellow"
                    />
                  </button>
                </div>

                <div className="text-xs text-fg-secondary line-clamp-2">
                  {getPreview(note.content)}
                </div>

                <div className="text-xs text-fg-tertiary mt-1.5">
                  {new Date(note.updated_at).toLocaleDateString()}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
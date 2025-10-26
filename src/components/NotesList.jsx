import { Plus, FileText } from 'lucide-react'

export default function NotesList({ notes, onSelectNote, onCreateNote }) {
  const getPreview = (content) => {
    try {
      const parsed = JSON.parse(content)
      const firstParagraph = parsed?.root?.children?.[0]?.children?.[0]?.text || ''
      return firstParagraph.slice(0, 100) + (firstParagraph.length > 100 ? '...' : '')
    } catch {
      return 'Empty note'
    }
  }

  return (
    <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Notes</h2>
          <button
            onClick={onCreateNote}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title="New Note"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No notes yet</p>
            <p className="text-sm mt-2">Click + to create your first note</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note)}
              className="p-4 border-b border-gray-200 cursor-pointer hover:bg-white transition-colors"
            >
              <div className="font-medium text-sm mb-1">
                {note.title || 'Untitled'}
              </div>
              <div className="text-xs text-gray-500 line-clamp-2">
                {getPreview(note.content)}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {new Date(note.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

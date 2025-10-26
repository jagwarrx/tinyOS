import { useState, useEffect } from 'react'
import Editor from './Editor'
import { Save, Trash2 } from 'lucide-react'

export default function NoteEditor({ note, onSave, onDelete }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (note) {
      setTitle(note.title || '')
      setContent(note.content || '')
    } else {
      setTitle('')
      setContent('')
    }
  }, [note])

  const handleSave = async () => {
    if (!note) return
    setIsSaving(true)
    await onSave({ ...note, title, content })
    setIsSaving(false)
  }

  const handleDelete = async () => {
    if (!note) return
    if (window.confirm('Are you sure you want to delete this note?')) {
      await onDelete(note.id)
    }
  }

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg">Select a note or create a new one</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="text-2xl font-semibold outline-none flex-1"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <Editor
          initialContent={content}
          onChange={setContent}
        />
      </div>
    </div>
  )
}

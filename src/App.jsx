import { useState, useEffect } from 'react'
import NotesList from './components/NotesList'
import NoteEditor from './components/NoteEditor'
import { supabase } from './supabaseClient'

function App() {
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch notes on mount
  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error.message)
      alert('Error loading notes. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const createNote = async () => {
    try {
      const newNote = {
        title: 'Untitled',
        content: JSON.stringify({
          root: {
            children: [
              {
                children: [],
                direction: null,
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        }),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([newNote])
        .select()

      if (error) throw error
      if (data && data[0]) {
        setNotes([data[0], ...notes])
        setSelectedNote(data[0])
      }
    } catch (error) {
      console.error('Error creating note:', error.message)
      alert('Error creating note. Check console for details.')
    }
  }

  const saveNote = async (updatedNote) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: updatedNote.title,
          content: updatedNote.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedNote.id)

      if (error) throw error

      // Update local state
      setNotes(notes.map(note => 
        note.id === updatedNote.id 
          ? { ...note, ...updatedNote, updated_at: new Date().toISOString() }
          : note
      ))
      setSelectedNote({ ...updatedNote, updated_at: new Date().toISOString() })
    } catch (error) {
      console.error('Error saving note:', error.message)
      alert('Error saving note. Check console for details.')
    }
  }

  const deleteNote = async (noteId) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      setNotes(notes.filter(note => note.id !== noteId))
      setSelectedNote(null)
    } catch (error) {
      console.error('Error deleting note:', error.message)
      alert('Error deleting note. Check console for details.')
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading notes...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex">
      <NotesList
        notes={notes}
        onSelectNote={setSelectedNote}
        onCreateNote={createNote}
      />
      <NoteEditor
        note={selectedNote}
        onSave={saveNote}
        onDelete={deleteNote}
      />
    </div>
  )
}

export default App

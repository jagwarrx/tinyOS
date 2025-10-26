import { useState, useEffect } from 'react'
import { NotesProvider, useNotes } from './contexts/NotesContext'
import NotesList from './NotesList'
import NoteEditor from './NoteEditor'
import { Menu, Sun, Moon, Home } from 'lucide-react'

function AppContent() {
  const {
    notes,
    selectedNote,
    homeNote,
    loading,
    selectNote,
    createNote,
    createDraftLinkedNote,  // ← Added
    updateNote,              // ← Added
    deleteNote,              // ← Added
    setAsHome,               // ← Added
    toggleStar,
    setLink,                 // ← Added
    removeLink,              // ← Added
    navigateToNote,          // ← Added
    goToHome,
  } = useNotes()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleSelectNote = (note) => {
    selectNote(note)
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const handleGoHome = () => {
    goToHome()
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-gray-400">Loading notes...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900">
      {/* Control Panel */}
      <div className="fixed top-6 left-6 z-50 flex gap-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Toggle sidebar"
        >
          <Menu size={18} className="text-gray-600 dark:text-gray-400" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun size={18} className="text-yellow-500" />
          ) : (
            <Moon size={18} className="text-gray-600" />
          )}
        </button>

        <button
          onClick={handleGoHome}
          className="p-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
          title="Go to HOME"
        >
          <Home size={18} />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NotesList
          notes={notes}
          selectedNote={selectedNote}
          homeNote={homeNote}
          onSelectNote={handleSelectNote}
          onCreateNote={createNote}
          onGoHome={handleGoHome}
          onToggleStar={toggleStar}
        />
      </div>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-10 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex justify-center items-center overflow-hidden p-8 md:p-16">
        <div className="w-full max-w-3xl h-full max-h-[700px]">
          <NoteEditor 
            note={selectedNote} 
            allNotes={notes}
            onSave={(note) => updateNote(note.id, { title: note.title, content: note.content })}
            onDelete={deleteNote}
            onSetAsHome={setAsHome}
            onToggleStar={toggleStar}
            onSetUp={(sourceId, targetId) => setLink(sourceId, targetId, 'up')}
            onSetDown={(sourceId, targetId) => setLink(sourceId, targetId, 'down')}
            onSetLeft={(sourceId, targetId) => setLink(sourceId, targetId, 'left')}
            onSetRight={(sourceId, targetId) => setLink(sourceId, targetId, 'right')}
            onRemoveUp={(sourceId) => removeLink(sourceId, 'up')}
            onRemoveDown={(sourceId) => removeLink(sourceId, 'down')}
            onRemoveLeft={(sourceId) => removeLink(sourceId, 'left')}
            onRemoveRight={(sourceId) => removeLink(sourceId, 'right')}
            onNavigate={navigateToNote}
            onCreateDraftLinked={createDraftLinkedNote}  // ← THIS IS THE KEY LINE!
          />
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <NotesProvider>
      <AppContent />
    </NotesProvider>
  )
}

export default App
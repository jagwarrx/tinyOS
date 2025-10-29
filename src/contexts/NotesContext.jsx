import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { NotesService } from '../services/notesService'

const NotesContext = createContext()

const notesReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_NOTES':
      return { ...state, notes: action.payload, loading: false }

    case 'SET_SELECTED':
      return { ...state, selectedNote: action.payload }

    case 'SET_SECONDARY':
      return { ...state, secondaryNote: action.payload }

    case 'SET_HOME':
      return { ...state, homeNote: action.payload }

    case 'SET_SPECIAL_NOTES':
      return {
        ...state,
        tasksNote: action.payload.tasksNote,
        todayNote: action.payload.todayNote,
        weekNote: action.payload.weekNote,
        projectsNote: action.payload.projectsNote,
        inboxNote: action.payload.inboxNote,
        somedayNote: action.payload.somedayNote,
        logNote: action.payload.logNote
      }

    case 'ADD_NOTE':
      return {
        ...state,
        notes: [action.payload, ...state.notes]
      }

    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(n =>
          n.id === action.payload.id ? { ...n, ...action.payload } : n
        ),
        selectedNote: state.selectedNote?.id === action.payload.id
          ? { ...state.selectedNote, ...action.payload }
          : state.selectedNote,
        secondaryNote: state.secondaryNote?.id === action.payload.id
          ? { ...state.secondaryNote, ...action.payload }
          : state.secondaryNote,
        homeNote: state.homeNote?.id === action.payload.id
          ? { ...state.homeNote, ...action.payload }
          : state.homeNote
      }

    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter(n => n.id !== action.payload),
        selectedNote: state.selectedNote?.id === action.payload ? null : state.selectedNote,
        secondaryNote: state.secondaryNote?.id === action.payload ? null : state.secondaryNote
      }

    default:
      return state
  }
}

export function NotesProvider({ children }) {
  const [state, dispatch] = useReducer(notesReducer, {
    notes: [],
    selectedNote: null,
    secondaryNote: null,
    homeNote: null,
    tasksNote: null,
    todayNote: null,
    weekNote: null,
    projectsNote: null,
    inboxNote: null,
    somedayNote: null,
    logNote: null,
    loading: true
  })

  // Fetch all notes
  const fetchNotes = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const notes = await NotesService.fetchAll()
      dispatch({ type: 'SET_NOTES', payload: notes })

      // Set home note
      const home = notes.find(n => n.is_home === true)
      if (home) {
        dispatch({ type: 'SET_HOME', payload: home })
      }

      // Set special notes
      const tasks = notes.find(n => n.title === 'Tasks' && n.note_type === 'task_list')
      const today = notes.find(n => n.title === 'Today' && n.list_metadata?.type === 'today')
      const week = notes.find(n => n.title === 'Week' && n.list_metadata?.type === 'week')
      const projects = notes.find(n => n.title === 'Projects' && n.note_type === 'project_list')
      const inbox = notes.find(n => n.title === 'Inbox')
      const someday = notes.find(n => n.title === 'Someday' && n.list_metadata?.type === 'someday')
      const log = notes.find(n => n.title === 'Log' && n.note_type === 'log_list')

      dispatch({
        type: 'SET_SPECIAL_NOTES',
        payload: {
          tasksNote: tasks,
          todayNote: today,
          weekNote: week,
          projectsNote: projects,
          inboxNote: inbox,
          somedayNote: someday,
          logNote: log
        }
      })

      return notes
    } catch (error) {
      console.error('Error fetching notes:', error.message)
      dispatch({ type: 'SET_LOADING', payload: false })
      throw error
    }
  }, [])

  // Create a new note
  const createNote = useCallback(async (noteData = {}) => {
    try {
      const newNote = {
        title: 'Untitled',
        content: NotesService.getEmptyContent(),
        up_id: null,
        down_id: null,
        left_id: null,
        right_id: null,
        is_home: false,
        is_starred: true,
        updated_at: new Date().toISOString(),
        ...noteData
      }

      const created = await NotesService.create(newNote)
      dispatch({ type: 'ADD_NOTE', payload: created })
      dispatch({ type: 'SET_SELECTED', payload: created })
      
      return created
    } catch (error) {
      console.error('Error creating note:', error.message)
      throw error
    }
  }, [])

  // Create a draft linked note
  const createDraftLinkedNote = useCallback(async (sourceNote, linkType) => {
    try {
      const draftNote = {
        title: '',
        content: NotesService.getEmptyContent(),
        is_starred: true,
      }

      const newNote = await NotesService.create(draftNote)
      
      // Create the link
      await NotesService.setLink(sourceNote.id, newNote.id, linkType)
      
      // Refresh notes to get updated links
      await fetchNotes()
      
      // Fetch the newly created note with its updated links
      const updatedNewNote = await NotesService.fetchById(newNote.id)
      dispatch({ type: 'SET_SELECTED', payload: updatedNewNote })
      
      return updatedNewNote
    } catch (error) {
      console.error('Error creating draft note:', error.message)
      throw error
    }
  }, [fetchNotes])

  // Update a note
  const updateNote = useCallback(async (noteId, updates) => {
    try {
      // Check if note is empty and should be deleted
      const isEmpty = !updates.title?.trim() && NotesService.isContentEmpty(updates.content)
      const note = state.notes.find(n => n.id === noteId)
      const hasLinks = note && (note.up_id || note.down_id || note.left_id || note.right_id)
      
      // Don't auto-delete notes that have links or are HOME
      if (isEmpty && note && !note.is_home && !hasLinks) {
        await deleteNote(noteId)
        return
      }

      // Optimistic update
      dispatch({ type: 'UPDATE_NOTE', payload: { id: noteId, ...updates } })
      
      const updated = await NotesService.update(noteId, updates)
      dispatch({ type: 'UPDATE_NOTE', payload: updated })
      
      return updated
    } catch (error) {
      // Rollback on error
      console.error('Error updating note:', error.message)
      await fetchNotes()
      throw error
    }
  }, [state.notes])

  // Delete a note
  const deleteNote = useCallback(async (noteId) => {
    try {
      const note = state.notes.find(n => n.id === noteId)
      
      if (note?.is_home) {
        throw new Error('Cannot delete HOME note')
      }

      await NotesService.delete(noteId)
      dispatch({ type: 'DELETE_NOTE', payload: noteId })
      
      // Refresh to get updated links
      await fetchNotes()
    } catch (error) {
      console.error('Error deleting note:', error.message)
      throw error
    }
  }, [state.notes, fetchNotes])

  // Set a note as home
  const setAsHome = useCallback(async (noteId) => {
    try {
      const updated = await NotesService.setAsHome(noteId)
      
      // Refresh notes to update home status
      await fetchNotes()
      
      // Update selected note if it's the one we just set as home
      if (state.selectedNote?.id === noteId) {
        const updatedNote = await NotesService.fetchById(noteId)
        dispatch({ type: 'SET_SELECTED', payload: updatedNote })
      }
      
      return updated
    } catch (error) {
      console.error('Error setting home note:', error.message)
      throw error
    }
  }, [state.selectedNote, fetchNotes])

  // Toggle star status
  const toggleStar = useCallback(async (noteId) => {
    try {
      const updated = await NotesService.toggleStar(noteId)
      dispatch({ type: 'UPDATE_NOTE', payload: updated })
      
      return updated
    } catch (error) {
      console.error('Error toggling star:', error.message)
      throw error
    }
  }, [])

  // Set a link between notes
  const setLink = useCallback(async (sourceId, targetId, direction) => {
    try {
      await NotesService.setLink(sourceId, targetId, direction)
      await fetchNotes()
      
      // Update selected note if it's the source
      if (state.selectedNote?.id === sourceId) {
        const updated = await NotesService.fetchById(sourceId)
        dispatch({ type: 'SET_SELECTED', payload: updated })
      }
    } catch (error) {
      console.error('Error setting link:', error.message)
      throw error
    }
  }, [state.selectedNote, fetchNotes])

  // Remove a link
  const removeLink = useCallback(async (sourceId, direction) => {
    try {
      await NotesService.removeLink(sourceId, direction)
      await fetchNotes()
      
      // Update selected note if it's the source
      if (state.selectedNote?.id === sourceId) {
        const updated = await NotesService.fetchById(sourceId)
        dispatch({ type: 'SET_SELECTED', payload: updated })
      }
    } catch (error) {
      console.error('Error removing link:', error.message)
      throw error
    }
  }, [state.selectedNote, fetchNotes])

  // Navigate to a note
  const navigateToNote = useCallback(async (noteId) => {
    if (!noteId) return
    
    const note = state.notes.find(n => n.id === noteId)
    
    if (note) {
      dispatch({ type: 'SET_SELECTED', payload: note })
    } else {
      // Fetch if not in current list
      try {
        const fetchedNote = await NotesService.fetchById(noteId)
        dispatch({ type: 'SET_SELECTED', payload: fetchedNote })
      } catch (error) {
        console.error('Error navigating to note:', error.message)
      }
    }
  }, [state.notes])

  // Select a note
  const selectNote = useCallback((note) => {
    dispatch({ type: 'SET_SELECTED', payload: note })
  }, [])

  // Go to home note
  const goToHome = useCallback(() => {
    if (state.homeNote) {
      dispatch({ type: 'SET_SELECTED', payload: state.homeNote })
    }
  }, [state.homeNote])

  // Set secondary note (for side-by-side view)
  const setSecondaryNote = useCallback((note) => {
    dispatch({ type: 'SET_SECONDARY', payload: note })
  }, [])

  // Navigate to special notes
  const goToTasks = useCallback(() => {
    if (state.tasksNote) {
      dispatch({ type: 'SET_SELECTED', payload: state.tasksNote })
    }
  }, [state.tasksNote])

  const goToToday = useCallback(() => {
    if (state.todayNote) {
      dispatch({ type: 'SET_SELECTED', payload: state.todayNote })
    }
  }, [state.todayNote])

  const goToWeek = useCallback(() => {
    if (state.weekNote) {
      dispatch({ type: 'SET_SELECTED', payload: state.weekNote })
    }
  }, [state.weekNote])

  const goToProjects = useCallback(() => {
    if (state.projectsNote) {
      dispatch({ type: 'SET_SELECTED', payload: state.projectsNote })
    }
  }, [state.projectsNote])

  const goToInbox = useCallback(() => {
    if (state.inboxNote) {
      dispatch({ type: 'SET_SELECTED', payload: state.inboxNote })
    }
  }, [state.inboxNote])

  const goToSomeday = useCallback(() => {
    if (state.somedayNote) {
      dispatch({ type: 'SET_SELECTED', payload: state.somedayNote })
    }
  }, [state.somedayNote])

  const goToLog = useCallback(() => {
    if (state.logNote) {
      dispatch({ type: 'SET_SELECTED', payload: state.logNote })
    }
  }, [state.logNote])

  // Initialize - fetch notes on mount
  useEffect(() => {
    fetchNotes().catch(error => {
      console.error('Failed to initialize notes:', error)
    })
  }, [fetchNotes])

  // Ensure home note exists
  useEffect(() => {
    const ensureHomeNote = async () => {
      if (state.notes.length > 0 && !state.homeNote) {
        try {
          const created = await NotesService.createHomeNote()
          await fetchNotes()
          dispatch({ type: 'SET_HOME', payload: created })
          
          if (!state.selectedNote) {
            dispatch({ type: 'SET_SELECTED', payload: created })
          }
        } catch (error) {
          console.error('Error creating home note:', error)
        }
      } else if (state.homeNote && !state.selectedNote) {
        dispatch({ type: 'SET_SELECTED', payload: state.homeNote })
      }
    }

    if (!state.loading) {
      ensureHomeNote()
    }
  }, [state.notes.length, state.homeNote, state.selectedNote, state.loading, fetchNotes])

  const value = {
    ...state,
    fetchNotes,
    createNote,
    createDraftLinkedNote,
    updateNote,
    deleteNote,
    setAsHome,
    toggleStar,
    setLink,
    removeLink,
    navigateToNote,
    selectNote,
    setSecondaryNote,
    goToHome,
    goToTasks,
    goToToday,
    goToWeek,
    goToProjects,
    goToInbox,
    goToSomeday,
    goToLog,
  }

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}

export const useNotes = () => {
  const context = useContext(NotesContext)
  if (!context) {
    throw new Error('useNotes must be used within NotesProvider')
  }
  return context
}
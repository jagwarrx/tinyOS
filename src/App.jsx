/**
 * App Component - Main Application Container
 * 
 * Central state management and orchestration for the notes application.
 * Handles all CRUD operations, task management, navigation, and terminal commands.
 * 
 * Key Features:
 * - Notes CRUD operations with Supabase backend
 * - Task management system (Tasks, Today, Week)
 * - Optimistic UI updates for instant feedback
 * - Terminal command processing
 * - Bidirectional note linking (up/down/left/right)
 * - Theme switching (light/dark)
 * - Sidebar navigation
 * 
 * State Management:
 * - notes: All notes from database
 * - selectedNote: Currently viewed note
 * - homeNote: Special HOME note reference
 * - tasksNote, todayNote, weekNote: Special task list notes
 * - theme: Current theme ('light' or 'dark')
 * - sidebarOpen: Sidebar visibility (mobile)
 * 
 * Special Notes:
 * - HOME: Main entry point (is_home: true)
 * - Tasks: Master list of all tasks
 * - Today: Filtered list (starred tasks only)
 * - Week: Filtered list (uncompleted tasks)
 * 
 * Database Schema:
 * notes table columns:
 * - id, title, content, note_type, list_metadata
 * - up_id, down_id, left_id, right_id (navigation links)
 * - is_home, is_starred, updated_at
 */

import { useState, useEffect } from 'react'
import NotesList from './components/NotesList'
import NoteEditor from './components/NoteEditor'
import Terminal from './components/Terminal'
import Timer from './components/Timer'
import TaskDetail from './components/TaskDetail'
import { supabase } from './supabaseClient'
import { Menu, Sun, Moon, Home } from 'lucide-react'
import {
  parseCommand,
  createTaskListContent
} from './utils/commandParser'

function App() {
  // Core state: all notes and current selection
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [secondaryNote, setSecondaryNote] = useState(null) // For side-by-side view

  // Special notes references
  const [homeNote, setHomeNote] = useState(null)
  const [tasksNote, setTasksNote] = useState(null)
  const [todayNote, setTodayNote] = useState(null)
  const [weekNote, setWeekNote] = useState(null)
  const [somedayNote, setSomedayNote] = useState(null)

  // Tasks state (from tasks table)
  const [currentTasks, setCurrentTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null) // For task detail panel
  const [statusFilter, setStatusFilter] = useState([]) // Array of status values to filter by

  // UI state
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return 'light' // Default to light theme
  })

  // Timer state
  const [timerConfig, setTimerConfig] = useState(null)
  const [sessionContext, setSessionContext] = useState('')
  const [isTimerMinimized, setIsTimerMinimized] = useState(false)
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0)
  const [isTimerPaused, setIsTimerPaused] = useState(false)

  // Apply theme changes to document
  // Apply theme changes to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Initial data fetch on mount
  useEffect(() => {
    fetchNotes()
  }, [])

  /**
   * Initialize special notes (HOME, Tasks, Today, Week, Someday/Maybe)
   * Runs whenever notes array changes
   */
  useEffect(() => {
    const setupTaskNoteLinks = async (tasks, today, week, someday) => {
      if (!tasks || !today || !week || !someday) return

      try {
        // Check if links already exist (check the full chain)
        if (today.left_id === tasks.id &&
            today.right_id === week.id &&
            week.right_id === someday.id) {
          return // Already linked
        }

        // Link: Tasks <-> Today <-> Week <-> Someday/Maybe

        // Set Tasks' right to Today
        await supabase
          .from('notes')
          .update({ right_id: today.id })
          .eq('id', tasks.id)

        // Set Today's left to Tasks and right to Week
        await supabase
          .from('notes')
          .update({ left_id: tasks.id, right_id: week.id })
          .eq('id', today.id)

        // Set Week's left to Today and right to Someday
        await supabase
          .from('notes')
          .update({ left_id: today.id, right_id: someday.id })
          .eq('id', week.id)

        // Set Someday's left to Week
        await supabase
          .from('notes')
          .update({ left_id: week.id })
          .eq('id', someday.id)

        await fetchNotes()
      } catch (error) {
        console.error('Error linking task notes:', error.message)
      }
    }

    if (notes.length > 0) {
      const home = notes.find(n => n.is_home === true)
      const tasks = notes.find(n => n.note_type === 'task_list' && n.title === 'Tasks')
      const today = notes.find(n => n.note_type === 'task_list' && n.title === 'Today')
      const week = notes.find(n => n.note_type === 'task_list' && n.title === 'Week')
      const someday = notes.find(n => n.note_type === 'task_list' && n.title === 'Someday/Maybe')

      if (home) {
        setHomeNote(home)
        if (!selectedNote) {
          setSelectedNote(home)
        }
      } else {
        createHomeNote()
      }

      // Set task notes
      setTasksNote(tasks)
      setTodayNote(today)
      setWeekNote(week)
      setSomedayNote(someday)

      // Create task notes if they don't exist
      if (!tasks || !today || !week || !someday) {
        createTaskNotes()
      } else {
        // Link task notes if all exist
        setupTaskNoteLinks(tasks, today, week, someday)
      }
    }
  }, [notes, selectedNote])

  /**
   * Fetch all notes from Supabase
   * Ordered by updated_at (most recent first)
   */
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

  /**
   * Create the initial HOME note if it doesn't exist
   * HOME note serves as the main entry point
   */
  const createHomeNote = async () => {
    try {
      const homeNoteData = {
        title: 'HOME',
        content: JSON.stringify({
          root: {
            children: [
              {
                children: [
                  {
                    text: 'Welcome to your knowledge base!',
                    type: 'text',
                  }
                ],
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
        up_id: null,
        down_id: null,
        left_id: null,
        right_id: null,
        is_home: true,
        is_starred: true,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([homeNoteData])
        .select()

      if (error) throw error
      if (data && data[0]) {
        await fetchNotes()
        setHomeNote(data[0])
        setSelectedNote(data[0])
      }
    } catch (error) {
      console.error('Error creating home note:', error.message)
    }
  }

  const createTaskNotes = async () => {
    try {
      const taskNotes = []

      if (!tasksNote) {
        taskNotes.push({
          title: 'Tasks',
          content: createTaskListContent([]),
          note_type: 'task_list',
          is_starred: true,
          is_home: false,
          up_id: null,
          down_id: null,
          left_id: null,
          right_id: null,
          updated_at: new Date().toISOString(),
        })
      }

      if (!todayNote) {
        taskNotes.push({
          title: 'Today',
          content: createTaskListContent([]),
          note_type: 'task_list',
          is_starred: true,
          is_home: false,
          up_id: null,
          down_id: null,
          left_id: null,
          right_id: null,
          updated_at: new Date().toISOString(),
        })
      }

      if (!weekNote) {
        taskNotes.push({
          title: 'Week',
          content: createTaskListContent([]),
          note_type: 'task_list',
          is_starred: true,
          is_home: false,
          up_id: null,
          down_id: null,
          left_id: null,
          right_id: null,
          updated_at: new Date().toISOString(),
        })
      }

      if (!somedayNote) {
        taskNotes.push({
          title: 'Someday/Maybe',
          content: createTaskListContent([]),
          note_type: 'task_list',
          is_starred: true,
          is_home: false,
          up_id: null,
          down_id: null,
          left_id: null,
          right_id: null,
          updated_at: new Date().toISOString(),
        })
      }

      if (taskNotes.length > 0) {
        const { error } = await supabase
          .from('notes')
          .insert(taskNotes)

        if (error) throw error
        await fetchNotes()
      }
    } catch (error) {
      console.error('Error creating task notes:', error.message)
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
        up_id: null,
        down_id: null,
        left_id: null,
        right_id: null,
        is_home: false,
        is_starred: true, // Star new notes by default
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

  const createDraftLinkedNote = async (sourceNote, linkType) => {
    try {
      const draftNote = {
        title: '',
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
        up_id: null,
        down_id: null,
        left_id: null,
        right_id: null,
        is_home: false,
        is_starred: true,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([draftNote])
        .select()

      if (error) throw error
      
      if (data && data[0]) {
        const newNote = data[0]
        
        // Create the link
        if (linkType === 'up') {
          await setUpLink(sourceNote.id, newNote.id)
        } else if (linkType === 'down') {
          await setDownLink(sourceNote.id, newNote.id)
        } else if (linkType === 'left') {
          await setLeftLink(sourceNote.id, newNote.id)
        } else if (linkType === 'right') {
          await setRightLink(sourceNote.id, newNote.id)
        }
        
        // Refresh all notes to get updated links
        await fetchNotes()
        
        // Fetch the newly created note with its updated links
        const { data: updatedNewNote } = await supabase
          .from('notes')
          .select('*')
          .eq('id', newNote.id)
          .single()
        
        if (updatedNewNote) {
          setSelectedNote(updatedNewNote)
        } else {
          setSelectedNote(newNote)
        }
        
        return updatedNewNote || newNote
      }
    } catch (error) {
      console.error('Error creating draft note:', error.message)
      alert('Error creating draft note. Check console.')
    }
  }

  const saveNote = async (updatedNote) => {
    try {
      const isEmpty = !updatedNote.title.trim() && isContentEmpty(updatedNote.content)
      
      if (isEmpty && !updatedNote.is_home) {
        await deleteNote(updatedNote.id)
        return
      }

      const { error } = await supabase
        .from('notes')
        .update({
          title: updatedNote.title,
          content: updatedNote.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedNote.id)

      if (error) throw error

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

  const isContentEmpty = (content) => {
    try {
      const parsed = JSON.parse(content)
      const firstChild = parsed?.root?.children?.[0]
      
      if (!firstChild || !firstChild.children || firstChild.children.length === 0) {
        return true
      }
      
      const hasText = firstChild.children.some(child => 
        child.text && child.text.trim().length > 0
      )
      
      return !hasText
    } catch {
      return true
    }
  }

  const deleteNote = async (noteId) => {
    try {
      const noteToDelete = notes.find(n => n.id === noteId)
      if (!noteToDelete) return
      
      if (noteToDelete.is_home) {
        alert('Cannot delete HOME note')
        return
      }

      // Clean up bidirectional links before deleting
      // If this note has an up_id, remove the down_id from the up note
      if (noteToDelete.up_id) {
        await supabase
          .from('notes')
          .update({ down_id: null })
          .eq('id', noteToDelete.up_id)
      }

      // If this note has a down_id, remove the up_id from the down note
      if (noteToDelete.down_id) {
        await supabase
          .from('notes')
          .update({ up_id: null })
          .eq('id', noteToDelete.down_id)
      }

      // Clean up any remaining references where other notes point to this note
      // (bidirectional links should already be cleaned, but this ensures consistency)
      await supabase
        .from('notes')
        .update({ up_id: null })
        .eq('up_id', noteId)
      
      await supabase
        .from('notes')
        .update({ down_id: null })
        .eq('down_id', noteId)
      
      await supabase
        .from('notes')
        .update({ left_id: null })
        .eq('left_id', noteId)
      
      await supabase
        .from('notes')
        .update({ right_id: null })
        .eq('right_id', noteId)

      // Now delete the note
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      // Refresh notes to get updated state
      await fetchNotes()
      setSelectedNote(null)
    } catch (error) {
      console.error('Error deleting note:', error.message)
      alert('Error deleting note. Check console for details.')
    }
  }

  const setAsHome = async (noteId) => {
    try {
      // First, unset any existing home note
      const currentHome = notes.find(n => n.is_home === true)
      if (currentHome) {
        const { error: unsetError } = await supabase
          .from('notes')
          .update({ is_home: false })
          .eq('id', currentHome.id)

        if (unsetError) throw unsetError
      }

      // Set the new home note
      const { error } = await supabase
        .from('notes')
        .update({ is_home: true })
        .eq('id', noteId)

      if (error) throw error

      // Refresh notes
      await fetchNotes()
      
      // Update selected note if it's the one we just set as home
      if (selectedNote?.id === noteId) {
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('id', noteId)
          .single()
        
        if (data) setSelectedNote(data)
      }
    } catch (error) {
      console.error('Error setting home note:', error.message)
      alert('Error setting home note. Check console.')
    }
  }

  const toggleStar = async (noteId) => {
    try {
      const note = notes.find(n => n.id === noteId)
      if (!note) return

      const { error } = await supabase
        .from('notes')
        .update({ is_starred: !note.is_starred })
        .eq('id', noteId)

      if (error) throw error

      // Update local state
      setNotes(notes.map(n => 
        n.id === noteId 
          ? { ...n, is_starred: !n.is_starred }
          : n
      ))

      // Update selected note if it's the one we just starred
      if (selectedNote?.id === noteId) {
        setSelectedNote({ ...selectedNote, is_starred: !selectedNote.is_starred })
      }
    } catch (error) {
      console.error('Error toggling star:', error.message)
      alert('Error toggling star. Check console.')
    }
  }

  const setUpLink = async (sourceId, targetId) => {
    try {
      // Set source's up_id to target
      const { error: sourceError } = await supabase
        .from('notes')
        .update({ up_id: targetId })
        .eq('id', sourceId)

      if (sourceError) throw sourceError

      // Set target's down_id to source (bidirectional link)
      const { error: targetError } = await supabase
        .from('notes')
        .update({ down_id: sourceId })
        .eq('id', targetId)

      if (targetError) throw targetError

      await fetchNotes()
      
      if (selectedNote?.id === sourceId) {
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('id', sourceId)
          .single()
        
        if (data) setSelectedNote(data)
      }
    } catch (error) {
      console.error('Error setting up link:', error.message)
      alert('Error setting up link. Check console.')
    }
  }

  const removeUpLink = async (sourceId) => {
    try {
      // Get the current up_id before removing
      const { data: sourceNote } = await supabase
        .from('notes')
        .select('up_id')
        .eq('id', sourceId)
        .single()

      if (sourceNote?.up_id) {
        // Remove the bidirectional link
        const { error: targetError } = await supabase
          .from('notes')
          .update({ down_id: null })
          .eq('id', sourceNote.up_id)

        if (targetError) throw targetError
      }

      // Remove source's up_id
      const { error } = await supabase
        .from('notes')
        .update({ up_id: null })
        .eq('id', sourceId)

      if (error) throw error

      await fetchNotes()
      
      if (selectedNote?.id === sourceId) {
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('id', sourceId)
          .single()
        
        if (data) setSelectedNote(data)
      }
    } catch (error) {
      console.error('Error removing up link:', error.message)
      alert('Error removing up link. Check console.')
    }
  }

  const setDownLink = async (sourceId, targetId) => {
    try {
      // Set source's down_id to target
      const { error: sourceError } = await supabase
        .from('notes')
        .update({ down_id: targetId })
        .eq('id', sourceId)

      if (sourceError) throw sourceError

      // Set target's up_id to source (bidirectional link)
      const { error: targetError } = await supabase
        .from('notes')
        .update({ up_id: sourceId })
        .eq('id', targetId)

      if (targetError) throw targetError

      await fetchNotes()
      
      if (selectedNote?.id === sourceId) {
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('id', sourceId)
          .single()
        
        if (data) setSelectedNote(data)
      }
    } catch (error) {
      console.error('Error setting down link:', error.message)
      alert('Error setting down link. Check console.')
    }
  }

  const removeDownLink = async (sourceId) => {
    try {
      // Get the current down_id before removing
      const { data: sourceNote } = await supabase
        .from('notes')
        .select('down_id')
        .eq('id', sourceId)
        .single()

      if (sourceNote?.down_id) {
        // Remove the bidirectional link
        const { error: targetError } = await supabase
          .from('notes')
          .update({ up_id: null })
          .eq('id', sourceNote.down_id)

        if (targetError) throw targetError
      }

      // Remove source's down_id
      const { error } = await supabase
        .from('notes')
        .update({ down_id: null })
        .eq('id', sourceId)

      if (error) throw error

      await fetchNotes()
      
      if (selectedNote?.id === sourceId) {
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('id', sourceId)
          .single()
        
        if (data) setSelectedNote(data)
      }
    } catch (error) {
      console.error('Error removing down link:', error.message)
      alert('Error removing down link. Check console.')
    }
  }

  const setLeftLink = async (sourceId, targetId) => {
    try {
      // Set source's left_id to target
      const { error: sourceError } = await supabase
        .from('notes')
        .update({ left_id: targetId })
        .eq('id', sourceId)

      if (sourceError) throw sourceError

      // Set target's right_id to source (bidirectional link)
      const { error: targetError } = await supabase
        .from('notes')
        .update({ right_id: sourceId })
        .eq('id', targetId)

      if (targetError) throw targetError

      await fetchNotes()

      if (selectedNote?.id === sourceId) {
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('id', sourceId)
          .single()

        if (data) setSelectedNote(data)
      }
    } catch (error) {
      console.error('Error setting left link:', error.message)
      alert('Error setting left link. Check console.')
    }
  }

  const setRightLink = async (sourceId, targetId) => {
    try {
      // Set source's right_id to target
      const { error: sourceError } = await supabase
        .from('notes')
        .update({ right_id: targetId })
        .eq('id', sourceId)

      if (sourceError) throw sourceError

      // Set target's left_id to source (bidirectional link)
      const { error: targetError } = await supabase
        .from('notes')
        .update({ left_id: sourceId })
        .eq('id', targetId)

      if (targetError) throw targetError

      await fetchNotes()

      if (selectedNote?.id === sourceId) {
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('id', sourceId)
          .single()

        if (data) setSelectedNote(data)
      }
    } catch (error) {
      console.error('Error setting right link:', error.message)
      alert('Error setting right link. Check console.')
    }
  }

  const removeLeftLink = async (sourceId) => {
    try {
      // Get the current left_id before removing
      const { data: sourceNote } = await supabase
        .from('notes')
        .select('left_id')
        .eq('id', sourceId)
        .single()

      if (sourceNote?.left_id) {
        // Remove the bidirectional link
        const { error: targetError } = await supabase
          .from('notes')
          .update({ right_id: null })
          .eq('id', sourceNote.left_id)

        if (targetError) throw targetError
      }

      // Remove source's left_id
      const { error } = await supabase
        .from('notes')
        .update({ left_id: null })
        .eq('id', sourceId)

      if (error) throw error

      await fetchNotes()

      if (selectedNote?.id === sourceId) {
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('id', sourceId)
          .single()

        if (data) setSelectedNote(data)
      }
    } catch (error) {
      console.error('Error removing left link:', error.message)
      alert('Error removing left link. Check console.')
    }
  }

  const removeRightLink = async (sourceId) => {
    try {
      // Get the current right_id before removing
      const { data: sourceNote } = await supabase
        .from('notes')
        .select('right_id')
        .eq('id', sourceId)
        .single()

      if (sourceNote?.right_id) {
        // Remove the bidirectional link
        const { error: targetError } = await supabase
          .from('notes')
          .update({ left_id: null })
          .eq('id', sourceNote.right_id)

        if (targetError) throw targetError
      }

      // Remove source's right_id
      const { error } = await supabase
        .from('notes')
        .update({ right_id: null })
        .eq('id', sourceId)

      if (error) throw error

      await fetchNotes()

      if (selectedNote?.id === sourceId) {
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('id', sourceId)
          .single()

        if (data) setSelectedNote(data)
      }
    } catch (error) {
      console.error('Error removing right link:', error.message)
      alert('Error removing right link. Check console.')
    }
  }

  const navigateToLinkedNote = async (linkId) => {
    if (!linkId) return

    const note = notes.find(n => n.id === linkId)
    if (note) {
      setSelectedNote(note)
    } else {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('id', linkId)
        .single()

      if (data) setSelectedNote(data)
    }
  }

  /**
   * Navigate to a note or task by its reference ID
   * Called when clicking on ref_id badges in the editor
   * @param {string} refId - The reference ID to navigate to
   * @param {string} type - The type ('note' or 'task')
   * @param {boolean} shiftKey - If true, open in side-by-side view
   */
  const navigateToRefId = async (refId, type, shiftKey = false) => {
    try {
      if (type === 'note') {
        // Navigate to the note
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('ref_id', refId)
          .single()

        if (error) throw error

        if (data) {
          if (shiftKey) {
            // Shift+click: open in secondary pane
            setSecondaryNote(data)
          } else {
            // Normal click: replace current note
            setSelectedNote(data)
            setSidebarOpen(false)
          }
        }
      } else if (type === 'task') {
        // For tasks, fetch and show task detail panel
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('ref_id', refId)
          .single()

        if (taskError) throw taskError

        if (taskData) {
          if (shiftKey) {
            // Shift+click: open task detail in side panel
            setSelectedTask(taskData)
          } else {
            // Normal click: show alert (or could also open detail panel)
            alert(`Task: ${taskData.text}\nStatus: ${taskData.status}\nPriority: ${taskData.priority}`)
          }
        }
      }
    } catch (error) {
      console.error('Error navigating to ref_id:', refId, error)
      alert(`Could not find ${type} with ref_id: ${refId}`)
    }
  }

  /**
   * Save task updates from the task detail panel
   * @param {object} updatedTask - Updated task object
   */
  const saveTask = async (updatedTask) => {
    try {
      // Build update object with only fields that exist in the database
      const updates = {
        text: updatedTask.text,
        status: updatedTask.status,
        updated_at: new Date().toISOString()
      }

      // Add optional fields if they exist
      if (updatedTask.context !== undefined) {
        updates.context = updatedTask.context
      }
      if (updatedTask.work_notes !== undefined) {
        updates.work_notes = updatedTask.work_notes
      }
      if (updatedTask.ref_id !== undefined) {
        updates.ref_id = updatedTask.ref_id
      }
      if (updatedTask.scheduled_date !== undefined) {
        updates.scheduled_date = updatedTask.scheduled_date
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', updatedTask.id)

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      // Update local state
      setCurrentTasks(currentTasks.map(t =>
        t.id === updatedTask.id ? { ...updatedTask, updated_at: new Date().toISOString() } : t
      ))
      setSelectedTask({ ...updatedTask, updated_at: new Date().toISOString() })

      // Refresh the view if we're on a task list
      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      }
    } catch (error) {
      console.error('Error saving task:', error)
      console.error('Error message:', error.message)
      console.error('Error details:', JSON.stringify(error, null, 2))
      alert(`Error saving task: ${error.message}\nCheck console for details.`)
    }
  }

  // Get all tasks from the tasks table
  const getAllTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('priority', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching tasks:', error)
      return []
    }
  }

  /**
   * Check and update overdue tasks
   * If a task has a scheduled_date in the past and status is not DONE/CANCELLED, set it to OVERDUE
   */
  const checkAndUpdateOverdueTasks = async (tasks) => {
    const today = new Date().toISOString().split('T')[0]
    const overdueTasks = tasks.filter(task =>
      task.scheduled_date &&
      task.scheduled_date < today &&
      task.status !== 'DONE' &&
      task.status !== 'CANCELLED' &&
      task.status !== 'OVERDUE'
    )

    // Update overdue tasks in database
    for (const task of overdueTasks) {
      try {
        await supabase
          .from('tasks')
          .update({
            status: 'OVERDUE',
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id)
      } catch (error) {
        console.error('Error updating overdue task:', task.id, error)
      }
    }

    // Return updated tasks list
    return tasks.map(task => {
      if (overdueTasks.find(t => t.id === task.id)) {
        return { ...task, status: 'OVERDUE' }
      }
      return task
    })
  }

  // Fetch tasks based on the current note view
  const fetchTasksForView = async (noteTitle) => {
    try {
      let query = supabase.from('tasks').select('*').order('priority', { ascending: true })

      // Fetch all tasks and filter client-side
      const { data, error } = await query

      if (error) throw error

      // Check and update overdue tasks
      let updatedTasks = await checkAndUpdateOverdueTasks(data || [])

      // Apply view-specific filtering
      if (noteTitle === 'Today') {
        // Today: show starred tasks OR tasks scheduled for today (excluding CANCELLED and SOMEDAY)
        const today = new Date().toISOString().split('T')[0]
        updatedTasks = updatedTasks.filter(task =>
          (task.starred || task.scheduled_date === today) &&
          task.status !== 'CANCELLED' &&
          task.scheduled_date !== 'SOMEDAY'
        )
      } else if (noteTitle === 'Week') {
        // Week: show active tasks (not done, not cancelled, not someday)
        // Include: tasks scheduled this week OR tasks with no date OR tasks marked as THIS_WEEK
        const today = new Date()
        const dayOfWeek = today.getDay()
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        const monday = new Date(today)
        monday.setDate(today.getDate() + daysToMonday)
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)

        const mondayISO = monday.toISOString().split('T')[0]
        const sundayISO = sunday.toISOString().split('T')[0]

        updatedTasks = updatedTasks.filter(task =>
          task.status !== 'DONE' &&
          task.status !== 'CANCELLED' &&
          task.scheduled_date !== 'SOMEDAY' &&
          (
            (task.scheduled_date && task.scheduled_date >= mondayISO && task.scheduled_date <= sundayISO) ||
            task.scheduled_date === 'THIS_WEEK' ||
            task.scheduled_date === null
          )
        )
      } else if (noteTitle === 'Tasks') {
        // Tasks: show all active tasks (not done, not cancelled, not someday)
        updatedTasks = updatedTasks.filter(task =>
          task.status !== 'DONE' &&
          task.status !== 'CANCELLED' &&
          task.scheduled_date !== 'SOMEDAY'
        )
      } else if (noteTitle === 'Someday/Maybe') {
        // Someday/Maybe: show only tasks scheduled as SOMEDAY
        updatedTasks = updatedTasks.filter(task =>
          task.scheduled_date === 'SOMEDAY' &&
          task.status !== 'CANCELLED'
        )
      }

      // Apply status filter if any filters are selected
      if (statusFilter.length > 0) {
        updatedTasks = updatedTasks.filter(task => statusFilter.includes(task.status))
      }

      setCurrentTasks(updatedTasks)
    } catch (error) {
      console.error('Error fetching tasks for view:', error)
      setCurrentTasks([])
    }
  }

  // Load tasks when a task list note is selected
  useEffect(() => {
    if (selectedNote?.note_type === 'task_list') {
      fetchTasksForView(selectedNote.title)
    } else {
      setCurrentTasks([])
    }
  }, [selectedNote])

  // Re-fetch tasks when status filter changes
  useEffect(() => {
    if (selectedNote?.note_type === 'task_list') {
      fetchTasksForView(selectedNote.title)
    }
  }, [statusFilter])

  /**
   * Add a new task directly to the tasks table
   *
   * @param {string} text - Task description
   * @param {object} targetNote - Target note object (determines starred status)
   *
   * Process:
   * 1. Get highest priority to determine new task's priority
   * 2. Create new task with appropriate status and starred flag
   * 3. Insert into tasks table
   * 4. Refresh the current view
   */
  const addTask = async (text, targetNote) => {
    try {
      if (!targetNote) {
        throw new Error('Target note not found')
      }

      // Get all tasks to determine next priority
      const allTasks = await getAllTasks()
      const maxPriority = allTasks.length > 0
        ? Math.max(...allTasks.map(t => t.priority || 0))
        : 0

      const newTask = {
        text,
        status: 'BACKLOG', // Default status for new tasks
        priority: maxPriority + 1,
        starred: targetNote.title === 'Today', // Auto-star if adding to Today
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Insert into tasks table
      const { error } = await supabase
        .from('tasks')
        .insert([newTask])

      if (error) throw error

      // Refresh the current view
      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      }
    } catch (error) {
      console.error('Error adding task:', error)
      throw error // Re-throw so handleCommand can catch it
    }
  }

  /**
   * Toggle task completion status by updating status field
   * Completed tasks get status DONE, uncompleted get BACKLOG
   *
   * @param {string} taskId - Unique task ID
   */
  const toggleTaskComplete = async (taskId) => {
    if (!selectedNote || selectedNote.note_type !== 'task_list') return

    try {
      // Find the task in current view
      const task = currentTasks.find(t => t.id === taskId)
      if (!task) return

      const newStatus = task.status === 'DONE' ? 'BACKLOG' : 'DONE'

      // Optimistic update
      setCurrentTasks(currentTasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
      ))

      // Update in database
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      // Refresh the view
      await fetchTasksForView(selectedNote.title)
    } catch (error) {
      console.error('Error toggling task completion:', error)
      // Rollback on error
      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      }
    }
  }

  /**
   * Change task status to a specific value
   *
   * @param {string} taskId - Unique task ID
   * @param {string} newStatus - New status value
   */
  const changeTaskStatus = async (taskId, newStatus) => {
    if (!selectedNote || selectedNote.note_type !== 'task_list') return

    try {
      // Optimistic update
      setCurrentTasks(currentTasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
      ))

      // Update in database
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      // Refresh the view
      await fetchTasksForView(selectedNote.title)
    } catch (error) {
      console.error('Error changing task status:', error)
      // Rollback on error
      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      }
    }
  }

  /**
   * Toggle task star status in tasks table
   *
   * @param {string} taskId - Unique task ID
   */
  const toggleTaskStar = async (taskId) => {
    try {
      // Find the task in current view
      const task = currentTasks.find(t => t.id === taskId)
      if (!task) return

      const newStarredState = !task.starred

      // Optimistic update
      setCurrentTasks(currentTasks.map(t =>
        t.id === taskId ? { ...t, starred: newStarredState, updated_at: new Date().toISOString() } : t
      ))

      // Update in database
      const { error } = await supabase
        .from('tasks')
        .update({
          starred: newStarredState,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      // Refresh the view
      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      }
    } catch (error) {
      console.error('Error toggling task star:', error)
      // Rollback on error
      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      }
    }
  }

  /**
   * Schedule a task for a specific date
   * When a date is set and status is BACKLOG, automatically change status to PLANNED
   * Special values: 'SOMEDAY', 'THIS_WEEK'
   *
   * @param {string} taskId - Unique task ID
   * @param {string} scheduledDate - Date string (YYYY-MM-DD), 'SOMEDAY', 'THIS_WEEK', or null to clear
   */
  const scheduleTask = async (taskId, scheduledDate) => {
    try {
      // Find the task in current view
      const task = currentTasks.find(t => t.id === taskId)
      if (!task) return

      const updates = { scheduled_date: scheduledDate }

      // If scheduling a date and status is BACKLOG, auto-set to PLANNED
      // Don't auto-change status for SOMEDAY
      if (scheduledDate && scheduledDate !== 'SOMEDAY' && task.status === 'BACKLOG') {
        updates.status = 'PLANNED'
      }

      // Optimistic update
      setCurrentTasks(currentTasks.map(t =>
        t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      ))

      // Update in database
      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      // Refresh the view
      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      }
    } catch (error) {
      console.error('Error scheduling task:', error)
      // Rollback on error
      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      }
    }
  }

  /**
   * Reorder tasks by swapping priorities
   * When a task is moved, we swap its priority with the task at the target position
   */
  const reorderTasks = async (fromIndex, toIndex) => {
    if (!selectedNote || selectedNote.note_type !== 'task_list') return

    try {
      const reorderedTasks = [...currentTasks]
      const [movedTask] = reorderedTasks.splice(fromIndex, 1)
      reorderedTasks.splice(toIndex, 0, movedTask)

      // Assign new priorities based on position
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        priority: index + 1
      }))

      // Optimistic update
      setCurrentTasks(reorderedTasks.map((task, index) => ({
        ...task,
        priority: index + 1
      })))

      // Update all priorities in database
      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ priority: update.priority, updated_at: new Date().toISOString() })
          .eq('id', update.id)
      }

      // Refresh the view
      await fetchTasksForView(selectedNote.title)
    } catch (error) {
      console.error('Error reordering tasks:', error)
      // Rollback on error
      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      }
    }
  }

  /**
   * Handle terminal commands
   * Parses input and executes appropriate action
   * 
   * @param {string} input - Raw command string from terminal
   * @returns {string} - Result message to display in terminal
   * 
   * Supported Commands:
   * - help: Show help text
   * - add task "text" to [today|week|tasks]: Add new task
   * - goto [target]: Navigate to note
   * - complete task N: Mark task complete (not yet implemented)
   * - star task N: Star task (not yet implemented)
   */
  const handleCommand = async (input) => {
    const command = parseCommand(input)

    try {
      switch (command.type) {
        case 'HELP': {
          return `📖 Available Commands:

TASK MANAGEMENT:
  add task "text" to today        Add task to Today list
  add task "text" to week         Add task to Week list
  add task "text" to tasks        Add task to Tasks list

NAVIGATION:
  goto today                      Navigate to Today
  goto week                       Navigate to Week
  goto tasks                      Navigate to Tasks
  goto home                       Navigate to HOME
  goto "Note Title"               Navigate to any note by title

TIMER:
  start timer 30                  Start a 30-minute timer with dots

COMING SOON:
  complete task 3                 Mark task #3 as complete
  star task 5                     Star task #5 (add to Today)

TIPS:
• Press ↑/↓ to navigate command history
• Colors appear after you finish typing each word
• Star tasks to add them to Today list
• Drag tasks to reorder them
• Click timer to pause/unpause

Type /help anytime to see this message.`
        }

        case 'ADD_TASK': {
          const { text, target } = command.payload
          let targetNote = null

          if (target === 'today' && todayNote) {
            targetNote = todayNote
          } else if (target === 'week' && weekNote) {
            targetNote = weekNote
          } else if (target === 'tasks' && tasksNote) {
            targetNote = tasksNote
          }

          if (targetNote) {
            await addTask(text, targetNote)
            return `✓ Task added to ${target}`
          } else {
            return `✗ Target note "${target}" not found`
          }
        }

        case 'COMPLETE_TASK': {
          return '⚠ Complete task not yet implemented'
        }

        case 'STAR_TASK': {
          return '⚠ Star task not yet implemented'
        }

        case 'GOTO': {
          const { target } = command.payload
          let noteIdToGo = null
          let noteTitle = null

          if (target.toLowerCase() === 'today' && todayNote) {
            noteIdToGo = todayNote.id
            noteTitle = 'Today'
          } else if (target.toLowerCase() === 'week' && weekNote) {
            noteIdToGo = weekNote.id
            noteTitle = 'Week'
          } else if (target.toLowerCase() === 'tasks' && tasksNote) {
            noteIdToGo = tasksNote.id
            noteTitle = 'Tasks'
          } else if (target.toLowerCase() === 'home' && homeNote) {
            noteIdToGo = homeNote.id
            noteTitle = 'HOME'
          } else {
            // Search by title
            const noteFound = notes.find(n => n.title.toLowerCase() === target.toLowerCase())
            if (noteFound) {
              noteIdToGo = noteFound.id
              noteTitle = noteFound.title
            }
          }

          if (noteIdToGo) {
            // Always fetch fresh data from notes array by ID to ensure we have latest content
            const freshNote = notes.find(n => n.id === noteIdToGo)
            if (freshNote) {
              setSelectedNote(freshNote)
              setSidebarOpen(false)
              return `✓ Navigated to ${noteTitle}`
            }
          }

          return `✗ Note "${target}" not found`
        }

        case 'START_TIMER': {
          const { minutes } = command.payload
          const totalSeconds = minutes * 60
          const intervalSeconds = 30

          setTimerConfig({
            totalSeconds,
            intervalSeconds
          })

          return `✓ Timer started for ${minutes} minute${minutes !== 1 ? 's' : ''}`
        }

        case 'UNKNOWN':
        default:
          return `✗ Unknown command. Type /help for available commands.`
      }
    } catch (error) {
      console.error('Error executing command:', error.message)
      return `✗ Error: ${error.message}`
    }
  }

  const goToHome = () => {
    if (homeNote) {
      setSelectedNote(homeNote)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
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
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Session Context Band - only shown when timer is active */}
      {timerConfig && (
        <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-2 px-4 flex items-center justify-center">
          <input
            type="text"
            value={sessionContext}
            onChange={(e) => setSessionContext(e.target.value)}
            placeholder="What are you working on?"
            className="max-w-md w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:bg-white dark:focus:bg-gray-800 text-center"
            maxLength={60}
          />
        </div>
      )}

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
          onClick={goToHome}
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
          onSelectNote={(note, shiftKey) => {
            if (shiftKey) {
              setSecondaryNote(note)
            } else {
              setSelectedNote(note)
              if (window.innerWidth < 768) {
                setSidebarOpen(false)
              }
            }
          }}
          onCreateNote={createNote}
          onGoHome={goToHome}
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

      {/* Main content area - takes remaining space above terminal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex justify-center items-center overflow-hidden p-8 md:p-16 gap-4">
          {/* Primary note editor */}
          <div className={`w-full h-full ${secondaryNote || selectedTask ? 'max-w-2xl' : 'max-w-4xl'} max-h-[800px] transition-all`}>
            <NoteEditor
              note={selectedNote}
              allNotes={notes}
              currentTasks={currentTasks}
              onSave={saveNote}
              onDelete={deleteNote}
              onSetAsHome={setAsHome}
              onToggleStar={toggleStar}
              onSetUp={setUpLink}
              onRemoveUp={removeUpLink}
              onSetDown={setDownLink}
              onRemoveDown={removeDownLink}
              onSetLeft={setLeftLink}
              onSetRight={setRightLink}
              onRemoveLeft={removeLeftLink}
              onRemoveRight={removeRightLink}
              onNavigate={navigateToLinkedNote}
              onCreateDraftLinked={createDraftLinkedNote}
              onToggleTaskComplete={toggleTaskComplete}
              onToggleTaskStar={toggleTaskStar}
              onChangeTaskStatus={changeTaskStatus}
              onScheduleTask={scheduleTask}
              onReorderTasks={reorderTasks}
              onRefIdNavigate={navigateToRefId}
              onTaskDoubleClick={setSelectedTask}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          {/* Secondary note editor (side-by-side) */}
          {secondaryNote && (
            <div className="w-full h-full max-w-2xl max-h-[800px] relative">
              {/* Close button */}
              <button
                onClick={() => setSecondaryNote(null)}
                className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 text-sm font-bold"
                title="Close side panel"
              >
                ×
              </button>
              <NoteEditor
                note={secondaryNote}
                allNotes={notes}
                currentTasks={[]} // No tasks in secondary view
                onSave={async (updatedNote) => {
                  await saveNote(updatedNote)
                  // Update secondary note with latest data
                  setSecondaryNote(updatedNote)
                }}
                onDelete={async (noteId) => {
                  await deleteNote(noteId)
                  setSecondaryNote(null)
                }}
                onSetAsHome={setAsHome}
                onToggleStar={toggleStar}
                onSetUp={setUpLink}
                onRemoveUp={removeUpLink}
                onSetDown={setDownLink}
                onRemoveDown={removeDownLink}
                onSetLeft={setLeftLink}
                onSetRight={setRightLink}
                onRemoveLeft={removeLeftLink}
                onRemoveRight={removeRightLink}
                onNavigate={async (linkId) => {
                  // Navigate within secondary pane only
                  if (!linkId) return

                  const note = notes.find(n => n.id === linkId)
                  if (note) {
                    setSecondaryNote(note)
                  } else {
                    const { data } = await supabase
                      .from('notes')
                      .select('*')
                      .eq('id', linkId)
                      .single()

                    if (data) setSecondaryNote(data)
                  }
                }}
                onCreateDraftLinked={createDraftLinkedNote}
                onToggleTaskComplete={() => {}}
                onToggleTaskStar={() => {}}
                onChangeTaskStatus={() => {}}
                onReorderTasks={() => {}}
                onRefIdNavigate={async (refId, type) => {
                  // Secondary editor navigation - always navigate within secondary pane
                  try {
                    if (type === 'note') {
                      const { data, error } = await supabase
                        .from('notes')
                        .select('*')
                        .eq('ref_id', refId)
                        .single()

                      if (error) throw error

                      if (data) {
                        // Always update secondary note, ignore shiftKey
                        setSecondaryNote(data)
                      }
                    } else if (type === 'task') {
                      const { data: taskData, error: taskError } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('ref_id', refId)
                        .single()

                      if (taskError) throw taskError

                      if (taskData) {
                        alert(`Task: ${taskData.text}\nStatus: ${taskData.status}\nPriority: ${taskData.priority}`)
                      }
                    }
                  } catch (error) {
                    console.error('Error navigating to ref_id in secondary:', refId, error)
                    alert(`Could not find ${type} with ref_id: ${refId}`)
                  }
                }}
              />
            </div>
          )}

          {/* Task Detail Panel */}
          {selectedTask && !secondaryNote && (
            <div className="w-full h-full max-w-xl max-h-[800px]">
              <TaskDetail
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onSave={saveTask}
              />
            </div>
          )}
        </div>
      </div>

      {/* Terminal - fixed at bottom */}
      <Terminal onCommand={handleCommand} />

      {/* Timer - overlay when active (always mounted, just hidden when minimized) */}
      {timerConfig && (
        <div className={isTimerMinimized ? 'hidden' : ''}>
          <Timer
            totalSeconds={timerConfig.totalSeconds}
            intervalSeconds={timerConfig.intervalSeconds}
            onComplete={() => {
              setTimerConfig(null)
              setSessionContext('')
              setIsTimerMinimized(false)
            }}
            onClose={() => {
              setTimerConfig(null)
              setSessionContext('')
              setIsTimerMinimized(false)
            }}
            onMinimize={() => setIsTimerMinimized(true)}
            onTick={(remaining, paused) => {
              setTimerRemainingSeconds(remaining)
              setIsTimerPaused(paused)
            }}
          />
        </div>
      )}

      {/* Minimized timer badge - above terminal */}
      {timerConfig && isTimerMinimized && (
        <div className="fixed bottom-48 left-0 right-0 flex justify-center z-40 pointer-events-none">
          <div
            onClick={() => setIsTimerMinimized(false)}
            className="bg-[#2a2a2a] border border-gray-700 rounded-full px-4 py-2 shadow-lg flex items-center gap-3 cursor-pointer pointer-events-auto hover:bg-[#333333] transition-colors"
          >
            {sessionContext && (
              <span className="text-xs text-gray-400 max-w-[200px] truncate">
                {sessionContext}
              </span>
            )}
            <span className="text-sm font-mono text-purple-400">
              {Math.floor(timerRemainingSeconds / 60)}:{(timerRemainingSeconds % 60).toString().padStart(2, '0')}
            </span>
            {isTimerPaused && (
              <span className="text-[9px] text-yellow-500">PAUSED</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
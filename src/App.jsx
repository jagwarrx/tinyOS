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
import { supabase } from './supabaseClient'
import { Menu, Sun, Moon, Home } from 'lucide-react'
import { 
  parseCommand, 
  generateTaskId, 
  createTaskListContent, 
  parseTaskListContent,
  getNextTaskOrder 
} from './utils/commandParser'

function App() {
  // Core state: all notes and current selection
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  
  // Special notes references
  const [homeNote, setHomeNote] = useState(null)
  const [tasksNote, setTasksNote] = useState(null)
  const [todayNote, setTodayNote] = useState(null)
  const [weekNote, setWeekNote] = useState(null)
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return 'light' // Default to light theme
  })

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
   * Initialize special notes (HOME, Tasks, Today, Week)
   * Runs whenever notes array changes
   */
  useEffect(() => {
    if (notes.length > 0) {
      const home = notes.find(n => n.is_home === true)
      const tasks = notes.find(n => n.note_type === 'task_list' && n.title === 'Tasks')
      const today = notes.find(n => n.note_type === 'task_list' && n.title === 'Today')
      const week = notes.find(n => n.note_type === 'task_list' && n.title === 'Week')
      
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

      // Create task notes if they don't exist
      if (!tasks || !today || !week) {
        createTaskNotes()
      }
    }
  }, [notes])

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

  // Get all tasks from the Tasks note
  const getAllTasks = () => {
    if (!tasksNote) return []
    return parseTaskListContent(tasksNote.content)
  }

  // Add task to a specific note (tasks, today, or week)
  /**
   * Add a new task to a target note (Tasks, Today, or Week)
   * Uses optimistic updates for instant UI feedback
   * 
   * @param {string} text - Task description
   * @param {object} targetNote - Target note object (must have id and title)
   * 
   * Process:
   * 1. Create new task object with unique ID
   * 2. Update local state immediately (optimistic)
   * 3. Persist to database (Tasks note always updated)
   * 4. Also update target note if different from Tasks
   * 5. Fetch from database to ensure consistency
   * 6. On error: rollback by fetching from database
   */
  const addTask = async (text, targetNote) => {
    try {
      if (!targetNote) {
        throw new Error('Target note not found')
      }

      if (!tasksNote) {
        throw new Error('Tasks note not initialized. Please refresh the page.')
      }

      const allTasks = getAllTasks()
      const newTask = {
        id: generateTaskId(),
        text,
        completed: false,
        starred: targetNote.title === 'Today', // Auto-star if adding to Today
        project_id: null,
        order: getNextTaskOrder(allTasks),
        created_at: new Date().toISOString()
      }

      // OPTIMISTIC UPDATE: Update local state immediately
      const updatedNotes = notes.map(note => {
        if (note.id === tasksNote.id) {
          // Update Tasks note
          const tasksContent = parseTaskListContent(note.content)
          tasksContent.push(newTask)
          return {
            ...note,
            content: createTaskListContent(tasksContent),
            updated_at: new Date().toISOString()
          }
        } else if (note.id === targetNote.id && targetNote.id !== tasksNote.id) {
          // Update target note (Today/Week) if different from Tasks
          const targetContent = parseTaskListContent(note.content)
          targetContent.push(newTask)
          return {
            ...note,
            content: createTaskListContent(targetContent),
            updated_at: new Date().toISOString()
          }
        }
        return note
      })

      // Update state immediately for instant UI feedback
      setNotes(updatedNotes)
      
      // Update selected note if it's one of the notes we modified
      if (selectedNote?.id === tasksNote.id || selectedNote?.id === targetNote.id) {
        const updatedSelectedNote = updatedNotes.find(n => n.id === selectedNote.id)
        if (updatedSelectedNote) {
          setSelectedNote(updatedSelectedNote)
        }
      }

      // Then persist to database in the background
      const tasksContent = parseTaskListContent(tasksNote.content)
      tasksContent.push(newTask)
      
      const { error: tasksError } = await supabase
        .from('notes')
        .update({
          content: createTaskListContent(tasksContent),
          updated_at: new Date().toISOString()
        })
        .eq('id', tasksNote.id)

      if (tasksError) throw tasksError

      // If adding to Today or Week, also update that note
      if (targetNote.id !== tasksNote.id) {
        const targetContent = parseTaskListContent(targetNote.content)
        targetContent.push(newTask)
        
        const { error: targetError } = await supabase
          .from('notes')
          .update({
            content: createTaskListContent(targetContent),
            updated_at: new Date().toISOString()
          })
          .eq('id', targetNote.id)

        if (targetError) throw targetError
      }

      // Fetch from database to ensure consistency
      await fetchNotes()
    } catch (error) {
      console.error('Error adding task:', error)
      // Rollback: refresh from database on error
      await fetchNotes()
      throw error // Re-throw so handleCommand can catch it
    }
  }

  /**
   * Toggle task completion status (checkbox)
   * Uses optimistic updates for instant UI feedback
   * 
   * @param {string} taskId - Unique task ID
   * 
   * Process:
   * 1. Update local state immediately (optimistic)
   * 2. Persist to current note
   * 3. Also update Tasks note if on a different view
   * 4. Fetch from database to ensure consistency
   * 5. On error: rollback by fetching from database
   */
  const toggleTaskComplete = async (taskId) => {
    if (!selectedNote || selectedNote.note_type !== 'task_list') return

    try {
      const tasks = parseTaskListContent(selectedNote.content)
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )

      // OPTIMISTIC UPDATE: Update local state immediately
      const optimisticSelectedNote = {
        ...selectedNote,
        content: createTaskListContent(updatedTasks),
        updated_at: new Date().toISOString()
      }
      setSelectedNote(optimisticSelectedNote)

      const optimisticNotes = notes.map(note => {
        if (note.id === selectedNote.id) {
          return optimisticSelectedNote
        }
        // Also update Tasks note if we're not on it
        if (tasksNote && note.id === tasksNote.id && selectedNote.id !== tasksNote.id) {
          const masterTasks = parseTaskListContent(note.content)
          const updatedMasterTasks = masterTasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
          return {
            ...note,
            content: createTaskListContent(updatedMasterTasks),
            updated_at: new Date().toISOString()
          }
        }
        return note
      })
      setNotes(optimisticNotes)

      // Then persist to database
      const { error } = await supabase
        .from('notes')
        .update({
          content: createTaskListContent(updatedTasks),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedNote.id)

      if (error) throw error

      // Also update Tasks note if we're not on it
      if (tasksNote && selectedNote.id !== tasksNote.id) {
        const masterTasks = parseTaskListContent(tasksNote.content)
        const updatedMasterTasks = masterTasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )

        await supabase
          .from('notes')
          .update({
            content: createTaskListContent(updatedMasterTasks),
            updated_at: new Date().toISOString()
          })
          .eq('id', tasksNote.id)
      }

      await fetchNotes()
    } catch (error) {
      console.error('Error toggling task completion:', error)
      // Rollback on error
      await fetchNotes()
    }
  }

  /**
   * Toggle task star status (add/remove from Today list)
   * Uses optimistic updates for instant UI feedback
   * 
   * @param {string} taskId - Unique task ID
   * 
   * Behavior:
   * - Starring: Adds task to Today note
   * - Unstarring: Removes task from Today note
   * - Always updates Tasks note (master list)
   * 
   * Process:
   * 1. Find task in Tasks note
   * 2. Toggle starred status
   * 3. Update local state immediately (optimistic)
   * 4. Update Today note (add or remove task)
   * 5. Persist both notes to database
   * 6. Fetch from database to ensure consistency
   * 7. On error: rollback by fetching from database
   */
  const toggleTaskStar = async (taskId) => {
    if (!tasksNote || !todayNote) return

    try {
      const masterTasks = parseTaskListContent(tasksNote.content)
      const task = masterTasks.find(t => t.id === taskId)
      if (!task) return

      const newStarredState = !task.starred

      // OPTIMISTIC UPDATE: Update local state immediately
      const updatedMasterTasks = masterTasks.map(t =>
        t.id === taskId ? { ...t, starred: newStarredState } : t
      )

      const todayTasks = parseTaskListContent(todayNote.content)
      let updatedTodayTasks

      if (newStarredState) {
        // Add to today if not already there
        if (!todayTasks.find(t => t.id === taskId)) {
          updatedTodayTasks = [...todayTasks, { ...task, starred: true }]
        } else {
          updatedTodayTasks = todayTasks.map(t =>
            t.id === taskId ? { ...t, starred: true } : t
          )
        }
      } else {
        // Remove from today
        updatedTodayTasks = todayTasks.filter(t => t.id !== taskId)
      }

      // Update local state immediately
      const optimisticNotes = notes.map(note => {
        if (note.id === tasksNote.id) {
          return {
            ...note,
            content: createTaskListContent(updatedMasterTasks),
            updated_at: new Date().toISOString()
          }
        } else if (note.id === todayNote.id) {
          return {
            ...note,
            content: createTaskListContent(updatedTodayTasks),
            updated_at: new Date().toISOString()
          }
        }
        return note
      })
      setNotes(optimisticNotes)

      // Update selected note if it's one we modified
      if (selectedNote?.id === tasksNote.id) {
        const updated = optimisticNotes.find(n => n.id === tasksNote.id)
        if (updated) setSelectedNote(updated)
      } else if (selectedNote?.id === todayNote.id) {
        const updated = optimisticNotes.find(n => n.id === todayNote.id)
        if (updated) setSelectedNote(updated)
      }

      // Then persist to database
      await supabase
        .from('notes')
        .update({
          content: createTaskListContent(updatedMasterTasks),
          updated_at: new Date().toISOString()
        })
        .eq('id', tasksNote.id)

      await supabase
        .from('notes')
        .update({
          content: createTaskListContent(updatedTodayTasks),
          updated_at: new Date().toISOString()
        })
        .eq('id', todayNote.id)

      await fetchNotes()
    } catch (error) {
      console.error('Error toggling task star:', error)
      // Rollback on error
      await fetchNotes()
    }
  }

  // Reorder tasks
  const reorderTasks = async (fromIndex, toIndex) => {
    if (!selectedNote || selectedNote.note_type !== 'task_list') return

    try {
      const tasks = parseTaskListContent(selectedNote.content)
      const reorderedTasks = [...tasks]
      const [movedTask] = reorderedTasks.splice(fromIndex, 1)
      reorderedTasks.splice(toIndex, 0, movedTask)

      // Update order numbers
      const updatedTasks = reorderedTasks.map((task, index) => ({
        ...task,
        order: index
      }))

      // OPTIMISTIC UPDATE: Update local state immediately
      const optimisticSelectedNote = {
        ...selectedNote,
        content: createTaskListContent(updatedTasks),
        updated_at: new Date().toISOString()
      }
      setSelectedNote(optimisticSelectedNote)

      const optimisticNotes = notes.map(note =>
        note.id === selectedNote.id ? optimisticSelectedNote : note
      )
      setNotes(optimisticNotes)

      // Then persist to database
      const { error } = await supabase
        .from('notes')
        .update({
          content: createTaskListContent(updatedTasks),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedNote.id)

      if (error) throw error
      await fetchNotes()
    } catch (error) {
      console.error('Error reordering tasks:', error)
      // Rollback on error
      await fetchNotes()
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

COMING SOON:
  complete task 3                 Mark task #3 as complete
  star task 5                     Star task #5 (add to Today)

TIPS:
• Press ↑/↓ to navigate command history
• Colors appear after you finish typing each word
• Star tasks to add them to Today list
• Drag tasks to reorder them

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
          let noteToGo = null

          if (target.toLowerCase() === 'today' && todayNote) {
            noteToGo = todayNote
          } else if (target.toLowerCase() === 'week' && weekNote) {
            noteToGo = weekNote
          } else if (target.toLowerCase() === 'tasks' && tasksNote) {
            noteToGo = tasksNote
          } else if (target.toLowerCase() === 'home' && homeNote) {
            noteToGo = homeNote
          } else {
            // Search by title
            noteToGo = notes.find(n => n.title.toLowerCase() === target.toLowerCase())
          }

          if (noteToGo) {
            setSelectedNote(noteToGo)
            setSidebarOpen(false)
            return `✓ Navigated to ${noteToGo.title}`
          } else {
            return `✗ Note "${target}" not found`
          }
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
          onSelectNote={(note) => {
            setSelectedNote(note)
            if (window.innerWidth < 768) {
              setSidebarOpen(false)
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
        <div className="flex-1 flex justify-center items-center overflow-hidden p-8 md:p-16">
          <div className="w-full max-w-3xl h-full max-h-[700px]">
            <NoteEditor
              note={selectedNote}
              allNotes={notes}
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
              onReorderTasks={reorderTasks}
            />
          </div>
        </div>
      </div>

      {/* Terminal - fixed at bottom */}
      <Terminal onCommand={handleCommand} />
    </div>
  )
}

export default App
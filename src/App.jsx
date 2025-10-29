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

import { useState, useEffect, useRef } from 'react'
import NotesList from './components/NotesList'
import NoteEditor from './components/NoteEditor'
import Terminal from './components/Terminal'
import Timer from './components/Timer'
import TaskDetail from './components/TaskDetail'
import FloatingAudioPlayer from './components/FloatingAudioPlayer'
import SettingsModal from './components/SettingsModal'
import LogPage from './components/LogPage'
import { supabase } from './supabaseClient'
import { Menu, Sun, Moon, Home, Inbox, ListTodo, FolderKanban, ScrollText, Settings } from 'lucide-react'
import {
  parseCommand,
  createTaskListContent
} from './utils/commandParser'
import { loadAndApplyTheme, changeTheme } from './services/themeService'
import { applyFont, loadFontPreference } from './config/fonts'
import { applyUIMode, loadUIModePreference } from './config/uiModes'
import {
  getJoke,
  getTip,
  getQuote,
  getFact,
  callClaude,
  explainConcept,
  brainstormIdeas
} from './services/claudeService'
import * as activityLogger from './utils/activityLogger'
import * as activityLogService from './services/activityLogService'

function App() {
  // Core state: all notes and current selection
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [secondaryNote, setSecondaryNote] = useState(null) // For side-by-side view

  // Ref for terminal component
  const terminalRef = useRef(null)

  // Special notes references
  const [homeNote, setHomeNote] = useState(null)
  const [projectsNote, setProjectsNote] = useState(null)
  const [inboxNote, setInboxNote] = useState(null)
  const [tasksNote, setTasksNote] = useState(null)
  const [todayNote, setTodayNote] = useState(null)
  const [weekNote, setWeekNote] = useState(null)
  const [somedayNote, setSomedayNote] = useState(null)
  const [logNote, setLogNote] = useState(null)

  // Tasks state (from tasks table)
  const [currentTasks, setCurrentTasks] = useState([])
  const [secondaryTasks, setSecondaryTasks] = useState([]) // Tasks for secondary pane
  const [allTasks, setAllTasks] = useState([]) // All tasks for project statistics
  const [selectedTask, setSelectedTask] = useState(null) // For task detail panel
  const [selectedTaskNumber, setSelectedTaskNumber] = useState(null) // Task number in current view
  const [selectedTaskId, setSelectedTaskId] = useState(null) // For task selection (single click)
  const [deselectionPending, setDeselectionPending] = useState(false) // For two-step deselection on Today page
  const [statusFilter, setStatusFilter] = useState([]) // Array of status values to filter by
  const [taskTypeFilter, setTaskTypeFilter] = useState(null) // Single task type value (radio behavior)

  // Reminders state (from activity_log table)
  const [todaysReminders, setTodaysReminders] = useState([]) // Reminders for today

  // UI state
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentThemeId, setCurrentThemeId] = useState('sonokai-default')

  // Timer state
  const [timerConfig, setTimerConfig] = useState(null)
  const [sessionContext, setSessionContext] = useState('')
  const [isTimerMinimized, setIsTimerMinimized] = useState(false)
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0)
  const [isTimerPaused, setIsTimerPaused] = useState(false)

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [musicLinksUpdateTrigger, setMusicLinksUpdateTrigger] = useState(0)
  const [logUpdateTrigger, setLogUpdateTrigger] = useState(0)
  const [uiPreferences, setUiPreferences] = useState({ show_priority_formula: true })

  // Trigger music links reload in FloatingAudioPlayer
  const handleMusicLinksChanged = () => {
    setMusicLinksUpdateTrigger(prev => prev + 1)
  }

  // Handle UI preferences changes
  const handleUIPreferencesChanged = async () => {
    // Import settingsService dynamically to avoid circular dependency
    const { getUIPreferences } = await import('./services/settingsService')
    try {
      const prefs = await getUIPreferences()
      setUiPreferences(prefs)
    } catch (error) {
      console.error('Failed to load UI preferences:', error)
    }
  }

  // Theme is now applied via the theme service (loadAndApplyTheme)
  // No need for a useEffect here anymore

  /**
   * Get the navigable tasks array that matches what TaskList receives
   * This ensures navigation indices match what's rendered
   *
   * On Today page: Filter out DONE and CANCELLED tasks
   * On other pages: Use all tasks
   */
  const getNavigableTasksForView = () => {
    if (!currentTasks || currentTasks.length === 0) return []

    if (selectedNote?.title === 'Today') {
      // Match NoteEditor.jsx line 558 filtering
      return currentTasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED')
    }

    // For all other views, use unfiltered tasks
    return currentTasks
  }

  /**
   * Handle keyboard shortcuts
   * - Tab: Focus terminal (when not editing)
   * - Up/Down: Navigate through tasks (when on task list page and not editing)
   * - Shift+Up/Down: Reorder tasks (when on task list page and not editing)
   * - Right: Open task detail panel (when a task is selected)
   * - Left: On Today page: first press deselects, second press navigates to Tasks
   *         On other pages: closes task panel or deselects task
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeElement = document.activeElement
      const tagName = activeElement?.tagName.toLowerCase()
      const isEditable = activeElement?.isContentEditable

      // Check if we're not in an input, textarea, or contenteditable element
      const isNotEditing = tagName !== 'input' && tagName !== 'textarea' && !isEditable

      // Tab: Focus terminal
      if (e.key === 'Tab' && isNotEditing) {
        e.preventDefault()
        terminalRef.current?.focus()
        return
      }

      // Space: Prepopulate terminal with "/task " on Today or Tasks pages
      if (e.key === ' ' && isNotEditing) {
        if (selectedNote?.title === 'Today' || selectedNote?.title === 'Tasks') {
          e.preventDefault()
          terminalRef.current?.setInputValue('/task ')
        }
        return
      }

      // L key: Navigate to Log page
      if (e.key === 'l' && isNotEditing) {
        e.preventDefault()
        goToLog()
        return
      }

      // Left arrow: Close panel, reset navigation, or navigate left
      if (e.key === 'ArrowLeft' && isNotEditing) {
        console.log('⬅️  Left Arrow:', {
          selectedTaskId,
          panelOpen: !!selectedTask,
          notePage: selectedNote?.title,
          noteType: selectedNote?.note_type
        })

        // Priority 1: Close task detail panel if open
        if (selectedTask) {
          e.preventDefault()
          e.stopPropagation()
          console.log('  → Closing task panel')
          setSelectedTask(null)
          setSelectedTaskNumber(null)
          return
        }

        // Priority 2: On task list pages, reset navigation OR navigate left
        if (selectedNote?.note_type === 'task_list') {
          // If a task is highlighted, reset navigation (remove highlight)
          if (selectedTaskId) {
            e.preventDefault()
            e.stopPropagation()
            console.log('  → Resetting navigation (removing highlight)')
            setSelectedTaskId(null)
            return
          }

          // No highlight on Today page - navigate to Tasks page
          if (selectedNote?.title === 'Today' && tasksNote) {
            e.preventDefault()
            console.log('  → Navigation reset on Today, navigating to Tasks')
            setSelectedNote(tasksNote)
            return
          }

          // For other task list pages with no highlight, allow NoteEditor to handle navigation
          console.log('  → Navigation reset, allowing page navigation')
        }

        return
      }

      // Arrow key navigation for tasks (only on task list pages)
      if (selectedNote?.note_type === 'task_list' && isNotEditing) {
        // Get the filtered array that matches what TaskList displays
        const navigableTasks = getNavigableTasksForView()

        if (navigableTasks.length === 0) return

        console.log('⌨️  Arrow key pressed:', {
          totalTasks: currentTasks.length,
          navigableTasks: navigableTasks.length,
          viewType: selectedNote?.title
        })

        if (e.key === 'ArrowUp') {
          e.preventDefault()
          console.log('🔼 Up Arrow - Before:', { selectedTaskId, navigableTasksLength: navigableTasks.length })

          // Reset deselection pending on any other action
          setDeselectionPending(false)

          if (e.shiftKey && selectedTaskId) {
            // Shift+Up: Move task up (use original currentTasks for reordering)
            const currentIndex = currentTasks.findIndex(t => t.id === selectedTaskId)
            if (currentIndex > 0) {
              reorderTasks(currentIndex, currentIndex - 1)
            }
          } else {
            // Up: Select previous task (use navigableTasks for selection)
            const currentIndex = navigableTasks.findIndex(t => t.id === selectedTaskId)
            console.log('  Current index in navigable tasks:', currentIndex)

            if (currentIndex === -1) {
              // No selection, select first task
              console.log('  → Selecting first task:', navigableTasks[0]?.id)
              setSelectedTaskId(navigableTasks[0].id)
            } else if (currentIndex > 0) {
              // Select previous task
              console.log('  → Selecting previous task:', navigableTasks[currentIndex - 1].id)
              setSelectedTaskId(navigableTasks[currentIndex - 1].id)
            } else {
              // At top of list, stay at top
              console.log('  → At top boundary, staying at current task')
            }
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          console.log('🔽 Down Arrow - Before:', { selectedTaskId, navigableTasksLength: navigableTasks.length })

          // Reset deselection pending on any other action
          setDeselectionPending(false)

          if (e.shiftKey && selectedTaskId) {
            // Shift+Down: Move task down (use original currentTasks for reordering)
            const currentIndex = currentTasks.findIndex(t => t.id === selectedTaskId)
            if (currentIndex < currentTasks.length - 1) {
              reorderTasks(currentIndex, currentIndex + 1)
            }
          } else {
            // Down: Select next task (use navigableTasks for selection)
            const currentIndex = navigableTasks.findIndex(t => t.id === selectedTaskId)
            console.log('  Current index in navigable tasks:', currentIndex)

            if (currentIndex === -1) {
              // No selection, select first task
              const firstTaskId = navigableTasks[0]?.id
              console.log('  → Selecting first task:', firstTaskId)
              console.log('  → Navigable tasks:', navigableTasks.map(t => ({ id: t.id, text: t.text.substring(0, 30) })))
              setSelectedTaskId(firstTaskId)
              // Log after state update to verify
              setTimeout(() => {
                console.log('  → State after selection:', { selectedTaskId: firstTaskId })
              }, 0)
            } else if (currentIndex < navigableTasks.length - 1) {
              // Select next task
              console.log('  → Selecting next task:', navigableTasks[currentIndex + 1].id)
              setSelectedTaskId(navigableTasks[currentIndex + 1].id)
            } else {
              // At bottom of list, stay at bottom
              console.log('  → At bottom boundary, staying at current task')
            }
          }
        } else if (e.key === 'ArrowRight') {
          // Right arrow: OPEN task panel when task is highlighted
          console.log('➡️  Right Arrow:', { selectedTaskId, panelOpen: !!selectedTask })

          if (selectedTaskId) {
            // Task is highlighted, open the panel
            e.preventDefault()
            e.stopPropagation()
            // Find task in original currentTasks array (has all tasks)
            const task = currentTasks.find(t => t.id === selectedTaskId)
            if (task) {
              console.log('  → Opening task panel for highlighted task')
              setSelectedTask(task)
            }
            return
          }
          // If no task highlighted, allow NoteEditor to handle navigation
          console.log('  → No task highlighted, allowing page navigation')
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedNote, currentTasks, selectedTaskId, selectedTask, deselectionPending, tasksNote])

  /**
   * Handle theme change from settings modal
   */
  const handleThemeChange = async (themeId) => {
    try {
      await changeTheme(themeId)
      setCurrentThemeId(themeId)
    } catch (error) {
      console.error('Failed to change theme:', error)
    }
  }

  // Initial data fetch on mount
  useEffect(() => {
    loadTheme()
    loadFont()
    loadUIMode()
    fetchNotes()
    fetchAllTasks()
    handleUIPreferencesChanged()
  }, [])

  // Load and apply font
  const loadFont = () => {
    const fontId = loadFontPreference()
    applyFont(fontId)
  }

  // Load and apply UI mode
  const loadUIMode = () => {
    const modeId = loadUIModePreference()
    applyUIMode(modeId)
  }

  // Load and apply theme
  const loadTheme = async () => {
    try {
      const theme = await loadAndApplyTheme()
      setCurrentThemeId(theme.id)
    } catch (error) {
      console.error('Failed to load theme:', error)
    }
  }

  // Fetch all tasks for project statistics
  const fetchAllTasks = async () => {
    const tasks = await getAllTasks()
    setAllTasks(tasks)
  }

  /**
   * Initialize special notes (HOME, Tasks, Today, Week, Someday/Maybe, Projects)
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

    const setupProjectsLink = async (projects, tasks) => {
      if (!projects || !tasks) return

      try {
        // Check if link already exists
        if (projects.right_id === tasks.id && tasks.left_id === projects.id) {
          return // Already linked
        }

        // Link: Projects <-> Tasks (left/right bidirectional)

        // Set Projects' right to Tasks
        await supabase
          .from('notes')
          .update({ right_id: tasks.id })
          .eq('id', projects.id)

        // Set Tasks' left to Projects
        await supabase
          .from('notes')
          .update({ left_id: projects.id })
          .eq('id', tasks.id)

        await fetchNotes()
      } catch (error) {
        console.error('Error linking Projects to Tasks:', error.message)
      }
    }

    if (notes.length > 0) {
      const home = notes.find(n => n.is_home === true)
      const projects = notes.find(n => n.note_type === 'project_list' && n.title === 'Projects')
      const inbox = notes.find(n => n.note_type === 'inbox_list' && n.title === 'Inbox')
      const tasks = notes.find(n => n.note_type === 'task_list' && n.title === 'Tasks')
      const today = notes.find(n => n.note_type === 'task_list' && n.title === 'Today')
      const week = notes.find(n => n.note_type === 'task_list' && n.title === 'Week')
      const someday = notes.find(n => n.note_type === 'task_list' && n.title === 'Someday/Maybe')
      const log = notes.find(n => n.note_type === 'log_list' && n.title === 'Log')

      if (home) {
        setHomeNote(home)
        if (!selectedNote) {
          setSelectedNote(home)
        }
      } else {
        createHomeNote()
      }

      // Set special notes
      setProjectsNote(projects)
      setInboxNote(inbox)
      setTasksNote(tasks)
      setTodayNote(today)
      setWeekNote(week)
      setSomedayNote(someday)
      setLogNote(log)

      // Create Projects note if it doesn't exist
      if (!projects) {
        createProjectsNote()
      }

      // Create Inbox note if it doesn't exist
      if (!inbox) {
        createInboxNote()
      }

      // Create task notes if they don't exist
      if (!tasks || !today || !week || !someday) {
        createTaskNotes()
      } else {
        // Link task notes if all exist
        setupTaskNoteLinks(tasks, today, week, someday)
      }

      // Link Projects to Tasks if both exist
      if (projects && tasks) {
        setupProjectsLink(projects, tasks)
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

  const createProjectsNote = async () => {
    try {
      const projectsNoteData = {
        title: 'Projects',
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
        note_type: 'project_list',
        is_starred: true,
        is_home: false,
        up_id: null,
        down_id: null,
        left_id: null,
        right_id: null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('notes')
        .insert([projectsNoteData])

      if (error) throw error
      await fetchNotes()
    } catch (error) {
      console.error('Error creating Projects note:', error.message)
    }
  }

  const createInboxNote = async () => {
    try {
      const inboxNoteData = {
        title: 'Inbox',
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
        note_type: 'inbox_list',
        is_starred: true,
        is_home: false,
        up_id: null,
        down_id: null,
        left_id: null,
        right_id: null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('notes')
        .insert([inboxNoteData])

      if (error) throw error
      await fetchNotes()
    } catch (error) {
      console.error('Error creating Inbox note:', error.message)
    }
  }

  /**
   * Create a new project note
   * Project notes have note_type='project' and link back to Projects page
   *
   * @param {string} projectName - The name/title of the project
   * @returns {object} - The created project note
   */
  const createProjectNote = async (projectName) => {
    try {
      if (!projectsNote) {
        throw new Error('Projects page not found')
      }

      const projectNoteData = {
        title: projectName,
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
        note_type: 'project',
        project_status: 'ACTIVE',
        project_start_date: new Date().toISOString().split('T')[0], // Today's date
        is_starred: true,
        is_home: false,
        up_id: null,
        down_id: null,
        left_id: projectsNote.id, // Link back to Projects page
        right_id: null,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([projectNoteData])
        .select()
        .single()

      if (error) throw error

      // Update the Projects page to link to this new project (bidirectional)
      await supabase
        .from('notes')
        .update({ right_id: data.id })
        .eq('id', projectsNote.id)

      await fetchNotes()
      await fetchAllTasks() // Refresh tasks for project statistics

      // Log project creation
      await activityLogger.logProjectCreated(data)

      return data
    } catch (error) {
      console.error('Error creating project note:', error.message)
      throw error
    }
  }

  /**
   * Create a new inbox item as a child note
   * Inbox items are regular notes that link back to the Inbox page
   *
   * @param {string} itemTitle - The title of the inbox item
   * @param {string} noteText - The multi-line content for the note (optional)
   * @returns {object} - The created inbox item note
   */
  const createInboxItem = async (itemTitle, noteText = null) => {
    try {
      if (!inboxNote) {
        throw new Error('Inbox page not found')
      }

      // Create Lexical content from the note text
      let content
      if (noteText) {
        // Split note text into lines and create paragraph nodes
        const lines = noteText.split('\n')
        const paragraphs = lines.map(line => ({
          children: line.trim() ? [{ text: line, type: 'text' }] : [],
          direction: null,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        }))

        content = JSON.stringify({
          root: {
            children: paragraphs,
            direction: null,
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        })
      } else {
        // Empty content
        content = JSON.stringify({
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
        })
      }

      const inboxItemData = {
        title: itemTitle,
        content,
        is_starred: false,
        is_home: false,
        up_id: null,
        down_id: null,
        left_id: inboxNote.id, // Link back to Inbox page
        right_id: null,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([inboxItemData])
        .select()
        .single()

      if (error) throw error

      await fetchNotes()

      return data
    } catch (error) {
      console.error('Error creating inbox item:', error.message)
      throw error
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

        // Log note creation
        await activityLogger.logNoteCreated(data[0])
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

      // Log note update (with intelligent collapsing)
      await activityLogger.logNoteUpdated(updatedNote)
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

      // Log note deletion before deleting
      await activityLogger.logNoteDeleted(noteToDelete)

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
   * Navigate to a project note
   * Called when clicking on a project card in ProjectsList
   */
  const handleProjectClick = (project) => {
    setSelectedNote(project)
    setSidebarOpen(false)
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
      if (updatedTask.task_type !== undefined) {
        updates.task_type = updatedTask.task_type
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
        // Also include tasks marked as DONE today
        const today = new Date().toISOString().split('T')[0]
        updatedTasks = updatedTasks.filter(task => {
          // Include tasks marked done today
          if (task.status === 'DONE' && task.updated_at) {
            const taskUpdatedDate = task.updated_at.split('T')[0]
            if (taskUpdatedDate === today) {
              return true
            }
          }

          // Include starred or scheduled tasks (excluding cancelled and someday)
          return (task.starred || task.scheduled_date === today) &&
            task.status !== 'CANCELLED' &&
            task.scheduled_date !== 'SOMEDAY'
        })

        // Fetch today's reminders
        try {
          const reminders = await activityLogService.fetchTodaysReminders()
          setTodaysReminders(reminders)
        } catch (error) {
          console.error('Error fetching reminders:', error)
          setTodaysReminders([])
        }
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

      // Apply task type filter if selected (single value)
      if (taskTypeFilter) {
        updatedTasks = updatedTasks.filter(task => task.task_type === taskTypeFilter)
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
      // Clear task selection when changing pages
      console.log('📄 Page changed, clearing task selection')
      setSelectedTaskId(null)
    } else {
      setCurrentTasks([])
    }
  }, [selectedNote])

  // Clear selectedTaskId if the selected task is not in the current filtered list
  useEffect(() => {
    if (selectedTaskId && currentTasks.length > 0) {
      const taskExists = currentTasks.some(t => t.id === selectedTaskId)
      if (!taskExists) {
        console.log('🔄 Selected task not in filtered list, clearing selection')
        setSelectedTaskId(null)
      }
    }
  }, [currentTasks, selectedTaskId])

  // Re-fetch tasks when status filter changes
  useEffect(() => {
    if (selectedNote?.note_type === 'task_list') {
      fetchTasksForView(selectedNote.title)
    }
  }, [statusFilter])

  // Re-fetch tasks when task type filter changes
  useEffect(() => {
    if (selectedNote?.note_type === 'task_list') {
      fetchTasksForView(selectedNote.title)
    }
  }, [taskTypeFilter])

  // Load tasks for secondary pane when a task list note is opened
  useEffect(() => {
    const fetchSecondaryTasks = async () => {
      if (secondaryNote?.note_type === 'task_list') {
        try {
          let query = supabase.from('tasks').select('*').order('priority', { ascending: true })
          const { data, error } = await query

          if (error) throw error

          let updatedTasks = await checkAndUpdateOverdueTasks(data || [])

          // Apply same view-specific filtering as primary view
          if (secondaryNote.title === 'Today') {
            const today = new Date().toISOString().split('T')[0]
            updatedTasks = updatedTasks.filter(task => {
              if (task.status === 'DONE' && task.updated_at) {
                const taskUpdatedDate = task.updated_at.split('T')[0]
                if (taskUpdatedDate === today) return true
              }
              return (task.starred || task.scheduled_date === today) &&
                task.status !== 'CANCELLED' &&
                task.scheduled_date !== 'SOMEDAY'
            })
          } else if (secondaryNote.title === 'Week') {
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
          } else if (secondaryNote.title === 'Tasks') {
            updatedTasks = updatedTasks.filter(task =>
              task.status !== 'DONE' &&
              task.status !== 'CANCELLED' &&
              task.scheduled_date !== 'SOMEDAY'
            )
          } else if (secondaryNote.title === 'Someday/Maybe') {
            updatedTasks = updatedTasks.filter(task =>
              task.scheduled_date === 'SOMEDAY' &&
              task.status !== 'CANCELLED'
            )
          }

          setSecondaryTasks(updatedTasks)
        } catch (error) {
          console.error('Error fetching tasks for secondary view:', error)
          setSecondaryTasks([])
        }
      } else {
        setSecondaryTasks([])
      }
    }

    fetchSecondaryTasks()
  }, [secondaryNote, currentTasks])

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input fields
      const activeElement = document.activeElement
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      )

      if (isTyping) return

      // Handle keyboard shortcuts
      const key = event.key.toLowerCase()
      let foundNote = null

      switch (key) {
        case 't': // Today
          foundNote = notes.find(n => n.note_type === 'task_list' && n.title === 'Today')
          break
        case 'h': // Home
          foundNote = notes.find(n => n.is_home === true)
          break
        case 'p': // Projects
          foundNote = notes.find(n => n.note_type === 'project_list' && n.title === 'Projects')
          break
        case 'i': // Inbox
          foundNote = notes.find(n => n.note_type === 'inbox_list' && n.title === 'Inbox')
          break
        default:
          return // Ignore other keys
      }

      if (foundNote) {
        event.preventDefault() // Prevent default behavior
        setSelectedNote(foundNote)
        setSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [notes]) // Re-bind when notes change

  /**
   * Add a new task directly to the tasks table
   *
   * @param {string} text - Task description
   * @param {object} targetNote - Target note object (determines starred status)
   * @param {object} options - Optional parameters { scheduleToday: boolean, note: string, projectId: string }
   *
   * Process:
   * 1. Get highest priority to determine new task's priority
   * 2. Create new task with appropriate status and starred flag
   * 3. Insert into tasks table
   * 4. Refresh the current view
   */
  const addTask = async (text, targetNote, options = {}) => {
    try {
      if (!targetNote && !options.projectId) {
        throw new Error('Target note or project not found')
      }

      // Get all tasks to determine next priority
      const allTasks = await getAllTasks()
      const maxPriority = allTasks.length > 0
        ? Math.max(...allTasks.map(t => t.priority || 0))
        : 0

      const today = new Date().toISOString().split('T')[0]

      const newTask = {
        text,
        status: options.scheduleToday ? 'PLANNED' : 'BACKLOG', // PLANNED if scheduled for today
        priority: maxPriority + 1,
        starred: targetNote?.title === 'Today' || options.scheduleToday, // Auto-star if adding to Today OR if scheduled for today
        scheduled_date: options.scheduleToday ? today : null, // Set today's date if requested
        context: options.note || null, // Add context/note if provided
        project_id: options.projectId || null, // Add to project if projectId provided
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Insert into tasks table
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()

      if (error) throw error

      // Log task creation
      if (data && data[0]) {
        await activityLogger.logTaskCreated(data[0])
      }

      // Refresh the appropriate view
      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      } else if (selectedNote?.note_type === 'project') {
        // Refresh allTasks to update project task list
        await fetchAllTasks()
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
    if (!selectedNote) return

    try {
      // Find the task in either currentTasks or allTasks
      const task = currentTasks.find(t => t.id === taskId) || allTasks.find(t => t.id === taskId)
      if (!task) return

      const newStatus = task.status === 'DONE' ? 'BACKLOG' : 'DONE'

      // Optimistic update for currentTasks
      if (currentTasks.some(t => t.id === taskId)) {
        setCurrentTasks(currentTasks.map(t =>
          t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
        ))
      }

      // Optimistic update for allTasks (used by project pages)
      setAllTasks(allTasks.map(t =>
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

      // Log task completion (only when marking as DONE)
      if (newStatus === 'DONE') {
        await activityLogger.logTaskCompleted(task)
      }

      // Refresh the view - check both primary and secondary notes
      const isProjectView = selectedNote?.note_type === 'project' || secondaryNote?.note_type === 'project'

      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      } else if (isProjectView) {
        await fetchAllTasks()
      }
    } catch (error) {
      console.error('Error toggling task completion:', error)
      // Rollback on error
      const isProjectView = selectedNote?.note_type === 'project' || secondaryNote?.note_type === 'project'

      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      } else if (isProjectView) {
        await fetchAllTasks()
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
    if (!selectedNote) return

    try {
      // Find the task in either currentTasks or allTasks
      const task = currentTasks.find(t => t.id === taskId) || allTasks.find(t => t.id === taskId)
      if (!task) return

      const oldStatus = task.status

      // Optimistic update for currentTasks
      if (currentTasks.some(t => t.id === taskId)) {
        setCurrentTasks(currentTasks.map(t =>
          t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
        ))
      }

      // Optimistic update for allTasks (used by project pages)
      setAllTasks(allTasks.map(t =>
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

      // Log status change
      await activityLogger.logTaskStatusChanged(task, oldStatus, newStatus)

      // Refresh the view - check both primary and secondary notes
      const isProjectView = selectedNote?.note_type === 'project' || secondaryNote?.note_type === 'project'

      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      } else if (isProjectView) {
        // Refresh allTasks to update project task lists
        await fetchAllTasks()
      }
    } catch (error) {
      console.error('Error changing task status:', error)
      // Rollback on error
      const isProjectView = selectedNote?.note_type === 'project' || secondaryNote?.note_type === 'project'

      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      } else if (isProjectView) {
        await fetchAllTasks()
      }
    }
  }

  /**
   * Toggle task star status in tasks table
   * When starring: BACKLOG → PLANNED, scheduled_date → today
   * When unstarring: PLANNED → BACKLOG
   *
   * @param {string} taskId - Unique task ID
   */
  const toggleTaskStar = async (taskId) => {
    try {
      // Find the task in either currentTasks or allTasks
      const task = currentTasks.find(t => t.id === taskId) || allTasks.find(t => t.id === taskId)
      if (!task) return

      const newStarredState = !task.starred
      const updates = { starred: newStarredState }

      // Get today's date in local timezone
      const today = new Date()
      const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      // Auto-adjust status and schedule when starring/unstarring
      if (newStarredState) {
        // Starring a task
        if (task.status === 'BACKLOG') {
          updates.status = 'PLANNED'
        }
        // Set scheduled_date to today if not already scheduled
        if (!task.scheduled_date) {
          updates.scheduled_date = todayISO
        }
      } else {
        // Unstarring a task
        if (task.status === 'PLANNED') {
          updates.status = 'BACKLOG'
        }
        // If the task was scheduled for today, clear the date
        if (task.scheduled_date === todayISO) {
          updates.scheduled_date = null
        }
      }

      // Optimistic update for currentTasks
      if (currentTasks.some(t => t.id === taskId)) {
        setCurrentTasks(currentTasks.map(t =>
          t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
        ))
      }

      // Optimistic update for allTasks (used by project pages)
      setAllTasks(allTasks.map(t =>
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

      // Log star toggle
      await activityLogger.logTaskStarred(task, newStarredState)

      // Refresh the view - check both primary and secondary notes
      const isProjectView = selectedNote?.note_type === 'project' || secondaryNote?.note_type === 'project'

      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      } else if (isProjectView) {
        await fetchAllTasks()
      }
    } catch (error) {
      console.error('Error toggling task star:', error)
      // Rollback on error
      const isProjectView = selectedNote?.note_type === 'project' || secondaryNote?.note_type === 'project'

      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      } else if (isProjectView) {
        await fetchAllTasks()
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
    console.log('📅 scheduleTask called:', { taskId, scheduledDate, selectedNoteType: selectedNote?.note_type, secondaryNoteType: secondaryNote?.note_type })

    try {
      // Find the task in either currentTasks or allTasks
      const task = currentTasks.find(t => t.id === taskId) || allTasks.find(t => t.id === taskId)
      if (!task) {
        console.log('❌ Task not found:', taskId)
        return
      }

      console.log('✅ Task found:', { taskId: task.id, currentSchedule: task.scheduled_date, newSchedule: scheduledDate, currentStarred: task.starred })

      // Get today's date in local timezone
      const today = new Date()
      const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      const updates = { scheduled_date: scheduledDate }

      // If scheduling a date and status is BACKLOG, auto-set to PLANNED
      // Don't auto-change status for SOMEDAY
      if (scheduledDate && scheduledDate !== 'SOMEDAY' && task.status === 'BACKLOG') {
        updates.status = 'PLANNED'
      }

      // Bidirectional star/today relationship
      if (scheduledDate === todayISO) {
        // Scheduling to today? Auto-star the task
        updates.starred = true
        console.log('⭐ Auto-starring task because scheduled to today')
      } else if (task.scheduled_date === todayISO && scheduledDate !== todayISO) {
        // Changing from today to another date? Auto-unstar if currently starred
        if (task.starred) {
          updates.starred = false
          console.log('☆ Auto-unstarring task because moved from today')
        }
      }

      // Optimistic update for currentTasks
      if (currentTasks.some(t => t.id === taskId)) {
        setCurrentTasks(currentTasks.map(t =>
          t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
        ))
      }

      // Optimistic update for allTasks (used by project pages)
      setAllTasks(allTasks.map(t =>
        t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      ))

      console.log('🔄 Optimistic updates applied')

      // Update in database
      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      console.log('💾 Database updated successfully')

      // Log task scheduling (only if a date is set)
      if (scheduledDate) {
        await activityLogger.logTaskScheduled(task, scheduledDate)
      }

      // Refresh the view - check both primary and secondary notes
      const isProjectView = selectedNote?.note_type === 'project' || secondaryNote?.note_type === 'project'

      if (selectedNote?.note_type === 'task_list') {
        console.log('🔄 Refreshing task list view:', selectedNote.title)
        await fetchTasksForView(selectedNote.title)
      } else if (isProjectView) {
        console.log('🔄 Refreshing allTasks for project view')
        await fetchAllTasks()
      }

      console.log('✅ scheduleTask completed')
    } catch (error) {
      console.error('❌ Error scheduling task:', error)
      // Rollback on error
      if (selectedNote?.note_type === 'task_list') {
        await fetchTasksForView(selectedNote.title)
      } else if (selectedNote?.note_type === 'project' || secondaryNote?.note_type === 'project') {
        await fetchAllTasks()
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
  /task "text"                    Quick add task to Tasks list
  /task "text" :today             Add task scheduled for today (status: PLANNED)
  /task "text" :project           Add task to current project (when on project page)
  /task "text" :note "details"    Add task with context notes
  add task "text" to/in today     Add task to Today list
  add task "text" to/in week      Add task to Week list
  add task "text" to/in tasks     Add task to Tasks list

COMBINE OPTIONS:
  /task "text" :today :note "note"     Schedule for today with notes
  /task "text" :project :today         Add to project, scheduled today
  add task "text" to tasks :today :note "note"  Full syntax example

PROJECT MANAGEMENT:
  /project "Project Name"         Create a new project

INBOX:
  /inbox "title"                  Quick capture to Inbox
  /inbox "title" :note "text"     Capture with multi-line notes

NAVIGATION:
  goto today                      Navigate to Today
  goto week                       Navigate to Week
  goto tasks                      Navigate to Tasks
  goto inbox                      Navigate to Inbox
  goto log                        Navigate to Log
  goto home                       Navigate to HOME
  goto "Note Title"               Navigate to any note by title

TIMER:
  start timer 30                  Start a 30-minute timer with dots

LOGGING:
  /log <text>                     Log an event or note (e.g., "meeting with Prasad")
  /log energy <0-5>               Log your energy level (0=exhausted, 5=energized)

AI COMMANDS (requires Claude API key):
  /joke                           Get a programming joke
  /tip                            Get a productivity tip
  /quote                          Get an inspiring quote
  /fact                           Get a tech fact
  /ask <question>                 Ask Claude anything
  /explain <concept>              Get an explanation
  /brainstorm <topic>             Get brainstorming ideas

COMING SOON:
  complete task 3                 Mark task #3 as complete
  star task 5                     Star task #5 (add to Today)

TIPS:
• Press ↑/↓ to navigate command history
• Use :today to schedule tasks and set status to PLANNED
• Use :project to add tasks to the current project
• Use :note "text" to add context/details to tasks or inbox items
• You can combine :today, :project, and :note in any order
• Star tasks to add them to Today list
• Drag tasks to reorder them
• Use /inbox for quick capture of ideas and information
• Add VITE_CLAUDE_API_KEY to .env to enable AI commands

Type /help anytime to see this message.`
        }

        case 'ADD_TASK': {
          const { text, target, scheduleToday, note, addToProject } = command.payload
          let targetNote = null

          // Auto-detect project page: if on a project page and using /task without explicit target
          // OR if :project flag is present
          if ((selectedNote?.note_type === 'project' && target === 'tasks') ||
              (addToProject && selectedNote?.note_type === 'project')) {
            await addTask(text, null, { scheduleToday, note, projectId: selectedNote.id })
            let statusMsg = ''
            if (scheduleToday) statusMsg += ' (scheduled for today, status: PLANNED)'
            if (note) statusMsg += ' (note added)'
            return `✓ Task added to project "${selectedNote.title}"${statusMsg}`
          }

          // Handle regular task list targets
          if (target === 'today' && todayNote) {
            targetNote = todayNote
          } else if (target === 'week' && weekNote) {
            targetNote = weekNote
          } else if (target === 'tasks' && tasksNote) {
            targetNote = tasksNote
          }

          if (targetNote) {
            await addTask(text, targetNote, { scheduleToday, note })
            let statusMsg = ''
            if (scheduleToday) statusMsg += ' (scheduled for today, status: PLANNED)'
            if (note) statusMsg += ' (note added)'
            return `✓ Task added to ${target}${statusMsg}`
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
          let foundNote = null

          console.log('🔍 GOTO command called, target:', target, 'notes count:', notes.length)

          // Search directly in notes array for special pages
          if (target.toLowerCase() === 'today') {
            foundNote = notes.find(n => n.note_type === 'task_list' && n.title === 'Today')
          } else if (target.toLowerCase() === 'week') {
            foundNote = notes.find(n => n.note_type === 'task_list' && n.title === 'Week')
          } else if (target.toLowerCase() === 'tasks') {
            foundNote = notes.find(n => n.note_type === 'task_list' && n.title === 'Tasks')
          } else if (target.toLowerCase() === 'inbox') {
            foundNote = notes.find(n => n.note_type === 'inbox_list' && n.title === 'Inbox')
          } else if (target.toLowerCase() === 'log') {
            foundNote = notes.find(n => n.note_type === 'log_list' && n.title === 'Log')
          } else if (target.toLowerCase() === 'home') {
            foundNote = notes.find(n => n.is_home === true)
          } else {
            // Search by title
            foundNote = notes.find(n => n.title.toLowerCase() === target.toLowerCase())
          }

          console.log('📝 GOTO found note:', {
            found: !!foundNote,
            id: foundNote?.id,
            title: foundNote?.title,
            note_type: foundNote?.note_type,
            content_length: foundNote?.content?.length
          })

          if (foundNote) {
            setSelectedNote(foundNote)
            setSidebarOpen(false)
            return `✓ Navigated to ${foundNote.title}`
          }

          return `✗ Note "${target}" not found`
        }

        case 'START_TIMER': {
          const { minutes } = command.payload
          const totalSeconds = minutes * 60
          const intervalSeconds = 30

          setTimerConfig({
            totalSeconds,
            intervalSeconds,
            durationMinutes: minutes // Store original duration for logging
          })

          // Log timer start
          await activityLogger.logTimerStarted(minutes)

          return `✓ Timer started for ${minutes} minute${minutes !== 1 ? 's' : ''}`
        }

        case 'PROJECT': {
          const { name } = command.payload
          try {
            const newProject = await createProjectNote(name)
            setSelectedNote(newProject)
            setSidebarOpen(false)
            return `✓ Project "${name}" created and opened`
          } catch (error) {
            return `✗ Error creating project: ${error.message}`
          }
        }

        case 'INBOX': {
          const { title, note } = command.payload
          try {
            const newInboxItem = await createInboxItem(title, note)
            let statusMsg = ''
            if (note) {
              const lineCount = note.split('\n').length
              statusMsg = ` (${lineCount} line${lineCount !== 1 ? 's' : ''} of notes)`
            }
            return `✓ Item added to Inbox: "${title}"${statusMsg}`
          } catch (error) {
            return `✗ Error adding to inbox: ${error.message}`
          }
        }

        // AI Commands
        case 'AI_JOKE': {
          try {
            const joke = await getJoke()
            return `🤖 ${joke}`
          } catch (error) {
            return `✗ ${error.message}`
          }
        }

        case 'AI_TIP': {
          try {
            const tip = await getTip()
            return `💡 ${tip}`
          } catch (error) {
            return `✗ ${error.message}`
          }
        }

        case 'AI_QUOTE': {
          try {
            const quote = await getQuote()
            return `✨ ${quote}`
          } catch (error) {
            return `✗ ${error.message}`
          }
        }

        case 'AI_FACT': {
          try {
            const fact = await getFact()
            return `🔬 ${fact}`
          } catch (error) {
            return `✗ ${error.message}`
          }
        }

        case 'AI_ASK': {
          const { question } = command.payload
          try {
            const answer = await callClaude(question, { maxTokens: 500 })
            return `🤖 ${answer}`
          } catch (error) {
            return `✗ ${error.message}`
          }
        }

        case 'AI_EXPLAIN': {
          const { concept } = command.payload
          try {
            const explanation = await explainConcept(concept)
            return `📚 ${explanation}`
          } catch (error) {
            return `✗ ${error.message}`
          }
        }

        case 'AI_BRAINSTORM': {
          const { topic } = command.payload
          try {
            const ideas = await brainstormIdeas(topic)
            return `💭 ${ideas}`
          } catch (error) {
            return `✗ ${error.message}`
          }
        }

        case 'LOG_ENERGY': {
          const { level } = command.payload
          try {
            // Import activityLogService dynamically
            const { create } = await import('./services/activityLogService')

            await create({
              action_type: 'energy_logged',
              entity_type: 'energy',
              entity_id: null,
              entity_ref_id: null,
              entity_title: `Energy: ${level}`,
              details: {
                energy_level: level
              },
              timestamp: new Date().toISOString()
            })

            // Trigger log page refresh
            setLogUpdateTrigger(prev => prev + 1)

            return `✓ Energy level ${level} logged`
          } catch (error) {
            return `✗ Error logging energy: ${error.message}`
          }
        }

        case 'LOG_WATER': {
          try {
            // Import activityLogService dynamically
            const { create } = await import('./services/activityLogService')

            await create({
              action_type: 'water_logged',
              entity_type: 'water',
              entity_id: null,
              entity_ref_id: null,
              entity_title: 'Water',
              details: {},
              timestamp: new Date().toISOString()
            })

            // Trigger log page refresh
            setLogUpdateTrigger(prev => prev + 1)

            return `✓ Water intake logged 💧`
          } catch (error) {
            return `✗ Error logging water: ${error.message}`
          }
        }

        case 'REMINDER': {
          const { input } = command.payload
          try {
            // Import utilities
            const { parseNaturalTime, formatReminderTime } = await import('./utils/dateUtils')
            const { create } = await import('./services/activityLogService')

            // Parse the input to extract time and reminder text
            const parsed = parseNaturalTime(input)
            if (!parsed || !parsed.date) {
              return `✗ Could not parse time from: ${input}`
            }

            const { date, remainingText } = parsed
            const reminderText = remainingText || input

            // Create reminder log entry
            await create({
              action_type: 'reminder_created',
              entity_type: 'reminder',
              entity_id: null,
              entity_ref_id: null,
              entity_title: reminderText,
              details: {
                reminder_time: date.toISOString(),
                status: 'pending'
              },
              timestamp: new Date().toISOString()
            })

            // Trigger log page refresh
            setLogUpdateTrigger(prev => prev + 1)

            const formattedTime = formatReminderTime(date)
            return `✓ Reminder set for ${formattedTime}: ${reminderText}`
          } catch (error) {
            console.error('Error creating reminder:', error)
            return `✗ Error creating reminder: ${error.message}`
          }
        }

        case 'LOG_ENTRY': {
          const { text } = command.payload
          try {
            // Import activityLogService dynamically
            const { create } = await import('./services/activityLogService')

            await create({
              action_type: 'log_entry',
              entity_type: 'log',
              entity_id: null,
              entity_ref_id: null,
              entity_title: text,
              details: {},
              timestamp: new Date().toISOString()
            })

            // Trigger log page refresh
            setLogUpdateTrigger(prev => prev + 1)

            return `✓ Logged: ${text}`
          } catch (error) {
            return `✗ Error logging: ${error.message}`
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
    const home = notes.find(n => n.is_home === true)
    if (home) {
      setSelectedNote(home)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }
  }

  const goToTasks = () => {
    console.log('🔍 goToTasks called, searching notes:', notes.length)
    const tasks = notes.find(n => n.note_type === 'task_list' && n.title === 'Tasks')
    console.log('📝 Found Tasks note:', {
      found: !!tasks,
      id: tasks?.id,
      title: tasks?.title,
      note_type: tasks?.note_type,
      content_length: tasks?.content?.length
    })
    if (tasks) {
      setSelectedNote(tasks)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    } else {
      console.error('❌ Tasks note not found!')
    }
  }

  const goToInbox = () => {
    const inbox = notes.find(n => n.note_type === 'inbox_list' && n.title === 'Inbox')
    if (inbox) {
      setSelectedNote(inbox)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }
  }

  const goToProjects = () => {
    const projects = notes.find(n => n.note_type === 'project_list' && n.title === 'Projects')
    if (projects) {
      setSelectedNote(projects)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }
  }

  const goToLog = () => {
    const log = notes.find(n => n.note_type === 'log_list' && n.title === 'Log')
    if (log) {
      setSelectedNote(log)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-fg-secondary">Loading notes...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Session Context Band - only shown when timer is active */}
      {timerConfig && (
        <div className="w-full bg-bg-primary border-b border-border-secondary py-2 px-4 flex items-center justify-center">
          <input
            type="text"
            value={sessionContext}
            onChange={(e) => setSessionContext(e.target.value)}
            placeholder="What are you working on?"
            className="max-w-md w-full bg-bg-secondary border border-border-primary rounded px-3 py-1.5 text-sm text-fg-primary placeholder-fg-tertiary focus:outline-none focus:border-border-focus focus:bg-bg-tertiary text-center"
            maxLength={60}
          />
        </div>
      )}

      {/* Control Panel */}
      <div className="fixed top-6 left-6 z-50 flex gap-2">
        {/* Hide hamburger menu on task lists, project pages, and log page */}
        {selectedNote?.note_type !== 'task_list' &&
         selectedNote?.note_type !== 'project' &&
         selectedNote?.note_type !== 'project_list' &&
         selectedNote?.note_type !== 'log_list' && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 bg-bg-elevated border border-border-primary rounded hover:bg-bg-tertiary transition-colors"
            title="Toggle sidebar"
          >
            <Menu size={18} className="text-fg-secondary" />
          </button>
        )}

        {/* Theme toggle removed - use Settings > Theme tab instead */}
      </div>

      {/* Vertical Navigation Sidebar */}
      <div className="fixed left-6 top-[20%] z-40 flex flex-col gap-2 group py-4 px-2 -ml-2">
        <button
          onClick={(e) => {
            const inbox = notes.find(n => n.note_type === 'inbox_list' && n.title === 'Inbox')
            if (e.shiftKey && inbox) {
              setSecondaryNote(inbox)
            } else {
              goToInbox()
            }
          }}
          className="p-3 bg-bg-elevated border border-border-primary rounded hover:bg-bg-tertiary transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
          title="Inbox (Shift+click for side-by-side)"
        >
          <Inbox size={20} className="text-fg-secondary" />
        </button>

        <button
          onClick={(e) => {
            const tasks = notes.find(n => n.note_type === 'task_list' && n.title === 'Tasks')
            if (e.shiftKey && tasks) {
              setSecondaryNote(tasks)
            } else {
              goToTasks()
            }
          }}
          className="p-3 bg-bg-elevated border border-border-primary rounded hover:bg-bg-tertiary transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
          title="Tasks (Shift+click for side-by-side)"
        >
          <ListTodo size={20} className="text-fg-secondary" />
        </button>

        <button
          onClick={(e) => {
            const projects = notes.find(n => n.note_type === 'project_list' && n.title === 'Projects')
            if (e.shiftKey && projects) {
              setSecondaryNote(projects)
            } else {
              goToProjects()
            }
          }}
          className="p-3 bg-bg-elevated border border-border-primary rounded hover:bg-bg-tertiary transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
          title="Projects (Shift+click for side-by-side)"
        >
          <FolderKanban size={20} className="text-fg-secondary" />
        </button>

        <button
          onClick={(e) => {
            const home = notes.find(n => n.is_home === true)
            if (e.shiftKey && home) {
              setSecondaryNote(home)
            } else {
              goToHome()
            }
          }}
          className="p-3 bg-bg-elevated border border-border-primary rounded hover:bg-bg-tertiary transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
          title="Home (Shift+click for side-by-side)"
        >
          <Home size={20} className="text-fg-secondary" />
        </button>

        <button
          onClick={(e) => {
            const log = notes.find(n => n.note_type === 'log_list' && n.title === 'Log')
            if (e.shiftKey && log) {
              setSecondaryNote(log)
            } else {
              goToLog()
            }
          }}
          className="p-3 bg-bg-elevated border border-border-primary rounded hover:bg-bg-tertiary transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
          title="Log (Shift+click for side-by-side)"
        >
          <ScrollText size={20} className="text-fg-secondary" />
        </button>

        {/* Spacer to push settings to bottom */}
        <div className="flex-1"></div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-3 bg-bg-elevated border border-border-primary rounded hover:bg-bg-tertiary transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
          title="Settings"
        >
          <Settings size={20} className="text-fg-secondary" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`sidebar-container fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
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
        <div className="main-content-area flex-1 flex justify-center items-center overflow-hidden p-8 md:p-16 gap-4">
          {/* Primary note editor */}
          <div className={`w-full h-full ${secondaryNote || selectedTask ? 'max-w-2xl' : 'max-w-6xl'} max-h-[800px] transition-all`}>
            <NoteEditor
              note={selectedNote}
              allNotes={notes}
              currentTasks={currentTasks}
              allTasks={allTasks}
              selectedTaskId={selectedTaskId}
              onTaskSelect={(taskId) => {
                setSelectedTaskId(taskId)
                setDeselectionPending(false) // Reset flag when selecting a task by clicking
              }}
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
              onTaskDoubleClick={(task) => {
                console.log('📋 Opening task panel:', { taskId: task?.id, taskText: task?.text })
                const taskIndex = currentTasks.findIndex(t => t.id === task.id)
                setSelectedTaskNumber(taskIndex >= 0 ? taskIndex + 1 : null)
                setSelectedTask(task)
              }}
              onProjectClick={handleProjectClick}
              statusFilter={statusFilter}
              taskTypeFilter={taskTypeFilter}
              onStatusFilterChange={setStatusFilter}
              onTaskTypeFilterChange={setTaskTypeFilter}
              todaysReminders={todaysReminders}
              onToggleReminderComplete={async (reminderId) => {
                try {
                  await activityLogger.logReminderCompleted(reminderId)
                  // Refresh reminders
                  const reminders = await activityLogService.fetchTodaysReminders()
                  setTodaysReminders(reminders)
                } catch (error) {
                  console.error('Error toggling reminder:', error)
                }
              }}
              logUpdateTrigger={logUpdateTrigger}
            />
          </div>

          {/* Secondary note editor (side-by-side) */}
          {secondaryNote && (
            <div className="w-full h-full max-w-2xl max-h-[800px] relative">
              {/* Close button */}
              <button
                onClick={() => setSecondaryNote(null)}
                className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-bg-elevated hover:bg-bg-tertiary flex items-center justify-center text-fg-secondary text-sm font-bold border border-border-primary"
                title="Close side panel"
              >
                ×
              </button>
              <NoteEditor
                note={secondaryNote}
                allNotes={notes}
                currentTasks={secondaryTasks} // Show tasks in secondary view
                allTasks={allTasks}
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
                onToggleTaskComplete={toggleTaskComplete}
                onToggleTaskStar={toggleTaskStar}
                onChangeTaskStatus={changeTaskStatus}
                onScheduleTask={scheduleTask}
                onReorderTasks={reorderTasks}
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
                onTaskDoubleClick={(task) => {
                  console.log('📋 Opening task panel from secondary view:', { taskId: task?.id, taskText: task?.text })
                  const taskIndex = allTasks.findIndex(t => t.id === task.id)
                  setSelectedTaskNumber(taskIndex >= 0 ? taskIndex + 1 : null)
                  setSelectedTask(task)
                }}
                onProjectClick={handleProjectClick}
                selectedTaskId={selectedTaskId}
                onTaskSelect={(taskId) => {
                  setSelectedTaskId(taskId)
                  setDeselectionPending(false)
                }}
                statusFilter={statusFilter}
                taskTypeFilter={taskTypeFilter}
                onStatusFilterChange={setStatusFilter}
                onTaskTypeFilterChange={setTaskTypeFilter}
                logUpdateTrigger={logUpdateTrigger}
              />
            </div>
          )}

          {/* Task Detail Panel */}
          {selectedTask && !secondaryNote && (
            <div className="w-full h-full max-w-xl max-h-[800px]">
              <TaskDetail
                task={selectedTask}
                taskNumber={selectedTaskNumber}
                onClose={() => {
                  setSelectedTask(null)
                  setSelectedTaskNumber(null)
                }}
                onSave={saveTask}
                showPriorityFormula={uiPreferences.show_priority_formula}
              />
            </div>
          )}
        </div>
      </div>

      {/* Terminal - fixed at bottom */}
      <Terminal ref={terminalRef} onCommand={handleCommand} />

      {/* Timer - overlay when active (always mounted, just hidden when minimized) */}
      {timerConfig && (
        <div className={isTimerMinimized ? 'hidden' : ''}>
          <Timer
            totalSeconds={timerConfig.totalSeconds}
            intervalSeconds={timerConfig.intervalSeconds}
            onComplete={async () => {
              // Log timer completion
              await activityLogger.logTimerCompleted(timerConfig.durationMinutes)
              setTimerConfig(null)
              setSessionContext('')
              setIsTimerMinimized(false)
            }}
            onClose={async () => {
              // Log timer cancellation (if remaining time > 0)
              if (timerRemainingSeconds > 0) {
                await activityLogger.logTimerCancelled(timerConfig.durationMinutes, timerRemainingSeconds)
              }
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

      {/* Floating Audio Player */}
      <FloatingAudioPlayer key={musicLinksUpdateTrigger} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentThemeId={currentThemeId}
        onThemeChange={handleThemeChange}
        onMusicLinksChanged={handleMusicLinksChanged}
        onUIPreferencesChanged={handleUIPreferencesChanged}
      />
    </div>
  )
}

export default App
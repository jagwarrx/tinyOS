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
import SearchModal from './components/SearchModal'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'
import WorkspaceView from './components/workspace/WorkspaceView'
import TagFilteredView from './components/TagFilteredView'
import DiagramEditor from './components/DiagramEditor'
import MindmapEditor from './components/MindmapEditor'
import { useNotes } from './contexts/NotesContext'
import { useTasks } from './contexts/TasksContext'
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
import { filterTasksByTags, getNotesForTag, getTasksForTag, tagTask, createTagsFromPath } from './services/tagService'

function App() {
  // Use contexts for state management
  const {
    notes,
    selectedNote,
    secondaryNote,
    homeNote,
    projectsNote,
    inboxNote,
    tasksNote,
    todayNote,
    weekNote,
    somedayNote,
    logNote,
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
    updateNote: saveNoteToContext,
    deleteNote: deleteNoteFromContext,
    toggleStar: toggleNoteStarFromContext,
    setAsHome: setAsHomeFromContext,
    setLink,
    removeLink,
    createNote: createNoteFromContext,
    createDraftLinkedNote: createDraftLinkedNoteFromContext,
    navigateToNote,
    loading: notesLoading
  } = useNotes()

  const {
    allTasks,
    currentTasks,
    selectedTask,
    selectedTaskId,
    statusFilter,
    taskTypeFilter,
    tagFilter,
    selectTask,
    setSelectedTaskId: setTaskIdFromContext,
    setStatusFilter,
    setTaskTypeFilter,
    setTagFilter,
    setCurrentTasks,
    toggleComplete,
    toggleStar: toggleTaskStar,
    scheduleTask,
    changeStatus,
    updateTask,
    deleteTask,
    createTask,
    reorderTasks: reorderTasksFromContext,
    fetchAllTasks
  } = useTasks()

  // Ref for terminal component
  const terminalRef = useRef(null)

  // Local UI state only (not managed by contexts)
  const [selectedTaskNumber, setSelectedTaskNumber] = useState(null) // Task number in current view
  const [deselectionPending, setDeselectionPending] = useState(false) // For two-step deselection on Today page
  const [secondaryTasks, setSecondaryTasks] = useState([]) // Tasks for secondary pane

  // Reminders state (from activity_log table)
  const [todaysReminders, setTodaysReminders] = useState([]) // Reminders for today

  // UI state (loading is now managed by contexts)
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

  // New modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false)

  // Workspace state
  const [isInWorkspace, setIsInWorkspace] = useState(false)
  const [workspaceTask, setWorkspaceTask] = useState(null)

  // Tag navigation state
  const [selectedTag, setSelectedTag] = useState(null)
  const [filteredNotes, setFilteredNotes] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])

  // Diagram editor state
  const [isDiagramEditorOpen, setIsDiagramEditorOpen] = useState(false)
  const [currentDiagramNote, setCurrentDiagramNote] = useState(null)

  // Mindmap editor state
  const [isMindmapEditorOpen, setIsMindmapEditorOpen] = useState(false)
  const [currentMindmapNote, setCurrentMindmapNote] = useState(null)

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

      // ?: Show keyboard shortcuts help
      if (e.key === '?' && isNotEditing) {
        e.preventDefault()
        setIsKeyboardHelpOpen(true)
        return
      }

      // Cmd/Ctrl+K: Open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && isNotEditing) {
        e.preventDefault()
        setIsSearchOpen(true)
        return
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false)
          return
        }
        if (isKeyboardHelpOpen) {
          setIsKeyboardHelpOpen(false)
          return
        }
      }

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
        goToLogWrapper()
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
          selectTask(null)
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
            setTaskIdFromContext(null)
            return
          }

          // No highlight on Today page - navigate to Tasks page
          if (selectedNote?.title === 'Today' && tasksNote) {
            e.preventDefault()
            console.log('  → Navigation reset on Today, navigating to Tasks')
            selectNote(tasksNote)
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
              reorderTasksFromContext(currentIndex, currentIndex - 1)
            }
          } else {
            // Up: Select previous task (use navigableTasks for selection)
            const currentIndex = navigableTasks.findIndex(t => t.id === selectedTaskId)
            console.log('  Current index in navigable tasks:', currentIndex)

            if (currentIndex === -1) {
              // No selection, select first task
              console.log('  → Selecting first task:', navigableTasks[0]?.id)
              setTaskIdFromContext(navigableTasks[0].id)
            } else if (currentIndex > 0) {
              // Select previous task
              console.log('  → Selecting previous task:', navigableTasks[currentIndex - 1].id)
              setTaskIdFromContext(navigableTasks[currentIndex - 1].id)
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
              reorderTasksFromContext(currentIndex, currentIndex + 1)
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
              setTaskIdFromContext(firstTaskId)
              // Log after state update to verify
              setTimeout(() => {
                console.log('  → State after selection:', { selectedTaskId: firstTaskId })
              }, 0)
            } else if (currentIndex < navigableTasks.length - 1) {
              // Select next task
              console.log('  → Selecting next task:', navigableTasks[currentIndex + 1].id)
              setTaskIdFromContext(navigableTasks[currentIndex + 1].id)
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
              selectTask(task)
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
  }, [selectedNote, currentTasks, selectedTaskId, selectedTask, deselectionPending, tasksNote, isSearchOpen, isKeyboardHelpOpen])

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

  // Initial setup on mount (contexts handle data fetching)
  useEffect(() => {
    loadTheme()
    loadFont()
    loadUIMode()
    handleUIPreferencesChanged()
  }, [])

  // Update URL when selectedNote changes
  useEffect(() => {
    if (selectedNote?.ref_id) {
      // Update browser URL to show ref_id
      const newPath = `/${selectedNote.ref_id}`
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, '', newPath)
      }
    }
  }, [selectedNote])

  // Navigate to note from URL on initial load
  useEffect(() => {
    const navigateFromUrl = async () => {
      const path = window.location.pathname
      // Remove leading slash
      const refId = path.substring(1)

      if (refId && refId.length > 0 && notes.length > 0) {
        // Try to find note by ref_id
        const noteFromUrl = notes.find(n => n.ref_id === refId)
        if (noteFromUrl && (!selectedNote || selectedNote.ref_id !== refId)) {
          console.log('📍 Navigating to note from URL:', refId)
          selectNote(noteFromUrl)
        }
      } else if (path === '/' && notes.length > 0 && homeNote && !selectedNote) {
        // If root path and no note selected yet, go to home
        console.log('📍 Navigating to home note (root path)')
        selectNote(homeNote)
      }
    }

    navigateFromUrl()
  }, [notes, selectedNote, homeNote])

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

  // Special notes initialization now handled by NotesContext

  // Old note creation functions removed - now handled by NotesContext

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
   * Create a new diagram note
   * Diagram notes have note_type='diagram' and can be referenced via ref_id
   *
   * @param {string} diagramName - The name/title of the diagram
   * @param {string} projectId - Optional project ID to link the diagram to
   * @returns {object} - The created diagram note
   */
  const createDiagramNote = async (diagramName, projectId = null) => {
    try {
      const diagramNoteData = {
        title: diagramName,
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
        note_type: 'diagram',
        diagram_xml: null, // Will be set when user saves in diagram editor
        diagram_svg: null, // Will be set when user saves
        project_id: projectId, // Link to project if provided
        is_starred: false,
        is_home: false,
        up_id: null,
        down_id: null,
        left_id: null,
        right_id: null,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([diagramNoteData])
        .select()
        .single()

      if (error) throw error

      // Reload notes from context
      // Since we're using contexts, we should use the context method
      // But for now, we'll just manually refetch
      const { data: allNotes } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false })

      // We don't have direct access to setNotes from context here,
      // so we'll return the note and handle navigation

      return data
    } catch (error) {
      console.error('Error creating diagram note:', error.message)
      throw error
    }
  }

  /**
   * Create a new mindmap note
   * Mindmap notes have note_type='mindmap' and can be referenced via ref_id
   *
   * @param {string} mindmapName - The name/title of the mindmap
   * @param {string} projectId - Optional project ID to link the mindmap to
   * @returns {object} - The created mindmap note
   */
  const createMindmapNote = async (mindmapName, projectId = null) => {
    try {
      const mindmapNoteData = {
        title: mindmapName,
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
        note_type: 'mindmap',
        mindmap_markdown: null, // Will be set when user saves in mindmap editor
        mindmap_svg: null, // Will be set when user saves
        project_id: projectId, // Link to project if provided
        is_starred: false,
        is_home: false,
        up_id: null,
        down_id: null,
        left_id: null,
        right_id: null,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([mindmapNoteData])
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error creating mindmap note:', error.message)
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

  // Old note CRUD functions removed - using context versions:
  // - createTaskNotes -> handled by NotesContext initialization
  // - createNote -> use createNoteFromContext
  // - createDraftLinkedNote -> use createDraftLinkedNoteFromContext

  // Old note CRUD and link functions removed - using context versions:
  // - saveNote -> use saveNoteToContext (updateNote)
  // - deleteNote -> use deleteNoteFromContext
  // - setAsHome -> use setAsHomeFromContext
  // - toggleStar -> use toggleNoteStarFromContext
  // - setUpLink, setDownLink, setLeftLink, setRightLink -> use setLink(sourceId, targetId, direction)
  // - removeUpLink, removeDownLink, removeLeftLink, removeRightLink -> use removeLink(sourceId, direction)
  // - navigateToLinkedNote -> use navigateToNote from context

  // Helper function for checking empty content
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

  /**
   * Navigate to a project note
   * Called when clicking on a project card in ProjectsList
   */
  const handleProjectClick = (project) => {
    selectNote(project)
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
            selectNote(data)
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
            selectTask(taskData)
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

      const updatedTaskWithTimestamp = { ...updatedTask, updated_at: new Date().toISOString() }

      // Update local state
      setCurrentTasks(currentTasks.map(t =>
        t.id === updatedTask.id ? updatedTaskWithTimestamp : t
      ))
      selectTask(updatedTaskWithTimestamp)

      // Update workspace task if in workspace mode
      if (isInWorkspace && workspaceTask && workspaceTask.id === updatedTask.id) {
        setWorkspaceTask(updatedTaskWithTimestamp)
      }

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

      // Apply tag filter if selected
      if (tagFilter && tagFilter.length > 0) {
        updatedTasks = await filterTasksByTags(updatedTasks, tagFilter)
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
      setTaskIdFromContext(null)
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
        setTaskIdFromContext(null)
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

  // Re-fetch tasks when tag filter changes
  useEffect(() => {
    if (selectedNote?.note_type === 'task_list') {
      fetchTasksForView(selectedNote.title)
    }
  }, [tagFilter])

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
        selectNote(foundNote)
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
   * @param {object} options - Optional parameters { scheduleToday: boolean, note: string, projectId: string, tag: string }
   *
   * Process:
   * 1. Get highest priority to determine new task's priority
   * 2. Create new task with appropriate status and starred flag
   * 3. Insert into tasks table
   * 4. If tag provided, apply tag to task
   * 5. Refresh the current view
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

      // Apply tag if provided
      if (data && data[0] && options.tag) {
        try {
          await tagTask(data[0].id, options.tag)
        } catch (tagError) {
          console.error('Error tagging task:', tagError)
          // Don't throw - task was created successfully, just tagging failed
        }
      }

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

  // Old task CRUD functions removed - using context versions:
  // - toggleTaskComplete -> use toggleComplete from TasksContext
  // - changeTaskStatus -> use changeStatus from TasksContext
  // - toggleTaskStar -> use toggleStar from TasksContext
  // - scheduleTask -> use scheduleTask from TasksContext

  // Old reorderTasks function removed - use reorderTasksFromContext

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
  /task "text #tag/path"          Add task with hierarchical tag (e.g., #work/qbotica)
  add task "text" to/in today     Add task to Today list
  add task "text" to/in week      Add task to Week list
  add task "text" to/in tasks     Add task to Tasks list

COMBINE OPTIONS:
  /task "text #tag" :today :note "note"         Schedule for today with tag and notes
  /task "text #work/project" :project :today    Add to project with tag, scheduled today
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
  /log <time> <text>              Log with specific time (e.g., "/log 10am meeting notes")
  /log <time> yesterday <text>    Log for past date (e.g., "/log 2pm yesterday called John")
  /log energy <0-5>               Log your energy level (0=exhausted, 5=energized)
  /log <text> #tag/path           Log with tag (e.g., "/log 10am standup #work/meetings")

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
• Use #tag/path in task text to organize with hierarchical tags (e.g., #work/project/feature)
• You can combine :today, :project, :note, and hashtags in any order
• Star tasks to add them to Today list
• Drag tasks to reorder them
• Use /inbox for quick capture of ideas and information
• Add VITE_CLAUDE_API_KEY to .env to enable AI commands

Type /help anytime to see this message.`
        }

        case 'ADD_TASK': {
          const { text, target, scheduleToday, note, tag, addToProject } = command.payload
          let targetNote = null

          // Auto-detect project page: if on a project page and using /task without explicit target
          // OR if :project flag is present
          if ((selectedNote?.note_type === 'project' && target === 'tasks') ||
              (addToProject && selectedNote?.note_type === 'project')) {
            await addTask(text, null, { scheduleToday, note, tag, projectId: selectedNote.id })

            // Build natural response message
            let message = `Task added to ${selectedNote.title}`
            if (scheduleToday) message += ' for Today'
            if (tag) message += ` with #${tag}`
            return message
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
            await addTask(text, targetNote, { scheduleToday, note, tag })

            // Build natural response message
            // Capitalize page name (today -> Today, tasks -> Tasks, week -> Week)
            const pageName = target.charAt(0).toUpperCase() + target.slice(1)
            let message = `Task added to ${pageName}`
            if (scheduleToday) message += ' for Today'
            if (tag) message += ` with #${tag}`
            return message
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
            selectNote(foundNote)
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
            selectNote(newProject)
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

        case 'DIAGRAM': {
          const { name } = command.payload
          try {
            // Check if we're on a project page and link the diagram to it
            const projectId = selectedNote?.note_type === 'project' ? selectedNote.id : null
            const newDiagram = await createDiagramNote(name, projectId)
            setCurrentDiagramNote(newDiagram)
            setIsDiagramEditorOpen(true)

            let message = `✓ Diagram "${name}" created`
            if (projectId) {
              message += ` and linked to ${selectedNote.title}`
            }
            message += '. Opening editor...'
            return message
          } catch (error) {
            return `✗ Error creating diagram: ${error.message}`
          }
        }

        case 'MINDMAP': {
          const { name } = command.payload
          try {
            // Check if we're on a project page and link the mindmap to it
            const projectId = selectedNote?.note_type === 'project' ? selectedNote.id : null
            const newMindmap = await createMindmapNote(name, projectId)
            setCurrentMindmapNote(newMindmap)
            setIsMindmapEditorOpen(true)

            let message = `✓ Mindmap "${name}" created`
            if (projectId) {
              message += ` and linked to ${selectedNote.title}`
            }
            message += '. Opening editor...'
            return message
          } catch (error) {
            return `✗ Error creating mindmap: ${error.message}`
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
          const { text, tag } = command.payload
          try {
            // Import utilities
            const { parseNaturalTime, formatLogTime } = await import('./utils/dateUtils')
            const { create } = await import('./services/activityLogService')

            // Try to parse time/date from the log text
            let logTimestamp = new Date()
            let logText = text
            const parsed = parseNaturalTime(text)

            if (parsed && parsed.date && parsed.remainingText) {
              // Time/date found - use parsed timestamp and remaining text
              logTimestamp = parsed.date
              logText = parsed.remainingText
            }

            // Prepare details object with tag information if provided
            const details = {}
            if (tag) {
              // Create tags and store tag IDs
              const tags = await createTagsFromPath(tag)
              details.tags = tags.map(t => ({
                id: t.id,
                name: t.name,
                full_path: t.full_path,
                level: t.level
              }))
            }

            await create({
              action_type: 'log_entry',
              entity_type: 'log',
              entity_id: null,
              entity_ref_id: null,
              entity_title: logText,
              details,
              timestamp: logTimestamp.toISOString()
            })

            // Trigger log page refresh
            setLogUpdateTrigger(prev => prev + 1)

            // Build confirmation message
            const timeStr = formatLogTime(logTimestamp)
            let message = `Logged "${logText}" for ${timeStr}`
            if (tag) message += ` with #${tag}`
            return message
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

  // Wrap context navigation functions with sidebar close logic
  const goToHomeWrapper = () => {
    goToHome()
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const goToTasksWrapper = () => {
    goToTasks()
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const goToInboxWrapper = () => {
    goToInbox()
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const goToProjectsWrapper = () => {
    goToProjects()
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const goToLogWrapper = () => {
    goToLog()
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  // Wrapper functions for NoteEditor props (to maintain old interface)
  const saveNote = async (updatedNote) => {
    return await saveNoteToContext(updatedNote.id, updatedNote)
  }

  const deleteNote = async (noteId) => {
    return await deleteNoteFromContext(noteId)
  }

  const setAsHome = async (noteId) => {
    return await setAsHomeFromContext(noteId)
  }

  const toggleStar = async (noteId) => {
    return await toggleNoteStarFromContext(noteId)
  }

  const setUpLink = async (sourceId, targetId) => {
    return await setLink(sourceId, targetId, 'up')
  }

  const removeUpLink = async (sourceId) => {
    return await removeLink(sourceId, 'up')
  }

  const setDownLink = async (sourceId, targetId) => {
    return await setLink(sourceId, targetId, 'down')
  }

  const removeDownLink = async (sourceId) => {
    return await removeLink(sourceId, 'down')
  }

  const setLeftLink = async (sourceId, targetId) => {
    return await setLink(sourceId, targetId, 'left')
  }

  const setRightLink = async (sourceId, targetId) => {
    return await setLink(sourceId, targetId, 'right')
  }

  const removeLeftLink = async (sourceId) => {
    return await removeLink(sourceId, 'left')
  }

  const removeRightLink = async (sourceId) => {
    return await removeLink(sourceId, 'right')
  }

  const navigateToLinkedNote = async (noteId) => {
    return await navigateToNote(noteId)
  }

  const createDraftLinkedNote = async (sourceNote, linkType) => {
    return await createDraftLinkedNoteFromContext(sourceNote, linkType)
  }

  const toggleTaskComplete = async (taskId) => {
    return await toggleComplete(taskId)
  }

  const changeTaskStatus = async (taskId, newStatus) => {
    return await changeStatus(taskId, newStatus)
  }

  const reorderTasks = async (fromIndex, toIndex) => {
    return await reorderTasksFromContext(fromIndex, toIndex)
  }

  /**
   * Get project for a task
   * @param {Object} task - Task object
   * @returns {Object|null} - Project note or null
   */
  const getProjectForTask = (task) => {
    if (!task || !task.project_id) return null
    return notes.find(n => n.id === task.project_id)
  }

  /**
   * Enter workspace mode for a task
   * @param {Object} task - Task to work on
   */
  const enterWorkspace = (task) => {
    setWorkspaceTask(task)
    setIsInWorkspace(true)
    // Close any open panels
    selectTask(null)
    setSelectedTaskNumber(null)
  }

  /**
   * Exit workspace mode
   */
  const exitWorkspace = () => {
    setIsInWorkspace(false)
    setWorkspaceTask(null)
  }

  /**
   * Handle tag selection from sidebar
   * Fetches all notes, tasks, and projects with the selected tag
   * @param {Object} tag - The selected tag object
   */
  const handleTagSelect = async (tag) => {
    try {
      setSelectedTag(tag)
      setSidebarOpen(false)

      // Fetch notes with this tag (including descendants)
      const noteIds = await getNotesForTag(tag.id, true)
      const taggedNotes = notes.filter(n => noteIds.includes(n.id))
      setFilteredNotes(taggedNotes)

      // Fetch tasks with this tag (including descendants)
      const taskIds = await getTasksForTag(tag.id, true)
      const taggedTasks = allTasks.filter(t => taskIds.includes(t.id))
      setFilteredTasks(taggedTasks)

      // Filter projects (notes with note_type='project')
      const taggedProjects = taggedNotes.filter(n => n.note_type === 'project')
      setFilteredProjects(taggedProjects)

    } catch (error) {
      console.error('Error fetching tag data:', error)
      setSelectedTag(null)
      setFilteredNotes([])
      setFilteredTasks([])
      setFilteredProjects([])
    }
  }

  /**
   * Go back from tag filtered view
   */
  const handleBackFromTag = () => {
    setSelectedTag(null)
    setFilteredNotes([])
    setFilteredTasks([])
    setFilteredProjects([])
  }

  /**
   * Save diagram data to database
   * @param {Object} diagramData - Object with xml and svg properties
   */
  const handleDiagramSave = async (diagramData) => {
    try {
      if (!currentDiagramNote) {
        throw new Error('No diagram note found')
      }

      // Decode SVG from base64 data URI if needed
      let svgData = diagramData.svg
      if (svgData && svgData.startsWith('data:image/svg+xml;base64,')) {
        const base64Data = svgData.replace('data:image/svg+xml;base64,', '')
        svgData = atob(base64Data)
        console.log('📊 Decoded SVG from base64')
      }

      const { error } = await supabase
        .from('notes')
        .update({
          diagram_xml: diagramData.xml,
          diagram_svg: svgData,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentDiagramNote.id)

      if (error) throw error

      // Fetch the updated note to get the latest data
      const { data: updatedNoteData, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', currentDiagramNote.id)
        .single()

      if (fetchError) throw fetchError

      selectNote(updatedNoteData)
      console.log('✅ Diagram saved successfully')
    } catch (error) {
      console.error('Error saving diagram:', error)
      alert(`Error saving diagram: ${error.message}`)
    }
  }

  /**
   * Open diagram editor for an existing diagram note
   * @param {Object} diagramNote - The diagram note to edit
   */
  const handleEditDiagram = (diagramNote) => {
    setCurrentDiagramNote(diagramNote)
    setIsDiagramEditorOpen(true)
  }

  /**
   * Save mindmap data to database
   * @param {Object} mindmapData - Object with mindmap_markdown and mindmap_svg properties
   */
  const handleMindmapSave = async (mindmapData) => {
    try {
      if (!currentMindmapNote) {
        throw new Error('No mindmap note found')
      }

      const { error } = await supabase
        .from('notes')
        .update({
          mindmap_markdown: mindmapData.mindmap_markdown,
          mindmap_svg: mindmapData.mindmap_svg,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentMindmapNote.id)

      if (error) throw error

      // Fetch the updated note to get the latest data
      const { data: updatedNoteData, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', currentMindmapNote.id)
        .single()

      if (fetchError) throw fetchError

      selectNote(updatedNoteData)
      setIsMindmapEditorOpen(false)
      setCurrentMindmapNote(null)
      console.log('✅ Mindmap saved successfully')
    } catch (error) {
      console.error('Error saving mindmap:', error)
      alert(`Error saving mindmap: ${error.message}`)
    }
  }

  /**
   * Open mindmap editor for an existing mindmap note
   * @param {Object} mindmapNote - The mindmap note to edit
   */
  const handleEditMindmap = (mindmapNote) => {
    setCurrentMindmapNote(mindmapNote)
    setIsMindmapEditorOpen(true)
  }

  if (notesLoading) {
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
              selectNote(note)
              if (window.innerWidth < 768) {
                setSidebarOpen(false)
              }
            }
          }}
          onCreateNote={createNoteFromContext}
          onGoHome={goToHome}
          onToggleStar={toggleNoteStarFromContext}
          onSelectTag={handleTagSelect}
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
        {/* Tag Filtered View */}
        {selectedTag ? (
          <div className="w-full h-full">
            <TagFilteredView
              selectedTag={selectedTag}
              filteredNotes={filteredNotes}
              filteredTasks={filteredTasks}
              filteredProjects={filteredProjects}
              onBack={handleBackFromTag}
              onSelectNote={(note) => {
                selectNote(note)
                setSelectedTag(null)
              }}
              onSelectTask={selectTask}
              onUpdateTask={updateTask}
              onScheduleTask={scheduleTask}
              onDeleteTask={deleteTask}
              onToggleComplete={toggleComplete}
              onToggleStar={toggleTaskStar}
              allNotes={notes}
              selectedTask={selectedTask}
            />
          </div>
        ) : isInWorkspace && workspaceTask ? (
          /* Workspace View (Full Screen) */
          <div className="w-full h-full">
            <WorkspaceView
              task={workspaceTask}
              project={getProjectForTask(workspaceTask)}
              onExit={exitWorkspace}
              onSaveTask={saveTask}
              allNotes={notes}
              onCommand={handleCommand}
            />
          </div>
        ) : (
          <>
          {/* Main content */}
          <div className="main-content-area flex-1 flex items-center overflow-hidden p-8 md:p-16 gap-4 transition-all">
          {/* Primary note editor */}
          <div className={`h-full max-h-[900px] transition-all ${selectedTask && !secondaryNote ? 'w-1/2' : secondaryNote ? 'w-1/2' : 'w-full max-w-6xl mx-auto'}`}>
            <NoteEditor
              note={selectedNote}
              allNotes={notes}
              currentTasks={currentTasks}
              allTasks={allTasks}
              selectedTaskId={selectedTaskId}
              onTaskSelect={(taskId) => {
                setTaskIdFromContext(taskId)
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
                selectTask(task)
              }}
              onProjectClick={handleProjectClick}
              statusFilter={statusFilter}
              taskTypeFilter={taskTypeFilter}
              tagFilter={tagFilter}
              onStatusFilterChange={setStatusFilter}
              onTaskTypeFilterChange={setTaskTypeFilter}
              onTagFilterChange={setTagFilter}
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
              onEditDiagram={handleEditDiagram}
              onEditMindmap={handleEditMindmap}
            />
          </div>

          {/* Secondary note editor (side-by-side) */}
          {secondaryNote && (
            <div className="w-1/2 h-full max-h-[900px] relative">
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
                  selectTask(task)
                }}
                onProjectClick={handleProjectClick}
                selectedTaskId={selectedTaskId}
                onTaskSelect={(taskId) => {
                  setTaskIdFromContext(taskId)
                  setDeselectionPending(false)
                }}
                statusFilter={statusFilter}
                taskTypeFilter={taskTypeFilter}
                tagFilter={tagFilter}
                onStatusFilterChange={setStatusFilter}
                onTaskTypeFilterChange={setTaskTypeFilter}
                onTagFilterChange={setTagFilter}
                logUpdateTrigger={logUpdateTrigger}
                onEditDiagram={handleEditDiagram}
                onEditMindmap={handleEditMindmap}
              />
            </div>
          )}

          {/* Task Detail Modal Backdrop */}
          {selectedTask && !secondaryNote && (
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[55]"
              onClick={() => {
                selectTask(null)
                setSelectedTaskNumber(null)
              }}
            />
          )}

          {/* Task Detail Panel - Full Height with 50% Width */}
          {selectedTask && !secondaryNote && (
            <div
              className="fixed right-8 top-8 bottom-8 w-1/2 z-[60]"
              onClick={(e) => e.stopPropagation()}
            >
              <TaskDetail
                task={selectedTask}
                taskNumber={selectedTaskNumber}
                onClose={() => {
                  selectTask(null)
                  setSelectedTaskNumber(null)
                }}
                onSave={saveTask}
                showPriorityFormula={uiPreferences.show_priority_formula}
                allNotes={notes}
                onProjectClick={handleProjectClick}
                onEnterWorkspace={enterWorkspace}
              />
            </div>
          )}
          </div>
          </>
        )}
      </div>

      {/* Terminal - fixed at bottom (hidden in workspace mode) */}
      {!isInWorkspace && (
        <Terminal
          ref={terminalRef}
          onCommand={handleCommand}
          navigationActions={{
            goToInbox: goToInboxWrapper,
            goToTasks: goToTasksWrapper,
            goToProjects: goToProjectsWrapper,
            goToHome: goToHomeWrapper,
            goToLog: goToLogWrapper,
            openSettings: () => setIsSettingsOpen(true)
          }}
        />
      )}

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
            className="bg-bg-elevated border border-border-primary rounded-full px-4 py-2 shadow-lg flex items-center gap-3 cursor-pointer pointer-events-auto hover:bg-bg-tertiary transition-colors"
          >
            {sessionContext && (
              <span className="text-xs text-fg-secondary max-w-[200px] truncate">
                {sessionContext}
              </span>
            )}
            <span className="text-sm font-mono text-accent-primary">
              {Math.floor(timerRemainingSeconds / 60)}:{(timerRemainingSeconds % 60).toString().padStart(2, '0')}
            </span>
            {isTimerPaused && (
              <span className="text-[9px] text-semantic-warning">PAUSED</span>
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

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        notes={notes}
        tasks={allTasks}
        onSelectNote={(note) => {
          selectNote(note)
          setIsSearchOpen(false)
        }}
        onSelectTask={(task) => {
          // Find task number in all tasks
          const taskIndex = allTasks.findIndex(t => t.id === task.id)
          setSelectedTaskNumber(taskIndex >= 0 ? taskIndex + 1 : null)
          selectTask(task)
          setIsSearchOpen(false)
        }}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={isKeyboardHelpOpen}
        onClose={() => setIsKeyboardHelpOpen(false)}
      />

      {/* Diagram Editor */}
      <DiagramEditor
        isOpen={isDiagramEditorOpen}
        onClose={() => {
          setIsDiagramEditorOpen(false)
          setCurrentDiagramNote(null)
        }}
        initialXml={currentDiagramNote?.diagram_xml || null}
        onSave={handleDiagramSave}
        diagramTitle={currentDiagramNote?.title || ''}
      />

      {/* Mindmap Editor */}
      {isMindmapEditorOpen && currentMindmapNote && (
        <MindmapEditor
          note={currentMindmapNote}
          onSave={handleMindmapSave}
          onClose={() => {
            setIsMindmapEditorOpen(false)
            setCurrentMindmapNote(null)
          }}
        />
      )}
    </div>
  )
}

export default App
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { TasksService } from '../services/tasksService'
import * as activityLogger from '../utils/activityLogger'

const TasksContext = createContext()

const tasksReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ALL_TASKS':
      return { ...state, allTasks: action.payload, loading: false }

    case 'SET_CURRENT_TASKS':
      return { ...state, currentTasks: action.payload }

    case 'SET_SELECTED_TASK':
      return { ...state, selectedTask: action.payload }

    case 'SET_SELECTED_TASK_ID':
      return { ...state, selectedTaskId: action.payload }

    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload }

    case 'SET_TASK_TYPE_FILTER':
      return { ...state, taskTypeFilter: action.payload }

    case 'SET_TAG_FILTER':
      return { ...state, tagFilter: action.payload }

    case 'ADD_TASK':
      return {
        ...state,
        allTasks: [action.payload, ...state.allTasks],
        currentTasks: [action.payload, ...state.currentTasks]
      }

    case 'UPDATE_TASK':
      return {
        ...state,
        allTasks: state.allTasks.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
        currentTasks: state.currentTasks.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
        selectedTask: state.selectedTask?.id === action.payload.id
          ? { ...state.selectedTask, ...action.payload }
          : state.selectedTask
      }

    case 'DELETE_TASK':
      return {
        ...state,
        allTasks: state.allTasks.filter(t => t.id !== action.payload),
        currentTasks: state.currentTasks.filter(t => t.id !== action.payload),
        selectedTask: state.selectedTask?.id === action.payload ? null : state.selectedTask
      }

    default:
      return state
  }
}

export function TasksProvider({ children }) {
  const [state, dispatch] = useReducer(tasksReducer, {
    allTasks: [],
    currentTasks: [],
    selectedTask: null,
    selectedTaskId: null,
    statusFilter: [],
    taskTypeFilter: null,
    tagFilter: [],
    loading: true
  })

  // Fetch all tasks
  const fetchAllTasks = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const tasks = await TasksService.fetchAll()
      dispatch({ type: 'SET_ALL_TASKS', payload: tasks })
      return tasks
    } catch (error) {
      console.error('Error fetching tasks:', error.message)
      dispatch({ type: 'SET_LOADING', payload: false })
      throw error
    }
  }, [])

  // Create a new task
  const createTask = useCallback(async (taskData = {}) => {
    try {
      const newTask = {
        text: 'New task',
        status: 'BACKLOG',
        priority: 0,
        ...taskData
      }

      const created = await TasksService.create(newTask)
      dispatch({ type: 'ADD_TASK', payload: created })

      // Log task creation
      await activityLogger.logTaskCreated(created)

      return created
    } catch (error) {
      console.error('Error creating task:', error.message)
      throw error
    }
  }, [])

  // Update a task
  const updateTask = useCallback(async (taskId, updates) => {
    try {
      // Optimistic update
      dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, ...updates } })

      const updated = await TasksService.update(taskId, updates)
      dispatch({ type: 'UPDATE_TASK', payload: updated })

      return updated
    } catch (error) {
      // Rollback on error
      console.error('Error updating task:', error.message)
      await fetchAllTasks()
      throw error
    }
  }, [fetchAllTasks])

  // Delete a task
  const deleteTask = useCallback(async (taskId) => {
    try {
      const task = state.allTasks.find(t => t.id === taskId)

      await TasksService.delete(taskId)
      dispatch({ type: 'DELETE_TASK', payload: taskId })

      // Log task deletion
      if (task) {
        await activityLogger.logTaskDeleted(task)
      }
    } catch (error) {
      console.error('Error deleting task:', error.message)
      throw error
    }
  }, [state.allTasks])

  // Toggle task completion
  const toggleComplete = useCallback(async (taskId) => {
    try {
      const task = state.allTasks.find(t => t.id === taskId)
      if (!task) return

      const newStatus = task.status === 'DONE' ? 'BACKLOG' : 'DONE'
      await updateTask(taskId, { status: newStatus })

      // Log completion
      if (newStatus === 'DONE') {
        await activityLogger.logTaskCompleted(task)
      }
    } catch (error) {
      console.error('Error toggling task completion:', error.message)
      throw error
    }
  }, [state.allTasks, updateTask])

  // Toggle task star
  const toggleStar = useCallback(async (taskId) => {
    try {
      const task = state.allTasks.find(t => t.id === taskId)
      if (!task) return

      const newStarred = !task.is_starred
      await updateTask(taskId, { is_starred: newStarred })

      // Log star change
      await activityLogger.logTaskStarred(task, newStarred)
    } catch (error) {
      console.error('Error toggling task star:', error.message)
      throw error
    }
  }, [state.allTasks, updateTask])

  // Schedule a task
  const scheduleTask = useCallback(async (taskId, scheduledDate) => {
    try {
      const task = state.allTasks.find(t => t.id === taskId)
      if (!task) return

      await TasksService.scheduleTask(taskId, scheduledDate)

      // Refresh tasks to get updated status
      await fetchAllTasks()

      // Log scheduling
      await activityLogger.logTaskScheduled(task, scheduledDate)
    } catch (error) {
      console.error('Error scheduling task:', error.message)
      throw error
    }
  }, [state.allTasks, fetchAllTasks])

  // Change task status
  const changeStatus = useCallback(async (taskId, newStatus) => {
    try {
      const task = state.allTasks.find(t => t.id === taskId)
      if (!task) return

      const oldStatus = task.status
      await updateTask(taskId, { status: newStatus })

      // Log status change
      await activityLogger.logTaskStatusChanged(task, oldStatus, newStatus)
    } catch (error) {
      console.error('Error changing task status:', error.message)
      throw error
    }
  }, [state.allTasks, updateTask])

  // Set current tasks (for filtered views)
  const setCurrentTasks = useCallback((tasks) => {
    dispatch({ type: 'SET_CURRENT_TASKS', payload: tasks })
  }, [])

  // Set selected task
  const selectTask = useCallback((task) => {
    dispatch({ type: 'SET_SELECTED_TASK', payload: task })
  }, [])

  // Set selected task ID (for keyboard navigation)
  const setSelectedTaskId = useCallback((taskId) => {
    dispatch({ type: 'SET_SELECTED_TASK_ID', payload: taskId })
  }, [])

  // Set status filter
  const setStatusFilter = useCallback((filter) => {
    dispatch({ type: 'SET_STATUS_FILTER', payload: filter })
  }, [])

  // Set task type filter
  const setTaskTypeFilter = useCallback((filter) => {
    dispatch({ type: 'SET_TASK_TYPE_FILTER', payload: filter })
  }, [])

  // Set tag filter
  const setTagFilter = useCallback((filter) => {
    dispatch({ type: 'SET_TAG_FILTER', payload: filter })
  }, [])

  // Reorder tasks
  const reorderTasks = useCallback(async (fromIndex, toIndex) => {
    try {
      const tasksCopy = [...state.currentTasks]
      const [movedTask] = tasksCopy.splice(fromIndex, 1)
      tasksCopy.splice(toIndex, 0, movedTask)

      // Update priorities based on new order
      const updatedTasks = tasksCopy.map((task, index) => ({
        ...task,
        priority: index
      }))

      // Optimistic update
      dispatch({ type: 'SET_CURRENT_TASKS', payload: updatedTasks })

      // Update in database
      await TasksService.reorderTasks(updatedTasks)
    } catch (error) {
      console.error('Error reordering tasks:', error.message)
      await fetchAllTasks()
      throw error
    }
  }, [state.currentTasks, fetchAllTasks])

  // Initialize - fetch tasks on mount
  useEffect(() => {
    fetchAllTasks().catch(error => {
      console.error('Failed to initialize tasks:', error)
    })
  }, [fetchAllTasks])

  const value = {
    ...state,
    fetchAllTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    toggleStar,
    scheduleTask,
    changeStatus,
    setCurrentTasks,
    selectTask,
    setSelectedTaskId,
    setStatusFilter,
    setTaskTypeFilter,
    setTagFilter,
    reorderTasks,
  }

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export const useTasks = () => {
  const context = useContext(TasksContext)
  if (!context) {
    throw new Error('useTasks must be used within TasksProvider')
  }
  return context
}

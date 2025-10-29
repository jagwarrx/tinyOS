import { useState, useEffect } from 'react'
import { Clock, FileText, CheckSquare, FolderKanban, Timer as TimerIcon, Star, Calendar, Trash2, Check, GlassWater, Bell, ChevronRight, ChevronLeft, Sun, Sunrise, CalendarRange, Archive, Zap, Pencil, X, ChevronDown, Tag } from 'lucide-react'
import * as activityLogService from '../services/activityLogService'
import RefIdBadge from './RefIdBadge'

/**
 * LogPage Component
 * Displays activity log entries grouped by date
 * Shows all user actions: task creation, note updates, status changes, etc.
 */
export default function LogPage({ onRefIdNavigate, logUpdateTrigger }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupedLogs, setGroupedLogs] = useState({})
  const [filters, setFilters] = useState({
    textLogs: true,
    taskActivity: true,
    noteActivity: true,
    reminders: true,
    other: true
  })
  const [timeFilter, setTimeFilter] = useState('all') // 'today', 'yesterday', 'week', 'all'
  const [isTimeExpanded, setIsTimeExpanded] = useState(true)
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(true)
  const [editingLogId, setEditingLogId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [hoveredLogId, setHoveredLogId] = useState(null)
  const [expandedGroups, setExpandedGroups] = useState(new Set())
  const [expandedLogs, setExpandedLogs] = useState(new Set())

  useEffect(() => {
    fetchLogs()
  }, [logUpdateTrigger])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const data = await activityLogService.fetchAll(200) // Fetch last 200 entries
      setLogs(data)
      groupLogsByDate(data)
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Categorize a log entry by type
   */
  const getCategoryForLog = (log) => {
    const taskActions = ['task_created', 'task_completed', 'task_status_changed', 'task_scheduled', 'task_deleted', 'task_starred', 'task_unstarred']
    const noteActions = ['note_created', 'note_updated', 'note_deleted']
    const otherActions = ['water_logged', 'energy_logged', 'timer_started', 'timer_completed', 'timer_cancelled', 'project_created', 'project_status_changed', 'project_completed']

    if (log.action_type === 'log_entry') return 'textLogs'
    if (log.action_type === 'reminder_created') return 'reminders'
    if (taskActions.includes(log.action_type)) return 'taskActivity'
    if (noteActions.includes(log.action_type)) return 'noteActivity'
    if (otherActions.includes(log.action_type)) return 'other'
    return 'other'
  }

  /**
   * Check if a log matches the time filter
   */
  const matchesTimeFilter = (log) => {
    if (timeFilter === 'all') return true

    const logDate = new Date(log.timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Start of this week (Sunday)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    switch (timeFilter) {
      case 'today':
        return logDate >= today
      case 'yesterday':
        const endOfYesterday = new Date(today)
        return logDate >= yesterday && logDate < endOfYesterday
      case 'week':
        return logDate >= startOfWeek
      default:
        return true
    }
  }

  /**
   * Filter logs based on active filters
   */
  const filterLogs = (logs) => {
    return logs.filter(log => {
      const category = getCategoryForLog(log)
      const matchesCategory = filters[category]
      const matchesTime = matchesTimeFilter(log)
      return matchesCategory && matchesTime
    })
  }

  /**
   * Toggle a filter on/off
   */
  const toggleFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }))
  }

  /**
   * Set all filters to active
   */
  const showAllTypes = () => {
    setFilters({
      textLogs: true,
      taskActivity: true,
      noteActivity: true,
      reminders: true,
      other: true
    })
  }

  /**
   * Check if all filters are active
   */
  const isAllActive = () => {
    return Object.values(filters).every(val => val === true)
  }

  /**
   * Get count of logs for each category
   */
  const getCategoryCount = (category) => {
    return logs.filter(log => {
      const logCategory = getCategoryForLog(log)
      const matchesTime = matchesTimeFilter(log)
      return logCategory === category && matchesTime
    }).length
  }

  /**
   * Get count of logs for each time filter
   */
  const getTimeFilterCount = (filter) => {
    const originalTimeFilter = timeFilter
    // Temporarily check count for this filter
    return logs.filter(log => {
      const logDate = new Date(log.timestamp)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())

      switch (filter) {
        case 'today':
          return logDate >= today
        case 'yesterday':
          const endOfYesterday = new Date(today)
          return logDate >= yesterday && logDate < endOfYesterday
        case 'week':
          return logDate >= startOfWeek
        case 'all':
          return true
        default:
          return true
      }
    }).length
  }

  /**
   * Start editing a log entry (for text logs and reminders)
   */
  const startEditing = (log) => {
    if (log.action_type === 'log_entry' || log.action_type === 'reminder_created') {
      setEditingLogId(log.id)
      setEditingText(log.entity_title || '')
    }
  }

  /**
   * Cancel editing
   */
  const cancelEditing = () => {
    setEditingLogId(null)
    setEditingText('')
  }

  /**
   * Save edited log entry
   */
  const saveEdit = async (logId) => {
    try {
      await activityLogService.update(logId, {
        entity_title: editingText
      })

      // Update local state
      setLogs(logs.map(log =>
        log.id === logId ? { ...log, entity_title: editingText } : log
      ))

      cancelEditing()
    } catch (error) {
      console.error('Error updating log:', error)
    }
  }

  /**
   * Delete a log entry
   */
  const deleteLog = async (logId) => {
    if (!window.confirm('Delete this log entry?')) return

    try {
      await activityLogService.deleteById(logId)

      // Update local state
      setLogs(logs.filter(log => log.id !== logId))
    } catch (error) {
      console.error('Error deleting log:', error)
    }
  }

  /**
   * Group consecutive note_updated logs
   * Returns array with individual logs and grouped entries marked
   */
  const groupConsecutiveNoteEdits = (logs) => {
    if (logs.length === 0) return []

    const result = []
    let i = 0

    while (i < logs.length) {
      const currentLog = logs[i]

      // Check if this is a note_updated log
      if (currentLog.action_type === 'note_updated') {
        // Find consecutive note_updated logs
        const groupStart = i
        let groupEnd = i

        while (
          groupEnd + 1 < logs.length &&
          logs[groupEnd + 1].action_type === 'note_updated'
        ) {
          groupEnd++
        }

        // If we found multiple consecutive note edits, create a group
        if (groupEnd > groupStart) {
          const groupLogs = logs.slice(groupStart, groupEnd + 1)
          const groupId = `group-${currentLog.timestamp}-${groupLogs.length}`

          result.push({
            type: 'group',
            id: groupId,
            action_type: 'note_updated_group',
            count: groupLogs.length,
            logs: groupLogs,
            timestamp: currentLog.timestamp // Use the first log's timestamp
          })

          i = groupEnd + 1
        } else {
          // Single note edit, add as-is
          result.push({ ...currentLog, type: 'single' })
          i++
        }
      } else {
        // Not a note edit, add as-is
        result.push({ ...currentLog, type: 'single' })
        i++
      }
    }

    return result
  }

  /**
   * Toggle expansion of a log group
   */
  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  /**
   * Toggle expansion of a long log entry
   */
  const toggleLogExpansion = (logId) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  /**
   * Group logs by date for better organization
   * Returns: { 'Today': [...], 'Yesterday': [...], 'Jan 25': [...] }
   */
  const groupLogsByDate = (logs) => {
    const grouped = {}
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Filter logs before grouping
    const filteredLogs = filterLogs(logs)

    filteredLogs.forEach(log => {
      const logDate = new Date(log.timestamp)
      const dateKey = getDateKey(logDate, today, yesterday)

      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(log)
    })

    // Apply consecutive note edit grouping to each date group
    const groupedWithCollapsedEdits = {}
    Object.keys(grouped).forEach(dateKey => {
      groupedWithCollapsedEdits[dateKey] = groupConsecutiveNoteEdits(grouped[dateKey])
    })

    setGroupedLogs(groupedWithCollapsedEdits)
  }

  // Re-group logs when filters change
  useEffect(() => {
    if (logs.length > 0) {
      groupLogsByDate(logs)
    }
  }, [filters, timeFilter])

  /**
   * Get a human-readable date key for grouping
   */
  const getDateKey = (logDate, today, yesterday) => {
    const isSameDay = (d1, d2) => {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate()
    }

    if (isSameDay(logDate, today)) {
      return 'Today'
    } else if (isSameDay(logDate, yesterday)) {
      return 'Yesterday'
    } else {
      // Format: "Jan 25" or "Dec 31, 2024" (include year if not current year)
      const isCurrentYear = logDate.getFullYear() === today.getFullYear()
      const options = isCurrentYear
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' }
      return logDate.toLocaleDateString('en-US', options)
    }
  }

  /**
   * Format timestamp to 12-hour time
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  /**
   * Get icon for action type
   */
  const getActionIcon = (actionType) => {
    const iconClass = "w-4 h-4"

    switch (actionType) {
      case 'task_completed':
        return <Check className={iconClass} />

      case 'task_created':
      case 'task_status_changed':
      case 'task_scheduled':
      case 'task_deleted':
        return <CheckSquare className={iconClass} />

      case 'task_starred':
      case 'task_unstarred':
        return <Star className={iconClass} />

      case 'note_created':
      case 'note_updated':
      case 'note_deleted':
        return <FileText className={iconClass} />

      case 'project_created':
      case 'project_status_changed':
      case 'project_completed':
        return <FolderKanban className={iconClass} />

      case 'timer_started':
      case 'timer_completed':
      case 'timer_cancelled':
        return <TimerIcon className={iconClass} />

      case 'water_logged':
        return <GlassWater className={iconClass} />

      case 'reminder_created':
        return <Bell className={iconClass} />

      case 'energy_logged':
      case 'log_entry':
        return null // No icon for energy logs and general log entries

      default:
        return <Clock className={iconClass} />
    }
  }

  /**
   * Get color for action type
   */
  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'task_completed':
      case 'project_completed':
      case 'timer_completed':
        return 'text-semantic-success'

      case 'task_created':
      case 'note_created':
      case 'project_created':
      case 'timer_started':
        return 'text-syntax-blue'

      case 'task_status_changed':
      case 'project_status_changed':
        return 'text-syntax-yellow'

      case 'task_scheduled':
        return 'text-syntax-purple'

      case 'task_starred':
        return 'text-syntax-orange'

      case 'task_unstarred':
        return 'text-fg-tertiary'

      case 'note_updated':
        return 'text-syntax-blue'

      case 'task_deleted':
      case 'note_deleted':
      case 'timer_cancelled':
        return 'text-semantic-error'

      case 'energy_logged':
        return 'text-syntax-green'

      case 'water_logged':
        return 'text-syntax-blue'

      case 'reminder_created':
        return 'text-syntax-orange'

      case 'log_entry':
        return 'text-fg-tertiary'

      default:
        return 'text-fg-secondary'
    }
  }

  /**
   * Format action text with details
   */
  const formatActionText = (log) => {
    const details = log.details || {}

    switch (log.action_type) {
      case 'task_created':
        return 'Created task'

      case 'task_completed':
        return 'Completed task'

      case 'task_status_changed':
        return `Changed status: ${details.old_status} → ${details.new_status}`

      case 'task_scheduled':
        return `Scheduled task to ${details.scheduled_date}`

      case 'task_starred':
        return 'Starred task'

      case 'task_unstarred':
        return 'Unstarred task'

      case 'task_deleted':
        return 'Deleted task'

      case 'note_created':
        return 'Created note'

      case 'note_updated':
        const editCount = details.edit_count || 1
        return editCount > 1 ? `Updated note (${editCount} edits)` : 'Updated note'

      case 'note_deleted':
        return 'Deleted note'

      case 'project_created':
        return 'Created project'

      case 'project_status_changed':
        return `Project status: ${details.old_status} → ${details.new_status}`

      case 'project_completed':
        return 'Completed project'

      case 'timer_started':
        return `Started ${details.duration_minutes} min timer`

      case 'timer_completed':
        return `Completed ${details.duration_minutes} min timer`

      case 'timer_cancelled':
        const remaining = Math.floor(details.remaining_seconds / 60)
        return `Cancelled timer (${remaining} min remaining)`

      case 'energy_logged':
        const energyLevel = details.energy_level
        const energyEmoji = ['😴', '😞', '😐', '🙂', '😊', '⚡'][energyLevel] || '📊'
        return `${energyEmoji} Energy level: ${energyLevel}/5`

      case 'water_logged':
        return '💧 Drank water'

      case 'reminder_created':
        const reminderTime = details.reminder_time
        if (reminderTime) {
          const date = new Date(reminderTime)
          const now = new Date()
          const isToday = date.toDateString() === now.toDateString()
          const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString()

          const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

          let dayStr = ''
          if (isToday) {
            dayStr = 'today'
          } else if (isTomorrow) {
            dayStr = 'tomorrow'
          } else {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            dayStr = `${monthNames[date.getMonth()]} ${date.getDate()}`
          }

          return `Reminder set for ${dayStr} at ${timeStr}`
        }
        return 'Reminder created'

      case 'log_entry':
        return log.entity_title

      default:
        return log.action_type.replace(/_/g, ' ')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-fg-secondary">Loading activity log...</div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-fg-secondary">
        <Clock className="w-16 h-16 mb-4 opacity-50" />
        <p>No activity logged yet</p>
        <p className="text-sm mt-2">Your actions will appear here</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-2">
      {/* Fixed-width container - completely independent of filter bar content */}
      <div className="log-page-container mx-auto">
          <h1 className="text-2xl font-semibold text-fg-primary mb-3 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Activity Log
          </h1>

          {/* Collapsible Filter Bar - contained within fixed width */}
          <div className="mb-3 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg">
            {/* Time Filter Bar */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-fg-tertiary">Time</span>

            <div className={`flex items-center gap-1 rounded border transition-all duration-200 ${
              isTimeExpanded ? 'px-2 py-1' : 'px-1.5 py-0.5'
            } bg-bg-primary border-border-primary`}>
              {/* Today */}
              <button
                onClick={() => setTimeFilter('today')}
                className={`flex items-center gap-1 rounded transition-all duration-200 ${
                  isTimeExpanded ? 'px-1.5 py-0.5' : 'p-1'
                } ${
                  timeFilter === 'today'
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
                title={!isTimeExpanded ? 'Today' : undefined}
              >
                <Sun size={12} strokeWidth={timeFilter === 'today' ? 2.5 : 2} />
                <span
                  className={`text-[10px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isTimeExpanded ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  Today ({getTimeFilterCount('today')})
                </span>
              </button>

              {/* Yesterday */}
              <button
                onClick={() => setTimeFilter('yesterday')}
                className={`flex items-center gap-1 rounded transition-all duration-200 ${
                  isTimeExpanded ? 'px-1.5 py-0.5' : 'p-1'
                } ${
                  timeFilter === 'yesterday'
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
                title={!isTimeExpanded ? 'Yesterday' : undefined}
              >
                <Sunrise size={12} strokeWidth={timeFilter === 'yesterday' ? 2.5 : 2} />
                <span
                  className={`text-[10px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isTimeExpanded ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  Yesterday ({getTimeFilterCount('yesterday')})
                </span>
              </button>

              {/* Week */}
              <button
                onClick={() => setTimeFilter('week')}
                className={`flex items-center gap-1 rounded transition-all duration-200 ${
                  isTimeExpanded ? 'px-1.5 py-0.5' : 'p-1'
                } ${
                  timeFilter === 'week'
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
                title={!isTimeExpanded ? 'This Week' : undefined}
              >
                <CalendarRange size={12} strokeWidth={timeFilter === 'week' ? 2.5 : 2} />
                <span
                  className={`text-[10px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isTimeExpanded ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  Week ({getTimeFilterCount('week')})
                </span>
              </button>

              {/* All */}
              <button
                onClick={() => setTimeFilter('all')}
                className={`flex items-center gap-1 rounded transition-all duration-200 ${
                  isTimeExpanded ? 'px-1.5 py-0.5' : 'p-1'
                } ${
                  timeFilter === 'all'
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
                title={!isTimeExpanded ? 'All Time' : undefined}
              >
                <Archive size={12} strokeWidth={timeFilter === 'all' ? 2.5 : 2} />
                <span
                  className={`text-[10px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isTimeExpanded ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  All ({getTimeFilterCount('all')})
                </span>
              </button>

              <div className="w-px h-3 bg-border-primary" />

              <button
                onClick={() => setIsTimeExpanded(!isTimeExpanded)}
                className="p-0.5 rounded hover:bg-bg-tertiary text-fg-tertiary hover:text-fg-secondary transition-colors"
                title={isTimeExpanded ? 'Collapse' : 'Expand'}
              >
                {isTimeExpanded ? (
                  <ChevronLeft size={10} />
                ) : (
                  <ChevronRight size={10} />
                )}
              </button>
            </div>
          </div>

          {/* Category Filter Bar */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-fg-tertiary">Type</span>

            <div className={`flex items-center gap-1 rounded border transition-all duration-200 ${
              isCategoryExpanded ? 'px-2 py-1' : 'px-1.5 py-0.5'
            } bg-bg-primary border-border-primary`}>
              {/* All Types */}
              <button
                onClick={showAllTypes}
                className={`flex items-center gap-1 rounded transition-all duration-200 ${
                  isCategoryExpanded ? 'px-1.5 py-0.5' : 'p-1'
                } ${
                  isAllActive()
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
                title={!isCategoryExpanded ? 'All Types' : undefined}
              >
                <Archive size={12} strokeWidth={isAllActive() ? 2.5 : 2} />
                <span
                  className={`text-[10px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isCategoryExpanded ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  All
                </span>
              </button>

              <div className="w-px h-3 bg-border-primary" />

              {/* Text Logs */}
              <button
                onClick={() => toggleFilter('textLogs')}
                className={`flex items-center gap-1 rounded transition-all duration-200 ${
                  isCategoryExpanded ? 'px-1.5 py-0.5' : 'p-1'
                } ${
                  filters.textLogs
                    ? 'bg-syntax-green/20 text-syntax-green'
                    : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
                title={!isCategoryExpanded ? 'Text Logs' : undefined}
              >
                <FileText size={12} strokeWidth={filters.textLogs ? 2.5 : 2} />
                <span
                  className={`text-[10px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isCategoryExpanded ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  Text ({getCategoryCount('textLogs')})
                </span>
              </button>

              {/* Task Activity */}
              <button
                onClick={() => toggleFilter('taskActivity')}
                className={`flex items-center gap-1 rounded transition-all duration-200 ${
                  isCategoryExpanded ? 'px-1.5 py-0.5' : 'p-1'
                } ${
                  filters.taskActivity
                    ? 'bg-syntax-blue/20 text-syntax-blue'
                    : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
                title={!isCategoryExpanded ? 'Task Activity' : undefined}
              >
                <CheckSquare size={12} strokeWidth={filters.taskActivity ? 2.5 : 2} />
                <span
                  className={`text-[10px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isCategoryExpanded ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  Tasks ({getCategoryCount('taskActivity')})
                </span>
              </button>

              {/* Note Activity */}
              <button
                onClick={() => toggleFilter('noteActivity')}
                className={`flex items-center gap-1 rounded transition-all duration-200 ${
                  isCategoryExpanded ? 'px-1.5 py-0.5' : 'p-1'
                } ${
                  filters.noteActivity
                    ? 'bg-syntax-purple/20 text-syntax-purple'
                    : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
                title={!isCategoryExpanded ? 'Note Activity' : undefined}
              >
                <FileText size={12} strokeWidth={filters.noteActivity ? 2.5 : 2} />
                <span
                  className={`text-[10px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isCategoryExpanded ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  Notes ({getCategoryCount('noteActivity')})
                </span>
              </button>

              {/* Reminders */}
              <button
                onClick={() => toggleFilter('reminders')}
                className={`flex items-center gap-1 rounded transition-all duration-200 ${
                  isCategoryExpanded ? 'px-1.5 py-0.5' : 'p-1'
                } ${
                  filters.reminders
                    ? 'bg-syntax-orange/20 text-syntax-orange'
                    : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
                title={!isCategoryExpanded ? 'Reminders' : undefined}
              >
                <Bell size={12} strokeWidth={filters.reminders ? 2.5 : 2} />
                <span
                  className={`text-[10px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isCategoryExpanded ? 'max-w-[90px] opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  Reminders ({getCategoryCount('reminders')})
                </span>
              </button>

              {/* Other */}
              <button
                onClick={() => toggleFilter('other')}
                className={`flex items-center gap-1 rounded transition-all duration-200 ${
                  isCategoryExpanded ? 'px-1.5 py-0.5' : 'p-1'
                } ${
                  filters.other
                    ? 'bg-syntax-yellow/20 text-syntax-yellow'
                    : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
                title={!isCategoryExpanded ? 'Other Activity' : undefined}
              >
                <Zap size={12} strokeWidth={filters.other ? 2.5 : 2} />
                <span
                  className={`text-[10px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isCategoryExpanded ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  Other ({getCategoryCount('other')})
                </span>
              </button>

              <div className="w-px h-3 bg-border-primary" />

              <button
                onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
                className="p-0.5 rounded hover:bg-bg-tertiary text-fg-tertiary hover:text-fg-secondary transition-colors"
                title={isCategoryExpanded ? 'Collapse' : 'Expand'}
              >
                {isCategoryExpanded ? (
                  <ChevronLeft size={10} />
                ) : (
                  <ChevronRight size={10} />
                )}
              </button>
            </div>
          </div>
          </div>
        </div>

        {/* Log entries grouped by date */}
        {Object.keys(groupedLogs).map(dateKey => (
          <div key={dateKey} className="mb-4">
            {/* Date header */}
            <div className="sticky top-0 bg-bg-primary/95 backdrop-blur-sm py-1 mb-1.5 border-b border-border-secondary">
              <h2 className="text-lg font-medium text-fg-primary">{dateKey}</h2>
            </div>

            {/* Log entries for this date */}
            <div className="space-y-0.5">
              {groupedLogs[dateKey].map((entry, index) => {
                // Handle grouped note edits
                if (entry.type === 'group') {
                  const isExpanded = expandedGroups.has(entry.id)

                  return (
                    <div key={entry.id}>
                      {/* Collapsed group view */}
                      <div
                        className="flex items-start gap-4 px-2 py-1.5 rounded hover:bg-bg-secondary/50 transition-colors group relative cursor-pointer"
                        onClick={() => toggleGroupExpansion(entry.id)}
                      >
                        {/* Time */}
                        <div className="text-xs text-fg-tertiary font-mono min-w-[60px] pt-0.5">
                          {formatTime(entry.timestamp)}
                        </div>

                        {/* Icon */}
                        <div className="pt-0.5 text-syntax-blue">
                          <FileText size={16} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-20">
                          <div className="flex items-center gap-2 flex-wrap">
                            <ChevronRight
                              size={14}
                              className={`text-fg-tertiary transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                            <span className="text-sm text-fg-secondary">
                              Edited <span className="font-semibold text-fg-primary">({entry.count})</span> notes:
                            </span>
                            {/* Show last 2-3 notes */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {entry.logs.slice(0, 3).map((log, idx) => (
                                <RefIdBadge
                                  key={log.id}
                                  refId={log.entity_ref_id}
                                  title={log.entity_title}
                                  type={log.entity_type}
                                  onClick={(e) => {
                                    e.stopPropagation() // Prevent group expansion
                                    onRefIdNavigate(log.entity_ref_id, log.entity_type, e.shiftKey)
                                  }}
                                />
                              ))}
                              {entry.count > 3 && (
                                <span className="text-xs text-fg-tertiary">
                                  +{entry.count - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded individual logs */}
                      {isExpanded && (
                        <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-border-secondary pl-4">
                          {entry.logs.map(log => (
                            <div
                              key={log.id}
                              className="flex items-start gap-4 px-2 py-1.5 rounded hover:bg-bg-secondary/50 transition-colors group relative"
                              onMouseEnter={() => setHoveredLogId(log.id)}
                              onMouseLeave={() => setHoveredLogId(null)}
                            >
                              {/* Time */}
                              <div className="text-xs text-fg-tertiary font-mono min-w-[60px] pt-0.5">
                                {formatTime(log.timestamp)}
                              </div>

                              {/* Icon */}
                              <div className="pt-0.5 text-syntax-blue">
                                <FileText size={14} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 pr-20">
                                <div className="flex items-center gap-4 flex-wrap">
                                  <span className="text-sm text-fg-secondary">
                                    {formatActionText(log)}
                                  </span>

                                  {/* Entity badge */}
                                  {log.entity_ref_id && (
                                    <RefIdBadge
                                      refId={log.entity_ref_id}
                                      title={log.entity_title}
                                      type={log.entity_type}
                                      onClick={(e) => {
                                        onRefIdNavigate(log.entity_ref_id, log.entity_type, e.shiftKey)
                                      }}
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Delete action */}
                              {hoveredLogId === log.id && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-secondary/90 rounded px-1 py-0.5">
                                  <button
                                    onClick={() => deleteLog(log.id)}
                                    className="p-1 text-fg-tertiary hover:text-semantic-error hover:bg-semantic-error/10 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                // Handle individual logs (non-grouped)
                const log = entry
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 px-2 py-1.5 rounded hover:bg-bg-secondary/50 transition-colors group relative"
                    onMouseEnter={() => setHoveredLogId(log.id)}
                    onMouseLeave={() => setHoveredLogId(null)}
                  >
                  {/* Time */}
                  <div className="text-xs text-fg-tertiary font-mono min-w-[60px] pt-0.5">
                    {formatTime(log.timestamp)}
                  </div>

                  {/* Icon (only for non-log_entry and non-energy types) */}
                  {log.action_type !== 'log_entry' && log.action_type !== 'energy_logged' && (
                    <div className={`pt-0.5 ${getActionColor(log.action_type)}`}>
                      {getActionIcon(log.action_type)}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-20">
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Inline editing for text logs */}
                      {editingLogId === log.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(log.id)
                              if (e.key === 'Escape') cancelEditing()
                            }}
                            className="flex-1 px-2 py-1 text-sm text-fg-primary bg-bg-primary border border-border-primary rounded focus:outline-none focus:border-accent-primary"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(log.id)}
                            className="p-1 text-semantic-success hover:bg-semantic-success/10 rounded transition-colors"
                            title="Save"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-fg-tertiary hover:bg-bg-tertiary rounded transition-colors"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Text with truncation for log_entry types */}
                          {log.action_type === 'log_entry' ? (
                            <div className="flex-1">
                              <span className="text-sm text-fg-primary font-bold">
                                {log.entity_title && log.entity_title.length > 200 && !expandedLogs.has(log.id)
                                  ? `${log.entity_title.substring(0, 200)}...`
                                  : formatActionText(log)
                                }
                              </span>
                              {log.entity_title && log.entity_title.length > 200 && (
                                <button
                                  onClick={() => toggleLogExpansion(log.id)}
                                  className="ml-2 text-xs font-medium hover:underline text-accent-primary"
                                >
                                  {expandedLogs.has(log.id) ? 'Show less' : 'Show more'}
                                </button>
                              )}
                              {/* Display tags if present */}
                              {log.details?.tags && log.details.tags.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  {log.details.tags.map((tag, idx) => (
                                    <div
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-syntax-purple/10 text-syntax-purple border border-syntax-purple/30"
                                    >
                                      <Tag size={10} />
                                      <span className="font-mono">{tag.full_path}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-fg-secondary">
                              {formatActionText(log)}
                            </span>
                          )}

                          {/* Entity badge (if applicable) */}
                          {log.entity_ref_id && log.entity_type !== 'timer' && (
                            <RefIdBadge
                              refId={log.entity_ref_id}
                              title={log.entity_title}
                              type={log.entity_type}
                              onClick={(e) => {
                                // Shift+click opens in side-by-side, normal click navigates
                                onRefIdNavigate(log.entity_ref_id, log.entity_type, e.shiftKey)
                              }}
                            />
                          )}

                          {/* Reminder text */}
                          {log.action_type === 'reminder_created' && log.entity_title && (
                            <div className="flex items-center gap-2">
                              <span className="text-fg-primary text-sm font-medium">
                                {log.entity_title.length > 200 && !expandedLogs.has(log.id)
                                  ? `${log.entity_title.substring(0, 200)}...`
                                  : log.entity_title
                                }
                              </span>
                              {log.entity_title.length > 200 && (
                                <button
                                  onClick={() => toggleLogExpansion(log.id)}
                                  className="text-xs font-medium hover:underline text-accent-primary"
                                >
                                  {expandedLogs.has(log.id) ? 'Show less' : 'Show more'}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Entity title for non-ref items (only for timer, not log_entry) */}
                          {!log.entity_ref_id && log.entity_title && log.action_type !== 'log_entry' && log.action_type !== 'energy_logged' && log.action_type !== 'water_logged' && log.action_type !== 'reminder_created' && (
                            <span className="text-fg-primary text-sm font-medium">
                              "{log.entity_title}"
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Edit/Delete actions (show on hover) - positioned absolutely on far right */}
                  {hoveredLogId === log.id && editingLogId !== log.id && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-secondary/90 rounded px-1 py-0.5">
                      {/* Edit button (for text logs and reminders) */}
                      {(log.action_type === 'log_entry' || log.action_type === 'reminder_created') && (
                        <button
                          onClick={() => startEditing(log)}
                          className="p-1 text-fg-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={() => deleteLog(log.id)}
                        className="p-1 text-fg-tertiary hover:text-semantic-error hover:bg-semantic-error/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

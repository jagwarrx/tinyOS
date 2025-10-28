import { useState, useEffect } from 'react'
import { Clock, FileText, CheckSquare, FolderKanban, Timer as TimerIcon, Star, Calendar, Trash2, Check, GlassWater } from 'lucide-react'
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
    other: true
  })
  const [timeFilter, setTimeFilter] = useState('all') // 'today', 'yesterday', 'week', 'all'

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

    setGroupedLogs(grouped)
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
        return 'text-green-400'

      case 'task_created':
      case 'note_created':
      case 'project_created':
      case 'timer_started':
        return 'text-blue-400'

      case 'task_status_changed':
      case 'project_status_changed':
        return 'text-yellow-400'

      case 'task_scheduled':
        return 'text-purple-400'

      case 'task_starred':
        return 'text-amber-400'

      case 'task_unstarred':
        return 'text-gray-400'

      case 'note_updated':
        return 'text-blue-300'

      case 'task_deleted':
      case 'note_deleted':
      case 'timer_cancelled':
        return 'text-red-400'

      case 'energy_logged':
        return 'text-cyan-400'

      case 'water_logged':
        return 'text-blue-400'

      case 'log_entry':
        return 'text-gray-400'

      default:
        return 'text-text-secondary'
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

      case 'log_entry':
        return log.entity_title

      default:
        return log.action_type.replace(/_/g, ' ')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-secondary">Loading activity log...</div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary">
        <Clock className="w-16 h-16 mb-4 opacity-50" />
        <p>No activity logged yet</p>
        <p className="text-sm mt-2">Your actions will appear here</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-2">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Activity Log
        </h1>

        {/* Time Filter bar */}
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            onClick={() => setTimeFilter('today')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              timeFilter === 'today'
                ? 'bg-green-500 text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeFilter('yesterday')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              timeFilter === 'yesterday'
                ? 'bg-green-500 text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setTimeFilter('week')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              timeFilter === 'week'
                ? 'bg-green-500 text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              timeFilter === 'all'
                ? 'bg-green-500 text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            All
          </button>
        </div>

        {/* Category Filter bar */}
        <div className="mb-4 flex flex-wrap gap-2 pb-3 border-b border-border-secondary">
          <button
            onClick={() => toggleFilter('textLogs')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filters.textLogs
                ? 'bg-gray-500 text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            Text Logs
          </button>
          <button
            onClick={() => toggleFilter('taskActivity')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filters.taskActivity
                ? 'bg-blue-500 text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            Task Activity
          </button>
          <button
            onClick={() => toggleFilter('noteActivity')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filters.noteActivity
                ? 'bg-purple-500 text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            Note Activity
          </button>
          <button
            onClick={() => toggleFilter('other')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filters.other
                ? 'bg-cyan-500 text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            Other
          </button>
        </div>

        {/* Log entries grouped by date */}
        {Object.keys(groupedLogs).map(dateKey => (
          <div key={dateKey} className="mb-4">
            {/* Date header */}
            <div className="sticky top-0 bg-bg-primary/95 backdrop-blur-sm py-1 mb-1.5 border-b border-border-secondary">
              <h2 className="text-lg font-medium text-text-primary">{dateKey}</h2>
            </div>

            {/* Log entries for this date */}
            <div className="space-y-0.5">
              {groupedLogs[dateKey].map(log => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 px-2 py-1.5"
                >
                  {/* Time */}
                  <div className="text-xs text-text-tertiary font-mono min-w-[60px] pt-0.5">
                    {formatTime(log.timestamp)}
                  </div>

                  {/* Icon (only for non-log_entry and non-energy types) */}
                  {log.action_type !== 'log_entry' && log.action_type !== 'energy_logged' && (
                    <div className={`pt-0.5 ${getActionColor(log.action_type)}`}>
                      {getActionIcon(log.action_type)}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className={`text-sm ${log.action_type === 'log_entry' ? 'text-gray-500 font-bold' : 'text-gray-400'}`}>
                        {formatActionText(log)}
                      </span>

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

                      {/* Entity title for non-ref items (only for timer, not log_entry) */}
                      {!log.entity_ref_id && log.entity_title && log.action_type !== 'log_entry' && log.action_type !== 'energy_logged' && log.action_type !== 'water_logged' && (
                        <span className="text-text-primary text-sm font-medium">
                          "{log.entity_title}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

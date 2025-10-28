import { useState, useEffect } from 'react'
import { Clock, FileText, CheckSquare, FolderKanban, Timer as TimerIcon, Star, Calendar, Trash2 } from 'lucide-react'
import * as activityLogService from '../services/activityLogService'
import RefIdBadge from './RefIdBadge'

/**
 * LogPage Component
 * Displays activity log entries grouped by date
 * Shows all user actions: task creation, note updates, status changes, etc.
 */
export default function LogPage({ onRefIdNavigate }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupedLogs, setGroupedLogs] = useState({})

  useEffect(() => {
    fetchLogs()
  }, [])

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
   * Group logs by date for better organization
   * Returns: { 'Today': [...], 'Yesterday': [...], 'Jan 25': [...] }
   */
  const groupLogsByDate = (logs) => {
    const grouped = {}
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    logs.forEach(log => {
      const logDate = new Date(log.timestamp)
      const dateKey = getDateKey(logDate, today, yesterday)

      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(log)
    })

    setGroupedLogs(grouped)
  }

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
      case 'task_created':
      case 'task_completed':
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
                  className="flex items-start gap-2 px-2 py-1.5"
                >
                  {/* Time */}
                  <div className="text-xs text-text-tertiary font-mono min-w-[60px] pt-0.5">
                    {formatTime(log.timestamp)}
                  </div>

                  {/* Icon */}
                  <div className={`pt-0.5 ${getActionColor(log.action_type)}`}>
                    {getActionIcon(log.action_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-text-secondary text-sm">
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

                      {/* Entity title for non-ref items (like timer) */}
                      {!log.entity_ref_id && log.entity_title && (
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

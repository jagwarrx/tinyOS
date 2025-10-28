/**
 * CollapsibleFilterBar Component
 *
 * A collapsible filter interface with icon-only and expanded states.
 * Supports two filter types: Task Type (radio) and Status (checkbox)
 */

import { useState } from 'react'
import {
  Brain,
  Zap,
  Wrench,
  Users,
  Compass,
  Inbox,
  Calendar,
  Play,
  AlertCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

export default function CollapsibleFilterBar({
  selectedTaskType = null,
  selectedStatuses = [],
  onTaskTypeChange,
  onStatusChange,
  tasks = []
}) {
  const [isTaskTypeExpanded, setIsTaskTypeExpanded] = useState(true)
  const [isStatusExpanded, setIsStatusExpanded] = useState(true)

  const taskTypeOptions = [
    { value: 'DEEP_WORK', label: 'Deep Work', icon: Brain },
    { value: 'QUICK_WINS', label: 'Quick Wins', icon: Zap },
    { value: 'GRUNT_WORK', label: 'Grunt Work', icon: Wrench },
    { value: 'PEOPLE_TIME', label: 'People Time', icon: Users },
    { value: 'STRATEGIC', label: 'Strategic', icon: Compass }
  ]

  const statusOptions = [
    { value: 'BACKLOG', label: 'Backlog', icon: Inbox, color: 'gray' },
    { value: 'PLANNED', label: 'Planned', icon: Calendar, color: 'gray' },
    { value: 'DOING', label: 'Doing', icon: Play, color: 'gray' },
    { value: 'BLOCKED', label: 'Blocked', icon: AlertCircle, color: 'amber' }
  ]

  const handleTaskTypeToggle = (value) => {
    // Radio behavior - clicking same option deselects it
    if (selectedTaskType === value) {
      onTaskTypeChange?.(null)
    } else {
      onTaskTypeChange?.(value)
    }
  }

  const handleStatusToggle = (value) => {
    // Checkbox behavior - multiple selections allowed
    const newSelected = selectedStatuses.includes(value)
      ? selectedStatuses.filter(s => s !== value)
      : [...selectedStatuses, value]
    onStatusChange?.(newSelected)
  }

  // Count tasks for each task type
  const getTaskTypeCount = (taskType) => {
    return tasks.filter(task => task.task_type === taskType).length
  }

  // Count tasks for each status
  const getStatusCount = (status) => {
    return tasks.filter(task => task.status === status).length
  }

  const getStatusColorClasses = (color, isActive) => {
    if (!isActive) {
      return 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
    }

    switch (color) {
      case 'amber':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500'
      case 'green':
        return 'bg-green-500/20 text-green-600 dark:text-green-500'
      case 'gray':
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
      default:
        return 'text-gray-400 dark:text-gray-500'
    }
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
      {/* Task Type Filter Bar */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500">Type</span>

        <div className={`flex items-center gap-1 rounded border transition-all duration-200 ${
          isTaskTypeExpanded ? 'px-2 py-1' : 'px-1.5 py-0.5'
        } bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`}>
          {taskTypeOptions.map(({ value, label, icon: Icon }) => {
            const isActive = selectedTaskType === value
            const count = getTaskTypeCount(value)
            return (
              <button
                key={value}
                onClick={() => handleTaskTypeToggle(value)}
                className={`flex items-center gap-1 rounded transition-all duration-200 ${
                  isTaskTypeExpanded ? 'px-1.5 py-0.5' : 'p-1'
                } ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title={!isTaskTypeExpanded ? label : undefined}
              >
                <Icon size={12} strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className={`text-[10px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isTaskTypeExpanded ? 'max-w-[150px] opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  {label} {count > 0 && `(${count})`}
                </span>
              </button>
            )
          })}

          <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />

          <button
            onClick={() => setIsTaskTypeExpanded(!isTaskTypeExpanded)}
            className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title={isTaskTypeExpanded ? 'Collapse' : 'Expand'}
          >
            {isTaskTypeExpanded ? (
              <ChevronLeft size={10} />
            ) : (
              <ChevronRight size={10} />
            )}
          </button>
        </div>
      </div>

      {/* Status Filter Bar */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500">Status</span>

        <div className={`flex items-center gap-1 rounded border transition-all duration-200 ${
          isStatusExpanded ? 'px-2 py-1' : 'px-1.5 py-0.5'
        } bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`}>
          {statusOptions.map(({ value, label, icon: Icon, color }) => {
            const isActive = selectedStatuses.includes(value)
            const count = getStatusCount(value)
            return (
              <button
                key={value}
                onClick={() => handleStatusToggle(value)}
                className={`flex items-center gap-1 rounded transition-all duration-200 ${
                  isStatusExpanded ? 'px-1.5 py-0.5' : 'p-1'
                } ${getStatusColorClasses(color, isActive)}`}
                title={!isStatusExpanded ? label : undefined}
              >
                <Icon size={12} strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className={`text-[10px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
                    isStatusExpanded ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  {label} {count > 0 && `(${count})`}
                </span>
              </button>
            )
          })}

          <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />

          <button
            onClick={() => setIsStatusExpanded(!isStatusExpanded)}
            className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title={isStatusExpanded ? 'Collapse' : 'Expand'}
          >
            {isStatusExpanded ? (
              <ChevronLeft size={10} />
            ) : (
              <ChevronRight size={10} />
            )}
          </button>
        </div>
      </div>

      {/* Clear Filters Button */}
      {(selectedTaskType || selectedStatuses.length > 0) && (
        <button
          onClick={() => {
            onTaskTypeChange?.(null)
            onStatusChange?.([])
          }}
          className="ml-auto text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}

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
  ChevronLeft,
  Tag as TagIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import TagFilter from './TagFilter'

export default function CollapsibleFilterBar({
  selectedTaskType = null,
  selectedStatuses = [],
  selectedTagIds = [],
  onTaskTypeChange,
  onStatusChange,
  onTagsChange,
  tasks = []
}) {
  const [isTaskTypeExpanded, setIsTaskTypeExpanded] = useState(true)
  const [isStatusExpanded, setIsStatusExpanded] = useState(true)
  const [showTagPanel, setShowTagPanel] = useState(false)

  const taskTypeOptions = [
    { value: 'DEEP_WORK', label: 'Deep Work', icon: Brain },
    { value: 'QUICK_WINS', label: 'Quick Wins', icon: Zap },
    { value: 'GRUNT_WORK', label: 'Grunt Work', icon: Wrench },
    { value: 'PEOPLE_TIME', label: 'People Time', icon: Users },
    { value: 'STRATEGIC', label: 'Planning', icon: Compass }
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
      return 'text-fg-tertiary hover:text-fg-secondary'
    }

    switch (color) {
      case 'amber':
        return 'bg-syntax-yellow/20 text-syntax-yellow'
      case 'green':
        return 'bg-syntax-green/20 text-syntax-green'
      case 'gray':
        return 'bg-fg-tertiary/20 text-fg-secondary'
      default:
        return 'text-fg-tertiary'
    }
  }

  return (
    <div className="relative">
    <div className="flex items-center gap-3 px-3 py-2 bg-bg-secondary border-b border-border-primary">
      {/* Task Type Filter Bar */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-fg-tertiary">Experience</span>

        <div className={`flex items-center gap-1 rounded border transition-all duration-200 ${
          isTaskTypeExpanded ? 'px-2 py-1' : 'px-1.5 py-0.5'
        } bg-bg-primary border-border-primary`}>
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
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-fg-tertiary hover:text-fg-secondary'
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

          <div className="w-px h-3 bg-border-primary" />

          <button
            onClick={() => setIsTaskTypeExpanded(!isTaskTypeExpanded)}
            className="p-0.5 rounded hover:bg-bg-tertiary text-fg-tertiary hover:text-fg-secondary transition-colors"
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
        <span className="text-[10px] uppercase tracking-wider font-semibold text-fg-tertiary">Status</span>

        <div className={`flex items-center gap-1 rounded border transition-all duration-200 ${
          isStatusExpanded ? 'px-2 py-1' : 'px-1.5 py-0.5'
        } bg-bg-primary border-border-primary`}>
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

          <div className="w-px h-3 bg-border-primary" />

          <button
            onClick={() => setIsStatusExpanded(!isStatusExpanded)}
            className="p-0.5 rounded hover:bg-bg-tertiary text-fg-tertiary hover:text-fg-secondary transition-colors"
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

      {/* Tags Filter Button */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-fg-tertiary">Tags</span>

        <button
          onClick={() => setShowTagPanel(!showTagPanel)}
          className={`flex items-center gap-1 rounded border px-2 py-1 transition-all ${
            selectedTagIds.length > 0
              ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/30'
              : 'bg-bg-primary border-border-primary text-fg-tertiary hover:text-fg-secondary'
          }`}
        >
          <TagIcon size={12} strokeWidth={selectedTagIds.length > 0 ? 2.5 : 2} />
          <span className="text-[10px] font-medium">
            {selectedTagIds.length > 0 ? `${selectedTagIds.length} selected` : 'Filter'}
          </span>
          {showTagPanel ? (
            <ChevronUp size={10} />
          ) : (
            <ChevronDown size={10} />
          )}
        </button>
      </div>

      {/* Clear Filters Button */}
      {(selectedTaskType || selectedStatuses.length > 0 || selectedTagIds.length > 0) && (
        <button
          onClick={() => {
            onTaskTypeChange?.(null)
            onStatusChange?.([])
            onTagsChange?.([])
          }}
          className="ml-auto text-[10px] text-fg-tertiary hover:text-fg-secondary transition-colors"
        >
          Clear All
        </button>
      )}
    </div>

      {/* Tag Filter Panel (Dropdown) */}
      {showTagPanel && (
        <div className="absolute left-0 right-0 top-full z-50 bg-bg-elevated border-b border-l border-r border-border-primary shadow-lg">
          <div className="p-4 max-w-2xl mx-auto">
            <TagFilter
              selectedTagIds={selectedTagIds}
              onTagsChange={onTagsChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}
